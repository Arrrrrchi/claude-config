---
# 該当パスのファイルを触るときだけロードされる（path-scoped）。
paths:
  - "<db schema/migrations の glob 例: prisma/** / **/migrations/** / db/**>"
  - "<クエリ層 例: src/**/repositories/** / src/**/actions/**>"
---

# DB / データアクセス規約

- <例: raw SQL を避け ORM で表現する>
- マイグレーションは必ず down/ロールバックを書く
- N+1 を避ける（必要な include/join を明示）
- 適切なインデックスを張る
- トランザクション境界・lost update 対策
- <マルチテナントなら tenant_id フィルタの徹底>
