# Architecture

```mermaid
flowchart LR
  user["Public user"] --> web["Next.js App Router"]
  reviewer["Reviewer/Admin"] --> admin["Protected admin routes"]
  web --> parser["@cosmetic-lens/ingredient-parser"]
  web --> ocr["@cosmetic-lens/ocr"]
  web --> scoring["@cosmetic-lens/scoring"]
  web --> storage["@cosmetic-lens/storage"]
  web --> db["Prisma + PostgreSQL"]
  storage --> minio["MinIO / S3-compatible storage"]
  admin --> db
  db --> sources["Source registry"]
```

## Selected Stack

- pnpm workspace without a monorepo framework.
- Next.js App Router, strict TypeScript, Tailwind CSS v4, React Hook Form, Zod, and Playwright.
- Prisma ORM with PostgreSQL schema and migration artifacts.
- Browser/local OCR provider interface with Tesseract.js and deterministic test provider.
- Storage provider interface for MinIO/S3-compatible object storage.

## Replaceable Providers

- OCR: `OcrProvider`
- Storage: `ImageStorageProvider`
- Ingredient matching: parser package API
- Rating methodology: scoring package configuration
- Authentication: signed-cookie credentials provider with a migration path to Auth.js or another maintained provider
- Source import: `ProductDataImporter` providers gated by `DataSourcePolicy`; no unrestricted scraping

## Local Data Mode

The application starts with no preloaded consumer-facing products, brands, evidence claims, regulatory limits, or placeholder ratings. PostgreSQL remains the production data contract through Prisma schema and migrations. `pnpm db:bootstrap` creates required source-policy/reference rows only.

Test records are isolated inside test files and use clearly synthetic names and domains. They are not loaded into development or production database setup.

## Import Pipeline

```mermaid
flowchart TD
  external["Approved external source"] --> raw["RawImportRecord"]
  raw --> validate["Schema and policy validation"]
  validate --> staging["StagedProduct / StagedIngredient / ExternalEndpointRecord"]
  staging --> match["Identity matching and conflict detection"]
  match --> queue["Reviewer queue"]
  queue --> canonical["Canonical product, ingredient, or evidence tables"]
  canonical --> search["Search index rebuild"]
```

Automated importers may run only when the source policy is approved or provisional, `importerEnabled` is true, licence and attribution metadata exist, and requested fields are limited to approved fields.

## Product Version Model

Public ProductVersion records preserve market, barcode, category, form, use pattern, body area, label observation date, independent verification date, brand confirmation date, source ids, evidence confidence, data completeness, and concern-dimension values.

Freshness is derived from observation and verification dates, newer conflicting submissions, and market-specific evidence. Historical formulations are not deleted or overwritten. A changed user-submitted ingredient list creates a possible reformulation review task with added, removed, and reordered ingredients for reviewer action.
