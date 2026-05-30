# AppHarbor カートリッジ作者向け 規約プロンプト

> このファイルは `@appharbor/sdk` から AI (Claude Code / Cursor / Copilot 等) に
> 渡される **「カートリッジを書くときに必ず守るべきルール」** を集約しています。
> AppHarbor Studio の `ai-context` API がこのファイルを読み込み、SDK 型定義 + README
> と一緒に AI へのコンテキストとして配信します。

---

## 1. カートリッジ作者の責務 (たった 3 つ)

1. **`db/schema.sql`** — テーブル定義 (全テーブルに `organization_id` を必須)
2. **`manifest.json`** — メタ情報 (id / name / permissions / navigation)
3. **`routes/*`** — 必ず `organization_id` でフィルタする Next.js ページ / API

これ以外のことは SDK / ホスト環境 (Studio / AppHarbor 本番) が担当します。

---

## 2. マルチテナント設計の鉄則

カートリッジは複数組織が同じ DB を共有する **マルチテナント** 環境で動きます。
以下の鉄則を破ると **他組織のデータが見えてしまう / 壊れる** 重大バグになります。

- **全テーブルに `organization_id uuid REFERENCES organizations(id)` を持たせる**
- **RLS ポリシーで `organization_id` を必ずフィルタ条件にする**
- **全クエリで `.eq('organization_id', ctx.actor.organizationId)` を必ず付ける**
- **`db/schema.sql` を単一ソースとする** (本番用 migration は CI / リリーススクリプトが自動生成)

```ts
// ✅ 正しい
const ctx = await requireApp(slug, 'my-cartridge')
const supabase = getAdminSupabase()
const { data } = await supabase
  .from('my_items')
  .select('*')
  .eq('organization_id', ctx.actor.organizationId)

// ❌ NG: organization_id フィルタ忘れ → 全組織のデータが返る
const { data } = await supabase.from('my_items').select('*')
```

---

## 3. import 規約

カートリッジから import できるのは以下のみです (Studio の lint が検出します):

| 許可 | 例 |
|---|---|
| `@appharbor/sdk` / `@appharbor/sdk/client` / `@appharbor/sdk/types` | `import { requireApp } from '@appharbor/sdk'` |
| `react` / `react-dom` | `import { useState } from 'react'` |
| `next/*` | `import Link from 'next/link'` |
| 相対パス | `import { Foo } from './components/Foo'` |
| npm パッケージ | `import { format } from 'date-fns'` |

**禁止**:
- `@/lib/*` / `@/components/*` / `@/app/*` — Studio 内部モジュール (本番では存在しない)
- ホスト環境固有の API (Studio の `/api/pg-query` 等を直接叩く等)

---

## 4. 認証 / 権限の必須パターン

### サーバーコンポーネント / Server Action / API ルート

```ts
import { requireApp, getAdminSupabase } from '@appharbor/sdk'

// ページレベル (slug は params から取る)
const ctx = await requireApp(slug, 'my-cartridge')

// 管理者専用ページ
const ctx = await requireApp(slug, 'my-cartridge', (role) => role === 'admin')

// API ルートの場合は requireActor
const guard = await requireActor(slug, 'member')
if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: 403 })
```

### ブラウザ (クライアントコンポーネント)

```tsx
'use client'
import { createBrowserSupabase } from '@appharbor/sdk/client'

const supabase = createBrowserSupabase()
// supabase.from(...).select(...) で読み書き可能
```

### 全画面表示（任意）

ゲームや没入系アプリは `manifest.json` に `fullscreen: true` を指定すると、本体の chrome（ヘッダー / サイドバー / ボトムナビ）を隠して全画面表示できます。その場合、本体の戻る導線が消えるため `@appharbor/sdk/client` の `<BackToAppHarbor />` を**最低 1 箇所必ず配置**してください（置かないと Studio の規約チェックが error になります）。

```tsx
'use client'
import { BackToAppHarbor } from '@appharbor/sdk/client'

export default function Page() {
  return <main><BackToAppHarbor />{/* ゲーム本体 */}</main>
}
```

---

## 5. スキーマ設計の推奨

- 主キーは `id uuid primary key default gen_random_uuid()`
- `created_at timestamptz not null default now()`
- 監査が必要なら `created_by uuid references auth.users(id)` と `updated_at`
- 外部キー先のテーブルも **同じ organization_id を持つ** ことを必ず CHECK or RLS で担保

```sql
create table if not exists my_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  created_at      timestamptz not null default now()
);

alter table my_items enable row level security;

create policy "select_same_org" on my_items
  for select using (organization_id = (auth.jwt() ->> 'organization_id')::uuid);
```

---

## 6. 通知 (お知らせ) を送る

組織メンバー / 部署 / 特定ユーザーへ通知を送れます。`source_app_id` /
`organization_id` / `created_by` はホスト環境が自動補完するので、呼び出し側は
`title` / `body` / `scope` / `target` だけ渡します。

```ts
import { notify } from '@appharbor/sdk'

// 組織全員へ
await notify({ title: '月次レポートが公開されました' })

// 特定ユーザーへ (承認依頼など)
await notify({
  title: '承認待ちがあります',
  scope: 'user',
  targetUserId: approverId,
  link:  `/org/${slug}/apps/my-cartridge/admin/approvals`,
})
```

---

## 7. やってはいけないこと

- ❌ `organization_id` のないテーブルを作る
- ❌ クエリで `organization_id` フィルタを忘れる
- ❌ Studio 内部 (`@/lib/*` 等) を import する
- ❌ `db/schema.sql` を経由せず本番 Supabase に直接 SQL を流す
- ❌ `requireApp` / `requireActor` を通さず Supabase を直接叩く (RLS が効かないことがある)
- ❌ ホスト環境を判別する分岐 (`if (process.env.STUDIO)` 等) — SDK の抽象化を信じる
