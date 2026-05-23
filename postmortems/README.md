# ポストモーテム マスター索引

SDK と関連リポジトリ（AppHarbor / AppHarborStudio）のポストモーテム索引。

## 役割

このリポジトリは AppHarbor エコシステムの **契約の中心** であり、
3リポジトリ全体のポストモーテムを横断的に俯瞰できる場所とする。

```
appharbor-sdk（このリポジトリ）
   ↑ 契約
   ├── AppHarbor 本体（本番実装）
   └── AppHarborStudio（開発環境実装）

各リポジトリのポストモーテム → 全部ここから辿れる
```

## ファイル命名規則

```
YYYY-MM-DD-短い説明.md
例: 2026-05-22-cascading-ci-failures.md
```

## このリポジトリで記録するもの

- **SDK 契約の不備に起因する問題**
- **複数リポジトリにまたがる横断的な問題**
- **他リポジトリのポストモーテムへの索引**

## 他リポジトリのポストモーテム

- AppHarbor 本体: `docs/ci-postmortems/` （CI / インフラ / DB 関連）
- AppHarborStudio: `docs/postmortems/` （カートリッジ生成 / Studio UX 関連）

## SDK 固有の記録一覧

| 日付 | タイトル | 影響範囲 |
|---|---|---|
| - | （まだなし） | - |

## 横断的な記録一覧

| 日付 | タイトル | 影響リポジトリ |
|---|---|---|
| 2026-05-22 | [連鎖的 CI 失敗（npm / Supabase / 型ズレ）](https://github.com/Tori-Take/appharbor/blob/main/docs/ci-postmortems/2026-05-22-cascading-ci-failures.md) | AppHarbor |
