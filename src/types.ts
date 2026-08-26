/**
 * AppHarbor SDK 型定義
 *
 * 3 環境（Studio ローカル / Studio Deploy / AppHarbor 本番）で共有される型。
 * カートリッジコードはこれらの型を使ってビジネスロジックを書く。
 */

// ─── 認証主体 ─────────────────────────────────────────────

/**
 * カートリッジを操作している「ユーザー」。
 * organizationId はマルチテナント境界の基準なので必須。
 */
export interface Actor {
  /** プロフィール ID（profiles.id） */
  id: string
  /** 所属組織 ID。全クエリでこの値を `.eq('organization_id', ...)` する */
  organizationId: string
  /** 所属部署 ID（任意） */
  departmentId: string | null
}

/** 組織レベルのロール */
export type OrgRole = 'member' | 'dept-admin' | 'org-admin'

/** プラットフォーム全体の管理者か */
export type PlatformRole = 'platform-admin' | null

/**
 * Platform Admin の認証主体。組織に所属しないので organizationId を持たない。
 * 実装側 (AppHarbor / Studio) は追加プロパティを足してよいが、最低限ここを満たす。
 */
export interface PlatformActor {
  id:    string
  email: string
}

// ─── アプリコンテキスト ───────────────────────────────────

/**
 * `requireApp()` の戻り値。
 * アプリ内のロールが解決された状態。
 */
export interface AppContext {
  actor: Actor
  /** アプリ内ロール（manifest.permissions の id）。例: 'viewer' / 'admin' */
  role: string | null
}

// ─── ガード関数の戻り値 ───────────────────────────────────

/** `requireActor()` の戻り値 */
export type RequireActorResult =
  | { ok: true;  actor: Actor }
  | { ok: false; error: string }

/** `requirePlatformAdmin()` の戻り値 */
export type RequirePlatformAdminResult =
  | { ok: true;  actor: PlatformActor }
  | { ok: false; error: string }

// ─── アプリロール解決 ─────────────────────────────────────

export interface GetAppRoleArgs {
  organizationId: string
  userId:         string
  departmentId:   string | null
  appId:          string
}

// ─── プラットフォーム共通テーブル（参照用） ──────────────

export interface OrganizationRow {
  id:         string
  slug:       string
  name:       string
  status:     'active' | 'suspended' | 'archived'
  deleted_at: string | null
}

export interface ProfileRow {
  id:              string
  organization_id: string
  department_id:   string | null
  org_role:        OrgRole
  display_name:    string | null
  status:          'active' | 'invited' | 'suspended' | 'removed'
}

export interface DepartmentRow {
  id:              string
  organization_id: string
  parent_id:       string | null
  name:            string
  display_order:   number
  deleted_at:      string | null
}

export interface AppRow {
  id:                 string
  app_id:             string
  display_name:       string
  description:        string | null
  version:            string
  icon:               string | null
  permissions:        string[]
  default_permission: string | null
  status:             'active' | 'archived'
}

// ─── manifest.json の型 ───────────────────────────────────

export interface CartridgePermission {
  id:      string
  label:   string
  default?: boolean
}

export interface CartridgeNavItem {
  label: string
  path:  string
}

/**
 * カートリッジのソースリポジトリ情報。
 * 改修ループ（独立リポジトリで編集 → AppHarbor に再取り込み）の起点となる出所メタデータ。
 */
export interface CartridgeRepository {
  url:     string   // 必須: 例 "https://github.com/user/typingdash-cartridge"
  ref?:    string   // 任意: branch / tag (デフォルト: リポジトリの default branch)
  commit?: string   // 任意: 取り込み時の commit SHA（スナップショット記録）
}

