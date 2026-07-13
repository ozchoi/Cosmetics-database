# Security, Privacy, And Data Integrity

## Implemented Controls

- Strict TypeScript and Zod validation for contribution payloads.
- Upload workflow validates image MIME by file signature.
- Canvas re-encoding strips metadata before any processed image storage path.
- SHA-256 duplicate detection helper.
- Random object-storage keys.
- Protected admin routes with signed, HTTP-only, same-site cookies.
- In-memory rate limiting for upload/search-adjacent API paths.
- External links use `rel="noreferrer noopener"`.
- Admin review actions append an audit trail in local development storage.

## Production Requirements

- Replace development credentials and set a 32+ character `AUTH_COOKIE_SECRET`.
- Use PostgreSQL-backed sessions or a maintained authentication provider.
- Store processed images in private S3/MinIO buckets with signed access.
- Add persistent distributed rate limiting.
- Ensure logs exclude personal data and raw image content.
- Run dependency auditing in CI.
