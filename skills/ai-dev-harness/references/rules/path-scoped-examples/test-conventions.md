---
paths:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "<e2e ディレクトリ 例: e2e/** / tests/**>"
  - "<テスト設定 例: vitest.config.ts / jest.config.* / playwright.config.ts>"
---

# テスト規約

- フレームワーク: `<unit: 例 Vitest/Jest/pytest>` / `<e2e: 例 Playwright>`
- TDD: 失敗するテストを先に書く（Red → Green → Refactor）
- バリデーション・ユーティリティ・サーバ処理は unit test を先行
- <命名・配置・モックの方針>
