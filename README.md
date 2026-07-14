# 成分透視

Cosmetic Ingredient Lens 是一個以繁體中文（香港）為主的化妝品成分資料平台 MVP。它支援產品／成分搜尋、產品瀏覽、標籤相片 OCR、成分解析與配對、資料不足提示、來源追蹤、產品配方版本，以及待審核提交流程。

此平台報告「潛在關注」、「證據可信度」、「資料完整度」及「適用條件」。它不提供醫療診斷、懷孕安全聲明、治療建議，亦不使用單一安全分數。

## Architecture

```mermaid
flowchart LR
  web["apps/web Next.js"] --> parser["packages/ingredient-parser"]
  web --> ocr["packages/ocr"]
  web --> scoring["packages/scoring"]
  web --> shared["packages/shared"]
  web --> storage["packages/storage"]
  db["packages/database Prisma"] --> pg["PostgreSQL"]
  storage --> minio["MinIO / S3"]
```

## Prerequisites

- Node.js 24+
- pnpm 11+
- Docker with Docker Compose for PostgreSQL and MinIO

## Setup

```bash
cp .env.example .env
pnpm setup
docker compose up -d
pnpm db:migrate
pnpm db:bootstrap
pnpm dev
```

Open `http://localhost:3000`.

Useful MVP routes:

- `/` search across products and ingredients
- `/products` browse public product versions by category, brand, use pattern, market, freshness, data completeness, evidence confidence, and individual concern dimension
- `/submit` analyse or submit a label after OCR correction
- `/sources` inspect source category, locator, evidence relationship, evidence grade, and reuse status

EWG Skin Deep, CosDNA, Open Beauty Facts, and similar sites are treated only as benchmark, secondary, cross-check, or discovery sources unless reuse rights are approved. The app does not copy their visual identity, proprietary scores, certification marks, descriptions, images, tables, or product databases.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm db:migrate`
- `pnpm db:bootstrap`
- `pnpm import:open-beauty-facts -- --limit 250 --require-ingredients --dry-run`
- `pnpm import:open-beauty-facts -- --limit 250 --require-ingredients --commit`
- `pnpm enrich:pubchem -- --reviewed-identities-only --limit 100`
- `pnpm enrich:comptox -- --stage-only --limit 100`
- `pnpm import:status`
- `pnpm import:validate`
- `pnpm search:rebuild`
- `pnpm db:studio`
- `pnpm setup`

## Environment Variables

See `.env.example`. Required local values include `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_COOKIE_SECRET`, and MinIO-compatible `S3_*` variables.

## Development Admin

Default development credentials are:

- Email: `admin@example.test`
- Password: `change-me-in-dev`

Replace these in `.env` before any shared deployment.

## OCR Limitations

The first OCR provider uses local/browser Tesseract.js and is expected to be imperfect on reflective packaging, curved labels, low contrast, dense ingredient lists, and mixed Chinese/English labels. Users must review and correct OCR output before analysis or submission.

## Privacy

Users can analyse without storing an original photo. If they opt into contribution, they can submit text only or submit a processed image after metadata removal. Original uploaded images should never be publicly exposed by default.

## Data Coverage

The production-facing database is real-data only. Bootstrap scripts do not insert fictional products, brands, evidence claims, regulatory limits, placeholder scores, or demo ratings. Consumer-facing records must come from approved reusable sources, real package-label observations, user submissions retained with consent, reviewer-entered source-backed records, or approved official chemical identity APIs.

Test fixtures use clearly synthetic records inside test files only and are not loaded by normal database setup.
