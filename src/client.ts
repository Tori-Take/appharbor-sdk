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
import type { ReactElement } from 'react'

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

/** `<BackToAppHarbor />` の props。 */
export interface BackToAppHarborProps {
  /** ボタンの文言（既定: 'AppHarbor に戻る'） */
  label?: string
  /** 独自スタイルを当てる場合の className（指定時は既定の固定スタイルを無効化） */
  className?: string
}

/**
 * 全画面カートリッジ（manifest の `fullscreen: true`）で「本体に戻る」導線を出すボタン。
 *
 * 全画面では本体のヘッダー / サイドバー / ボトムナビが隠れて戻る手段が無くなるため、
 * `fullscreen: true` のカートリッジはこれを最低 1 箇所置くこと
 * （Studio の規約チェックで必須）。押すと本体のアプリ一覧 `/org/<slug>/apps` に戻る。
 *
 * @example
 * 'use client'
 * import { BackToAppHarbor } from '@appharbor/sdk/client'
 *
 * export default function Page() {
 *   return (
 *     <main>
 *       <BackToAppHarbor />
 *       {/* ゲーム本体など *\/}
 *     </main>
 *   )
 * }
 */
export function BackToAppHarbor(_props: BackToAppHarborProps): ReactElement {
  throw new Error(
    '[@appharbor/sdk/client] BackToAppHarbor スタブが呼ばれました。' +
    'ホスト環境 (Studio / AppHarbor) で実装に差し替えてください。',
  )
}
