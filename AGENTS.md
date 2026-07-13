# Project Rules

- All public UI copy must use Traditional Chinese for `zh-Hant-HK`.
- Keep the product name configurable through environment variables and shared configuration.
- Canonical ingredient identity must not depend on a translated Chinese name.
- Never invent scientific evidence, regulatory rules, concentrations, or risk scores.
- Every scientific or regulatory claim must be traceable to at least one source record.
- Represent no data as unknown or `資料不足`; never treat it as a zero score.
- Maintain strict TypeScript and runtime schema validation.
- Add tests for parser, normalisation, matching, and scoring changes.
- Protect product version history, source provenance, submissions, and audit trails.
- Preserve unmatched label tokens; do not silently drop OCR output.
- Run lint, typecheck, tests, and production build before considering a task complete.
