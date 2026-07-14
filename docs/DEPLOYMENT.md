# Deployment

## Local

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and MinIO with Docker Compose.
3. Install dependencies with `pnpm install`.
4. Run `pnpm db:migrate`.
5. Run `pnpm db:bootstrap`.
6. Run `pnpm dev`.

## Environment Variables

- `APP_NAME`
- `APP_ENGLISH_NAME`
- `APP_URL`
- `DATABASE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AUTH_COOKIE_SECRET`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `UPLOAD_MAX_FILES`
- `UPLOAD_MAX_FILE_MB`

## Production Notes

- Use managed PostgreSQL with backups and migration gates.
- Use private object storage and signed access.
- Set secure cookies and HTTPS-only deployment.
- Do not seed fictional products, brands, evidence, concentration limits, source records, or rating values.
- Run external imports only through approved source policies and bounded importer commands.
- Review legal pages before public launch.

## Data Commands

- `pnpm db:bootstrap` creates required reference/source-policy rows only.
- `pnpm import:open-beauty-facts -- --limit 250 --require-ingredients --dry-run` previews a bounded Open Beauty Facts import.
- `pnpm import:open-beauty-facts -- --limit 250 --require-ingredients --commit` stages bounded records for review.
- `pnpm enrich:pubchem -- --reviewed-identities-only --limit 100` enriches reviewed identities only.
- `pnpm enrich:comptox -- --stage-only --limit 100` stages EPA CompTox records without publishing claims.
- `pnpm import:validate` checks source policy and licence provenance.
- `pnpm search:rebuild` rebuilds search indexes explicitly.