export interface CartridgeManifest {
  $schema?:        string
  spec_version?:   string
  id:              string
  version:         string
  name:            string
  description?:    string
  icon?:           string
  category?:       string
  author?: {
    name?: string
    url?:  string
    email?: string
  }
  repository?:     CartridgeRepository
  /**
   * データアクセスの信頼レベル。
   *   'scoped'（省略時の既定）… getAdminSupabase（マスターキー）の使用を禁止。
   *     createServerSupabase 経由で組織の壁（RLS）の中でしか動けない。外部作者はこれ必須。
   *   'privileged' … getAdminSupabase の使用を許可。社内・信頼済み作者のみ。
   * 詳細: カートリッジ作成工程の再設計 §2（AppHarbor リポジトリ docs/plan-cartridge-pipeline-redesign.md）
   */
  dataAccess?:     'scoped' | 'privileged'
  permissions:     CartridgePermission[]
  navigation?:     CartridgeNavItem[]
  /** カートリッジが作成するテーブル名の共通プレフィックス（例: 'patrol'） */
  tablePrefix?:    string
  /**
   * db/schema.sql で作成する全テーブル名。
   * AppHarbor 本番の「DB セットアップ」ダイアログがこの配列を見て本番 Supabase に
   * テーブルが存在するかを確認する。schema.sql にテーブルを足したらここにも追加する。
   */
  tables?:         string[]
  studioCompatible?: boolean
  /**
   * true のとき本体 chrome（ヘッダー / サイドバー / ボトムナビ）を隠して全画面表示する（既定 false）。
   * 全画面アプリは本体メニューが出ないため、`@appharbor/sdk/client` の `<BackToAppHarbor />` を
   * 最低 1 箇所置くこと（戻る導線が必須。Studio の規約チェックで強制される）。
   */
  fullscreen?:     boolean
  depends?:        string[]   // 他カートリッジ id
  emits?:          string[]   // イベント名
  subscribes?:     string[]   // 購読イベント名
}

// ─── 通知（インフォ） ────────────────────────────────────

/** 通知の配信スコープ */
export type NotifyScope = 'org' | 'dept' | 'user'

/**
 * `notify()` の入力ペイロード。
 * カートリッジから AppHarbor プラットフォームの「お知らせ」へ通知を発火する。
 *
 * 自動補完される（呼び出し側で渡す必要なし）:
 *   - source_app_id   : ホスト環境がリクエストヘッダー (x-cartridge-id) から解決
 *   - organization_id : ホスト環境が現在の組織から解決
 *   - created_by      : ホスト環境が現在のユーザーから解決
 *
 * @example
 * await notify({
 *   title: '巡回点検の承認待ちがあります',
 *   body:  '田中さんが提出しました',
 *   scope: 'user',
 *   targetUserId: '...',
 *   link:  '/org/<slug>/apps/patrol-navi/admin/approvals',
 * })
 */
export interface NotifyInput {
  /** 通知のタイトル（必須） */
  title:         string
  /** 通知の本文 */
  body?:         string
  /** クリック時に遷移する URL（相対パス推奨） */
  link?:         string
  /** 配信スコープ。デフォルト 'org' */
  scope?:        NotifyScope
  /** scope='dept' のとき必須。対象部署 ID */
  targetDeptId?: string | null
  /** scope='user' のとき必須。対象ユーザー ID */
  targetUserId?: string | null
  /**
   * 発信元カートリッジ ID。
   * 通常は middleware が x-cartridge-id ヘッダーから自動解決するので渡さなくてよい。
   * カートリッジルート外 (cron job, 外部 webhook) から発火する時のみ明示指定。
   */
  sourceAppId?:  string
}

/** `notify()` の戻り値 */
export interface NotifyResult {
  /** 作成された通知の ID */
  id: string
}

/**
 * 通知行（Studio / AppHarbor 本体の UI が表示用に取得する shape）。
 * カートリッジ作者が直接これを構築することはない。Studio chrome の Bell UI 等が使う。
 */
export interface NotificationRow {
  id:              string
  sourceAppId:     string
  organizationId:  string
  scope:           NotifyScope
  targetDeptId:    string | null
  targetUserId:    string | null
  title:           string
  body:            string
  link:            string | null
  createdBy:       string | null
  createdAt:       string
  /** 現在のユーザーから見た既読時刻（未読なら null） */
  readAt:          string | null
}
