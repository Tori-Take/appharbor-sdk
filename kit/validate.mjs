/**
 * カートリッジ検査の共通エンジン（カートリッジ作成工程の再設計 Step 3）。
 *
 * AppHarbor 本体（lib/cartridge/validator.ts）と AppHarbor Studio
 * （lib/cartridge-lint.ts）が別々に持っていた検査ロジックを1つに統合したもの。
 * 同じ壊れた manifest / schema.sql を渡せば、どちらのホストからでも
 * 同じエラー一覧が返る。
 *
 * ホストごとに違う部分（自分自身の内部モジュールを import させない、という
 * ファイアウォール）だけは呼び出し側が forbiddenImportPrefixes で渡す
 * （本体は @/lib/auth/ 等・Studio は @/components/ 等、境界がホストごとに違うため）。
 *
 * Node の fs/path しか使わない素の ESM（.mjs）。TypeScript の型は
 * validate.d.ts を参照。ビルドステップなしでそのまま Next.js / plain node
 * どちらからも import できる。
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

export const CARTRIDGE_SPEC_VERSION = '1'

const ID_REGEX = /^[a-z][a-z0-9-]*[a-z0-9]$/

export function isValidCartridgeId(id) {
  return ID_REGEX.test(id)
}

/** カートリッジ id をテーブル名 prefix に変換（ハイフン → アンダースコア） */
export function idToTablePrefix(id) {
  return id.replace(/-/g, '_')
}

/** テーブル名が prefix に従っているか（tablePrefix 省略時は id 由来） */
export function isTableNameValid(tableName, cartridgeId, tablePrefix) {
  const prefix = (tablePrefix ?? idToTablePrefix(cartridgeId)) + '_'
  return tableName.startsWith(prefix)
}

export const ALLOWED_DIRS = ['routes', 'server', 'components', 'db', 'lifecycle', 'assets']

