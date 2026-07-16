# Import Validation

Validation steps:

1. Verify SHA-256 checksums from `sha256sums.json`.
2. Parse all CSV and JSON files.
3. Validate records with strict runtime schemas.
4. Validate references between claims, sources, products, and ingredients.
5. Preserve original source values and record issues instead of silently correcting data.

The importer flags:

- active claims without valid sources
- active claims supported only by discovery-only sources
- concentration values without units
- invalid concentration ranges
- duplicate ingredient positions
- formula hash mismatches
- product rows claiming package-photo verification from brand-page data
- unresolved product ingredient tokens

Warnings do not block import when they represent reviewable uncertainty rather than broken source integrity.
