export declare const CARTRIDGE_SPEC_VERSION: '1'

export declare function isValidCartridgeId(id: string): boolean
export declare function idToTablePrefix(id: string): string
export declare function isTableNameValid(
  tableName: string,
  cartridgeId: string,
  tablePrefix?: string,
): boolean

export declare const ALLOWED_DIRS: readonly [
  'routes', 'server', 'components', 'db', 'lifecycle', 'assets',
]
export type AllowedDir = typeof ALLOWED_DIRS[number]

export type ValidationIssue = {
  severity: 'error' | 'warning'
  file?:    string
  line?:    number
  message:  string
  /** 短い分類ラベル（'forbidden-import' / 'data-access' / 'schema:rls-disabled' 等）。任意。 */
  rule?:    string
  /** 具体的な短い値（import 指定子・テーブル名・ポリシー名等）。UI 表示用。任意。 */
  spec?:    string
}

export type ValidationResult = {
  /** issues に error が 0 件なら true */
  ok:        boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manifest:  any | null
  issues:    ValidationIssue[]
}

export type ValidateCartridgeOptions = {
  /**
   * ホスト固有の禁止 import プレフィックス（ホストの内部モジュールを
   * カートリッジに import させないためのファイアウォール）。
   * 例: 本体は ['@/lib/auth/', '@/core/', '@/lib/supabase/']、
   *     Studio は ['@/lib/', '@/components/', '@/types/', '@/core/', '@/app/']。
   */
  forbiddenImportPrefixes?: string[]
}

export declare function validateCartridge(
  dir:  string,
  opts?: ValidateCartridgeOptions,
): ValidationResult