// ─── 全ホスト共通の禁止パターン ──────────────────────────────
const FORBIDDEN_CALLS = [
  { re: /supabase\.auth\.(?!getUser\b)/, label: 'forbidden-call', spec: 'supabase.auth.*' },
  { re: /\beval\s*\(/, label: 'forbidden-call', spec: 'eval()' },
  { re: /\bnew Function\s*\(/, label: 'forbidden-call', spec: 'new Function()' },
]

// dataAccess: 'scoped'（省略時の既定）のカートリッジでは禁止。'privileged' のみ許可。
const ADMIN_SUPABASE_CALL = /\bgetAdminSupabase\s*\(/
const IMPORT_SPEC_RE = /\bfrom\s+['"]([^'"]+)['"]/

const CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

/**
 * カートリッジディレクトリを検査する。
 *
 * @param {string} dir カートリッジのルートディレクトリ
 * @param {object} [opts]
 * @param {string[]} [opts.forbiddenImportPrefixes] ホスト固有の禁止 import プレフィックス
 *   （本体: ['@/lib/auth/', '@/core/', '@/lib/supabase/']、
 *    Studio: ['@/lib/', '@/components/', '@/types/', '@/core/', '@/app/']）
 * @returns {{ ok: boolean, manifest: object | null, issues: Array }}
 */
export function validateCartridge(dir, opts = {}) {
  const forbiddenImportPrefixes = opts.forbiddenImportPrefixes ?? []
  const issues = []
  const error = (message, file, line, rule, spec) => issues.push({ severity: 'error', message, file, line, rule, spec })
  const warn  = (message, file, line, rule, spec) => issues.push({ severity: 'warning', message, file, line, rule, spec })

  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    error(`カートリッジディレクトリが存在しません: ${dir}`)
    return { ok: false, manifest: null, issues }
  }

  const manifestPath = join(dir, 'manifest.json')
  if (!existsSync(manifestPath)) {
    error('manifest.json がありません')
    return { ok: false, manifest: null, issues }
  }

  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  } catch (e) {
    error(`manifest.json のパース失敗: ${e.message}`, 'manifest.json')
    return { ok: false, manifest: null, issues }
  }

  // ─── manifest フィールド検証 ──────────────────────────────
  if (manifest.spec_version !== CARTRIDGE_SPEC_VERSION) {
    error(`spec_version が "${CARTRIDGE_SPEC_VERSION}" ではない: ${manifest.spec_version}`, 'manifest.json')
  }
  if (!manifest.id) {
    error('manifest.id が未指定', 'manifest.json')
  } else if (!isValidCartridgeId(manifest.id)) {
    error(`manifest.id "${manifest.id}" が命名規則違反 (小文字+ハイフン)`, 'manifest.json')
  }
  if (!manifest.version) error('manifest.version 未指定', 'manifest.json')
  if (!manifest.name) error('manifest.name 未指定', 'manifest.json')
  if (!manifest.appharbor) error('manifest.appharbor 未指定', 'manifest.json')
  if (!manifest.permissions || manifest.permissions.length === 0) {
    error('manifest.permissions が空', 'manifest.json')
  }
  const hasDeclaredTables = Array.isArray(manifest.tables) && manifest.tables.length > 0
  if (manifest.tables === undefined) {
    warn('manifest.tables 未指定（DB を使わないアプリなら "tables": [] を明記してください）', 'manifest.json')
  } else if (!hasDeclaredTables) {
    // 明示的に空配列 = DB 不要と意図的に宣言しているとみなす（何も出さない）
  } else {
    for (const t of manifest.tables) {
      if (!isTableNameValid(t, manifest.id, manifest.tablePrefix)) {
        error(`テーブル名 "${t}" が ${manifest.id} の prefix に従っていない`, 'manifest.json')
      }
    }
  }
  if (manifest.permissions) {
    const hasDefault = manifest.permissions.some((p) => p.default)
    if (!hasDefault) warn('デフォルト権限 (default: true) が未指定。組織管理画面で都度選択になる', 'manifest.json')
  }
  if (manifest.dataAccess !== undefined && manifest.dataAccess !== 'scoped' && manifest.dataAccess !== 'privileged') {
    error(`manifest.dataAccess は "scoped" か "privileged" のいずれか: ${manifest.dataAccess}`, 'manifest.json')
  }
  if (manifest.repository) {
    const url = manifest.repository.url
    if (!url) {
      error('manifest.repository.url が空', 'manifest.json')
    } else {
      try {
        const parsed = new URL(url)
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          error(`manifest.repository.url は http(s) URL である必要があります: ${url}`, 'manifest.json')
        }
      } catch {
        error(`manifest.repository.url が URL として不正: ${url}`, 'manifest.json')
      }
    }
  }

  // ─── 推奨ファイル・必須ディレクトリ ────────────────────────
  for (const f of ['README.md', 'icon.svg']) {
    if (!existsSync(join(dir, f))) warn(`${f} が無い (推奨)`)
  }
  if (!existsSync(join(dir, 'routes'))) error('routes/ ディレクトリが必須')
  // schema.sql が必須なのは manifest.tables にテーブルを宣言している場合のみ。
  // DB を使わないアプリ（tables: [] または未指定）は schema.sql が無くてよい。
  if (hasDeclaredTables && !existsSync(join(dir, 'db', 'schema.sql'))) {
    error('db/schema.sql が必須（manifest.tables にテーブルが宣言されています）')
  }

  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    let st
    try { st = statSync(full) } catch { continue }
    if (!st.isDirectory()) continue
    if (name.startsWith('.') || name === 'node_modules') continue
    if (!ALLOWED_DIRS.includes(name)) {
      warn(`不明なディレクトリ: ${name}/ (許可: ${ALLOWED_DIRS.join(', ')})`)
    }
  }

  // ─── コードファイル走査 ────────────────────────────────────
  let usesBackButton = false
  const isPrivileged = manifest.dataAccess === 'privileged'

  const scanCodeFiles = (current) => {
    const SKIP = new Set(['node_modules', '.next', '.git'])
    for (const name of readdirSync(current)) {
      if (SKIP.has(name) || name.startsWith('.')) continue
      const full = join(current, name)
      let st
      try { st = statSync(full) } catch { continue }
      if (st.isDirectory()) { scanCodeFiles(full); continue }

      const ext = extname(name)
      if (!CODE_EXTS.has(ext)) continue
      const rel = relative(dir, full).replace(/\\/g, '/')
      const code = readFileSync(full, 'utf-8')
      const lines = code.split('\n')
      if (lines.some((l) => l.includes('BackToAppHarbor'))) usesBackButton = true

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        const m = IMPORT_SPEC_RE.exec(line)
        if (m) {
          for (const prefix of forbiddenImportPrefixes) {
            if (m[1].startsWith(prefix)) {
              error(`禁止 import: ${m[1]}（本体/Studio に依存しています。@/sdk 経由に置き換えてください）`, rel, i + 1, 'forbidden-import', m[1])
              break
            }
          }
        }

        for (const fc of FORBIDDEN_CALLS) {
          if (fc.re.test(line)) {
            error(`禁止 API: ${line.trim()}`, rel, i + 1, fc.label, fc.spec)
          }
        }

        if (!isPrivileged && ADMIN_SUPABASE_CALL.test(line)) {
          error(
            'getAdminSupabase は manifest.dataAccess が "privileged" のカートリッジでのみ使用できます' +
            '（このカートリッジは未指定 = "scoped"）。組織の壁を通る createServerSupabase に置き換えるか、' +
            '社内・信頼済み作者であれば manifest.json に "dataAccess": "privileged" を明記してください。',
            rel, i + 1, 'data-access', 'getAdminSupabase()',
          )
        }
      }
    }
  }
  scanCodeFiles(dir)

  if (manifest.fullscreen === true && !usesBackButton) {
    error(
      'fullscreen: true のカートリッジには @/sdk/client の <BackToAppHarbor /> を' +
      '最低1箇所配置してください（全画面では本体メニューが出ないため、戻る導線が必須です）',
      'manifest.json', 0, 'fullscreen', 'fullscreen',
    )
  }

  // ─── db/schema.sql ─────────────────────────────────────────
  const schemaPath = join(dir, 'db', 'schema.sql')
  if (existsSync(schemaPath)) {
    lintSchemaSql(schemaPath, dir, manifest, error, warn)
  }

  return {
    ok: issues.every((i) => i.severity !== 'error'),
    manifest,
    issues,
  }
}

