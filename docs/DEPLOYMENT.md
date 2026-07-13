# Deployment

## Local

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL and MinIO with Docker Compose.
3. Install dependencies with `pnpm install`.
4. Run `pnpm db:migrate`.
5. Run `pnpm db:seed`.
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
- Do not seed demo evidence into production.
- Review legal pages before public launch.
