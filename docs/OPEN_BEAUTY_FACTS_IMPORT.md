# Open Beauty Facts Import

Open Beauty Facts is the first open structured product-data source. The importer is bounded, staged, and source-policy gated.

## Default Scope

- 100 to 500 records, configured with `--limit`.
- Requires a product name, brand, and non-empty ingredient list.
- Prefers barcode, market/country metadata, and ingredient-label image references when licence conditions allow.
- Does not treat the source market list as proof of a current Hong Kong formulation.

Imported product records are staged as:

- source type: `open_product_database`
- verification status: `externally_imported_unverified`
- publication status: `review_required`
- market display: `市場版本未確認`

## Commands

```bash
pnpm import:open-beauty-facts -- --limit 250 --require-ingredients --dry-run
pnpm import:open-beauty-facts -- --limit 250 --require-ingredients --commit
pnpm import:status
pnpm import:validate
pnpm search:rebuild
```

No unrestricted full-database import is enabled by default.

## Pipeline

```text
Open Beauty Facts API
      ↓
Raw source snapshot and payload hash
      ↓
Schema and source-policy validation
      ↓
Staged product records
      ↓
Duplicate, barcode, and conflict reporting
      ↓
Reviewer queue
      ↓
Canonical database only after approval
      ↓
Search index rebuild
```

## Stored Metadata

- external source record ID
- barcode
- brand
- product name
- product category
- countries or markets from the source record
- raw ingredient text
- normalised ingredient text
- image references only when allowed
- source URL
- source modification timestamp
- import timestamp
- licence
- attribution
- raw source payload hash
- importer version
- field provenance

## Review Rules

Imported records are not scientifically verified. They must not create active evidence claims, product safety conclusions, Hong Kong formulation assertions, or overall safety scores automatically.