/**
 * db/schema.sql を解析して AppHarbor 規約に違反する箇所を検出する。
 *
 * - 非標準セッション変数 (current_setting('app.*')) の使用
 * - schema.sql 内テーブル名の prefix 違反
 * - organization_id 列の有無
 * - RLS 有効化・ポリシーの有無
 * - RLS ポリシーが auth.uid() / auth.jwt() を使っているか
 */
function lintSchemaSql(schemaPath, dir, manifest, error, warn) {
  const rel = relative(dir, schemaPath)
  // -- コメントを取り除いてから解析する。コメント中に "create table if not exists" 等の
  // 文言が書かれている（例: 説明文中の言及）と、正規表現がそれを本物の定義と誤認識するため。
  // 行の切り詰めのみ（改行そのものは残す）なので、以降の行番号計算はズレない。
  const sql = readFileSync(schemaPath, 'utf-8')
    .split('\n').map((l) => l.replace(/--.*$/, '')).join('\n')
  const lines = sql.split('\n')

  // 1. 非標準セッション変数
  const sessionVarRe = /current_setting\s*\(\s*['"]app\.[^'"]*['"]\s*\)/gi
  for (let i = 0; i < lines.length; i++) {
    sessionVarRe.lastIndex = 0
    const m = sessionVarRe.exec(lines[i])
    if (m) {
      error(
        `非標準のセッション変数 ${m[0]}。AppHarbor では設定されないため動作しない。` +
        `「organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())」パターンに置き換えてください。`,
        rel, i + 1, 'schema:session-var', m[0],
      )
    }
  }

  // 2. テーブル名 prefix チェック（簡易マッチ。CREATE TABLE 単文の閉じカッコまで見ない）
  const tableNameMatches = sql.matchAll(
    /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["`]?(?:([a-zA-Z_][a-zA-Z0-9_]*)["`]?\s*\.\s*["`]?)?([a-zA-Z_][a-zA-Z0-9_]*)/gi,
  )
  for (const m of tableNameMatches) {
    const tableName = m[2]
    if (!isTableNameValid(tableName, manifest.id, manifest.tablePrefix)) {
      error(`schema.sql 内のテーブル "${tableName}" が ${manifest.id} の prefix 違反`, rel, undefined, 'schema:table-prefix', `table ${tableName}`)
    }
  }

  // 3. テーブル本文込みで抽出 → organization_id / RLS / policy チェック
  const tableRe = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:[\w]+\.)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi
  const tables = []
  let tm
  while ((tm = tableRe.exec(sql)) !== null) {
    const before = sql.slice(0, tm.index)
    const lineNum = before.split('\n').length
    tables.push({ name: tm[1], lineNum, body: tm[2] })
  }
  const cartridgeTableNames = new Set(tables.map((t) => t.name))

  for (const t of tables) {
    if (t.name.startsWith('auth_') || t.name === 'organizations' || t.name === 'profiles') continue

    const hasOrgId = /\borganization_id\b/i.test(t.body)

    const rlsEnableRe = new RegExp(
      `alter\\s+table\\s+["\`]?${t.name}["\`]?\\s+enable\\s+row\\s+level\\s+security`,
      'i',
    )
    const rlsEnabled = rlsEnableRe.test(sql)

    const policyRe = new RegExp(
      `create\\s+policy\\s+[^\\s]+\\s+on\\s+["\`]?${t.name}["\`]?[\\s\\S]*?(?=;)`,
      'gi',
    )
    const policies = sql.match(policyRe) ?? []

    // organization_id 列が無くても、親テーブル経由でテナント境界を辿るサブテーブルは例外
    let isSubTable = false
    if (!hasOrgId && policies.length > 0) {
      for (const p of policies) {
        const subqueryRe = /from\s+["`]?(\w+)["`]?[\s\S]*?\borganization_id\b/gi
        let sm
        while ((sm = subqueryRe.exec(p)) !== null) {
          if (cartridgeTableNames.has(sm[1])) { isSubTable = true; break }
        }
        if (isSubTable) break
      }
    }

    if (!hasOrgId && !isSubTable) {
      warn(
        `テーブル "${t.name}" に organization_id 列がありません。` +
        `テナント境界を担保するため、organization_id を追加するか、` +
        `親テーブル経由でテナント境界を辿る RLS ポリシーを書いてください。`,
        rel, t.lineNum, 'schema:org-id', `table ${t.name}`,
      )
      continue
    }

    if (!rlsEnabled) {
      error(
        `テーブル "${t.name}" で RLS が有効化されていません。` +
        `\`alter table ${t.name} enable row level security;\` を追加してください。`,
        rel, t.lineNum, 'schema:rls-disabled', `table ${t.name}`,
      )
    }

    if (policies.length === 0) {
      error(
        `テーブル "${t.name}" に RLS ポリシーがありません。` +
        `select / insert / delete のポリシーを定義してください。`,
        rel, t.lineNum, 'schema:no-policy', `table ${t.name}`,
      )
    } else {
      for (const policy of policies) {
        const usesAuthUid = /auth\.uid\s*\(\s*\)/.test(policy)
        const usesAuthJwt = /auth\.jwt\s*\(\s*\)/.test(policy)
        if (!usesAuthUid && !usesAuthJwt) {
          const nameMatch = policy.match(/create\s+policy\s+([^\s]+)/i)
          const policyName = nameMatch?.[1] ?? '(unknown)'
          const idx = sql.indexOf(policy)
          const lineNum = sql.slice(0, idx).split('\n').length
          warn(
            `RLS ポリシー "${policyName}" が auth.uid() / auth.jwt() のいずれも使っていません。` +
            `AppHarbor 標準パターン:` +
            `(a)「organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())」` +
            ` または ` +
            `(b)「organization_id = (auth.jwt() ->> 'organization_id')::uuid」`,
            rel, lineNum, 'schema:policy-pattern', policyName,
          )
        }
      }
    }
  }
}
