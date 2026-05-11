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
  permissions:     CartridgePermission[]
  navigation?:     CartridgeNavItem[]
  studioCompatible?: boolean
}
