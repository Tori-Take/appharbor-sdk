# Recipes — 再利用可能なカートリッジパターン集

> 実際のカートリッジで使われた **「これは他のカートリッジでも使える」** という
> パターンをコード例つきで集める場所です。

## 各 recipe ファイルの形式

ファイル名: `<パターン名>.md` (英小文字 + ハイフン推奨)
例: `approval-workflow.md`, `csv-import.md`, `notification-cascade.md`

中身の構造:

```markdown
# <パターン名>

## いつ使うか
(2-3 文で説明)

## 実装スケッチ
\`\`\`tsx
// 実際に動くコード片
\`\`\`

## ポイント / 落とし穴
- 箇条書きで補足

## 実例
- `cart-info-sender` の `routes/admin/announcements/` を参照
```

## なぜここに置くか

- カートリッジ作者と AI 両方が参照する
- SDK 同梱なので `npm install @appharbor/sdk` で配布される
- AppHarbor Studio の `ai-context` API がここを読み、必要に応じて AI のコンテキストに含める

## 追加方法

AppHarbor Studio の「振り返りプロンプトをコピー」ボタンから AI と対話して
新しい recipe を抽出し、PR を作ってください。
