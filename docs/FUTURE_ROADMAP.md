# Future Roadmap

## Next Milestone

- Replace fixture-backed reads with Prisma repositories.
- Build full CRUD forms for sources, claims, regulatory rules, ingredients, substances, and products.
- Add source import templates without scraping.
- Add reviewer conflict warnings and duplicate formulation detection against PostgreSQL.
- Persist product freshness calculations and possible reformulation review tasks in PostgreSQL.
- Add persistent object storage writes to MinIO/S3.
- Add DB-backed audit logs and correction requests.

## Later

- Advanced OCR layout detection.
- Better fuzzy matching with pg_trgm and reviewer feedback.
- Public correction request workflow.
- International market/version comparison.
- Expert-reviewed methodology publication workflow.
- Optional comedogenicity evidence dimension clearly separated from health concern dimensions.
