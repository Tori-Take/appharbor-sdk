/**
 * @appharbor/sdk/client — ブラウザサイド SDK
 *
 * 'use client' のあるカートリッジコンポーネントから使用。
 *
 * @example
 * 'use client'
 * import { createBrowserSupabase } from '@appharbor/sdk/client'
 *
 * export function MyClientComponent() {
 *   const supabase = createBrowserSupabase()
 *   // ...
 * }
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * ブラウザサイド Supabase クライアントを返す。
 *
 * 認証ユーザーの権限で動作する（RLS が有効になる）。
 * Studio では service_role でバイパスされるため、本番との挙動差に注意。
 */
export function createBrowserSupabase(): SupabaseClient {
  throw new Error(
    '[@appharbor/sdk/client] createBrowserSupabase() スタブが呼ばれました。' +
    'ホスト環境 (Studio / AppHarbor) で実装に差し替えてください。',
  )
}
