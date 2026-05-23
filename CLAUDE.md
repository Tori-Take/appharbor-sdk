# @appharbor/sdk — AI 向けガイド

このリポジトリは **AppHarbor SDK の契約（インターフェース定義）パッケージ** です。

## 役割

カートリッジが import する `@appharbor/sdk` の型と関数シグネチャを定義する。
実装はホスト環境（AppHarbor Studio / AppHarbor 本番）が提供する。

## メンテナンスルール

このパッケージへの変更は **慎重に**:

1. **破壊的変更を避ける** — 既存カートリッジが壊れる
2. **関数シグネチャは固定** — 引数や戻り値の型は安定させる
3. **型の追加は OK、削除は NG** — 既存型に新フィールドを `?:` で追加するのは OK
4. **バージョン管理は SemVer** — 破壊的変更は major bump

## ホスト環境への伝播

このリポを更新したら:
1. version bump (`package.json` の version + git tag)
2. ホスト側（Studio / AppHarbor）の依存を更新
3. ホスト側の実装（`lib/sdk-mock/` / `lib/sdk-base/`）が新シグネチャに準拠しているか確認

## このリポでやらないこと

- カートリッジロジックの実装（カートリッジリポへ）
- Supabase クライアントの実装（ホスト環境へ）
- データベース操作（ホスト環境へ）
- 認証ロジック（ホスト環境へ）

## このリポでやること

- 型定義の整備（types.ts）
- 関数シグネチャの定義（index.ts / client.ts）
- ドキュメント整備（README.md / 各ファイルの JSDoc）
- バージョン管理（タグリリース）

## 関連リポジトリ

- [Tori-Take/cartridge-template](https://github.com/Tori-Take/cartridge-template) — 雛形（このパッケージを依存）
- [Tori-Take/cart-patrol-navi](https://github.com/Tori-Take/cart-patrol-navi) — 実用カートリッジ
- [Tori-Take/AppHarborStudio](https://github.com/Tori-Take/AppHarborStudio) — 実装提供側

## 📝 ポストモーテム運用

このリポジトリは **3リポジトリ（SDK / AppHarbor / AppHarborStudio）のポストモーテム索引** を持つ。

### 「ポストモーテム作って」と言われたら

1. **原因の場所を判定**
   - SDK API / 型契約の不備 → このリポジトリで詳細記録
   - 複数リポジトリ横断 → このリポジトリで詳細記録 + 索引追加
   - 他リポジトリ単独の問題 → 該当リポジトリで作成し、ここに索引のみ追加

2. **テンプレート**: `postmortems/_template.md` をコピー
   ファイル名: `postmortems/YYYY-MM-DD-短い説明.md`

3. **索引を更新**: `postmortems/README.md` の表に追記

4. **人間に確認 → PR 作成**
