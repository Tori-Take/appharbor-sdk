# @appharbor/sdk

AppHarbor カートリッジ開発用 SDK の **契約（インターフェース・型定義）** パッケージ。

```ts
import { requireApp, getAdminSupabase, type Actor } from '@appharbor/sdk'
import { createBrowserSupabase } from '@appharbor/sdk/client'
```

---

## 役割

このパッケージは **型と関数シグネチャだけ** を提供します。
実際の実装はホスト環境が提供します:

| ホスト | 実装 |
|---|---|
| **AppHarbor Studio**（カートリッジ開発環境） | PGlite + Cookie ベースのモック実装 |
| **AppHarbor Studio (Vercel デプロイ版)** | 本番 Supabase の `studio` スキーマ実装 |
| **AppHarbor 本番** | 本番 Supabase の `public` スキーマ実装 |

カートリッジは `@appharbor/sdk` だけを意識すれば、3 環境すべてで同じコードが動きます。

---

## インストール

```json
{
  "dependencies": {
    "@appharbor/sdk": "github:Tori-Take/sdk#main"
  }
}
```

特定タグを指定する場合:

```json
"@appharbor/sdk": "github:Tori-Take/sdk#v0.1.0"
```

---

## 公開 API

### サーバーサイド (`@appharbor/sdk`)

| 関数 | 用途 |
|---|---|
| `requireApp(slug, appId, gate?)` | カートリッジページの認証 + ロールチェック |
| `requireActor(slug, minRole?)` | 組織メンバー認証（API ルート向け） |
| `getAppRole(args)` | 特定ユーザーのアプリ内ロール取得 |
| `getAdminSupabase()` | サーバーサイド Supabase クライアント (service_role) |

### ブラウザサイド (`@appharbor/sdk/client`)

| 関数 | 用途 |
|---|---|
| `createBrowserSupabase()` | クライアントコンポーネント用 Supabase クライアント |

### 型 (`@appharbor/sdk/types` または `@appharbor/sdk`)

```ts
import type {
  Actor,                  // ユーザーコンテキスト
  AppContext,             // requireApp の戻り値
  OrgRole,                // 'member' | 'dept-admin' | 'org-admin'
  RequireActorResult,     // requireActor の戻り値
  GetAppRoleArgs,         // getAppRole の引数

  // テーブル行の型（読み取り用）
  OrganizationRow,
  ProfileRow,
  DepartmentRow,
  AppRow,

  // manifest.json
  CartridgeManifest,
  CartridgePermission,
  CartridgeNavItem,
} from '@appharbor/sdk'
```

---

## 使い方

### Server Action

```ts
'use server'
import { requireApp, getAdminSupabase } from '@appharbor/sdk'

export async function createItemAction(slug: string, formData: FormData) {
  const ctx = await requireApp(slug, 'my-cartridge')
  const supabase = getAdminSupabase()

  await supabase.from('my_items').insert({
    organization_id: ctx.actor.organizationId,
    name: formData.get('name'),
  })
}
```

### サーバーコンポーネント

```tsx
import { requireApp, getAdminSupabase } from '@appharbor/sdk'

export default async function Page({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await requireApp(slug, 'my-cartridge')
  const supabase = getAdminSupabase()

  const { data } = await supabase
    .from('my_items')
    .select('*')
    .eq('organization_id', ctx.actor.organizationId)

  return <div>{/* ... */}</div>
}
```

### クライアントコンポーネント

```tsx
'use client'
import { useState } from 'react'
import { createBrowserSupabase } from '@appharbor/sdk/client'

export function UploadButton() {
  const supabase = createBrowserSupabase()
  // ...
}
```

---

## 注意

- このパッケージを直接実行しても**動きません**（スタブが throw します）。
- ホスト環境（Studio / AppHarbor）に組み込まれて初めて動作します。
- カートリッジ開発時の **TypeScript 型補完用** として利用してください。

---

## 関連リポジトリ

- [Tori-Take/cartridge-template](https://github.com/Tori-Take/cartridge-template) — カートリッジ雛形
- [Tori-Take/cart-patrol-navi](https://github.com/Tori-Take/cart-patrol-navi) — 実用カートリッジ例
- [Tori-Take/AppHarborStudio](https://github.com/Tori-Take/AppHarborStudio) — Studio （実装提供側）

---

## ライセンス

MIT
