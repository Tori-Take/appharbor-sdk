/**
 * @appharbor/sdk — サーバーサイド SDK
 *
 * このパッケージは「契約 (interface)」を定義します。
 * 実際の実装はホスト環境（AppHarbor Studio / AppHarbor 本番）が
 * webpack alias 等で提供します。
 *
 * カートリッジは以下のように使用:
 *
 *   import { requireApp, getAdminSupabase } from '@appharbor/sdk'
 *
 *   export default async function Page({ params }) {
 *     const { slug } = await params
 *     const ctx = await requireApp(slug, 'my-cartridge')
 *     const supabase = getAdminSupabase()
 *     // ...
 *   }
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Actor,
  AppContext,
  GetAppRoleArgs,
  OrgRole,
  RequireActorResult,
  RequirePlatformAdminResult,
} from './types'

export type {
  Actor,
  AppContext,
  CartridgeManifest,
  CartridgeNavItem,
  CartridgePermission,
  DepartmentRow,
  GetAppRoleArgs,
  OrganizationRow,
  OrgRole,
  AppRow,
  PlatformActor,
  PlatformRole,
  ProfileRow,
  RequireActorResult,
  RequirePlatformAdminResult,
} from './types'

// ============================================================
// 認証 / アクセス制御
// ============================================================

/**
 * カートリッジページで認証 + アプリロールチェックを行う。
 *
 * 第 3 引数 gate が指定された場合、role を受け取って boolean を返す
 * ガード関数として動作する。false なら 403 リダイレクト。
 *
 * @example
 * const ctx = await requireApp(slug, 'my-cartridge')
 * const ctx = await requireApp(slug, 'my-cartridge', (role) => role === 'admin')
 */
export async function requireApp(
  _slug: string,
  _appId: string,
  _gate?: (role: string | null) => boolean,
): Promise<AppContext> {
  throw new Error(
    '[@appharbor/sdk] requireApp() スタブが呼ばれました。' +
    'ホスト環境 (Studio / AppHarbor) で実装に差し替えてください。',
  )
}

/**
 * 組織メンバーであることだけを検証（アプリロールは確認しない）。
 * 主に API ルートで使用。
 *
 * @example
 * const guard = await requireActor(slug, 'member')
 * if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 403 })
 */
export async function requireActor(
  _slug: string,
  _minRole?: OrgRole,
): Promise<RequireActorResult> {
  throw new Error(
    '[@appharbor/sdk] requireActor() スタブが呼ばれました。' +
    'ホスト環境 (Studio / AppHarbor) で実装に差し替えてください。',
  )
}

/**
 * 特定ユーザーのアプリ内ロール（'viewer' / 'admin' 等）を取得。
 *
 * @example
 * const role = await getAppRole({
 *   organizationId: ctx.actor.organizationId,
 *   userId:         someUserId,
 *   departmentId:   null,
 *   appId:          'my-cartridge',
 * })
 */
export async function getAppRole(_args: GetAppRoleArgs): Promise<string | null> {
  throw new Error(
    '[@appharbor/sdk] getAppRole() スタブが呼ばれました。' +
    'ホスト環境 (Studio / AppHarbor) で実装に差し替えてください。',
  )
}

/**
 * Platform Admin 権限を要求する。
 * 組織に所属しないグローバル管理者の認証チェック。
 * /platform/** 配下の Server Action / layout で呼ぶ想定。
 *
 * @example
 * const guard = await requirePlatformAdmin()
 * if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 403 })
 */
export async function requirePlatformAdmin(): Promise<RequirePlatformAdminResult> {
  throw new Error(
    '[@appharbor/sdk] requirePlatformAdmin() スタブが呼ばれました。' +
    'ホスト環境 (Studio / AppHarbor) で実装に差し替えてください。',
  )
}

// ============================================================
// Supabase クライアント
// ============================================================

/**
 * サーバーサイドで使う Supabase クライアント (service_role 相当)。
 * RLS をバイパスする想定。サーバーコンポーネント / Server Action /
 * API ルートでのみ使用。
 *
 * @example
 * const supabase = getAdminSupabase()
 * const { data } = await supabase
 *   .from('my_items')
 *   .select('*')
 *   .eq('organization_id', ctx.actor.organizationId)
 */
export function getAdminSupabase(): SupabaseClient {
  throw new Error(
    '[@appharbor/sdk] getAdminSupabase() スタブが呼ばれました。' +
    'ホスト環境 (Studio / AppHarbor) で実装に差し替えてください。',
  )
}

/**
 * サーバーサイドで使う Supabase クライアント (ユーザー認証セッション付き)。
 * RLS が適用される。Server Component / Server Action / API ルートで使用。
 *
 * AppHarbor 本番では Cookie ベースの認証セッションを引き継ぐ。
 * Studio では Cookie のモックユーザーに対応する supabase クライアントを返す。
 *
 * @example
 * const supabase = await createServerSupabase()
 * const { data: { user } } = await supabase.auth.getUser()
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  throw new Error(
    '[@appharbor/sdk] createServerSupabase() スタブが呼ばれました。' +
    'ホスト環境 (Studio / AppHarbor) で実装に差し替えてください。',
  )
}
