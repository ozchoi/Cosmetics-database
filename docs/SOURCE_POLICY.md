# Source Policy

1. Citation does not automatically grant permission to copy an entire database.
2. Structured facts, source text, scores, images, and database rights may have different reuse conditions.
3. The application stores its own structured assertions and original Traditional Chinese summaries.
4. Proprietary descriptions or third-party rating systems must not be copied without permission.
5. Each source record tracks licence and commercial-reuse status.
6. Sources with unknown reuse rights must not be bulk imported.
7. User-submitted product images require clear contributor consent.
8. Package-label data and third-party website data retain provenance.
9. Consumer websites can be discovery or secondary sources without being treated as primary scientific evidence.
10. Conflicting sources must be visible to reviewers rather than silently overwritten.
11. Each consumer-facing scientific claim must cite a source id, version, exact locator, evidence relationship, evidence grade, and access date where applicable.
12. Official regulations, official safety opinions, primary research, professional databases, secondary websites, discovery sources, and community submissions must remain separate source categories.
13. Missing evidence must not be interpreted as evidence of safety.
14. Study counts must not be used as a proxy for evidence quality.
15. Ingredient-level concern signals must be re-evaluated in product context, including product form, body area, use pattern, exposure route, market, and known concentration conditions.

## Source Access Classes

### A. Open Structured Source

API, export, or documented licence permits the intended reuse. Automated importers are allowed only after licence, attribution, robots/terms review, approved fields, and importer enablement are recorded in `DataSourcePolicy`.

Examples: Open Beauty Facts, PubChem, EPA CompTox, and approved official open-data catalogues.

### B. Official Reference Source

Official regulatory, scientific, or governmental material may be manually entered or processed through an approved structured workflow. Public access to a page does not imply permission to copy a complete website or database.

Examples: EU CosIng, SCCS opinions, ECHA, FDA, Hong Kong Customs, Hong Kong Drug Office, legislation, and regulatory notices.

### C. Secondary Or Discovery Source

Consumer, commercial, editorial, or third-party cosmetics information websites are discovery or cross-check sources by default.

Examples: EWG Skin Deep, CosDNA, and other ingredient-checking websites.

### D. User-contributed Primary Observation

Real product packaging photos and label text submitted by users require consent, privacy handling, OCR review, formulation version handling, source provenance, and moderation before publication.

## Third-party Consumer Websites

EWG Skin Deep, CosDNA, and similar consumer or commercial databases may be used only as secondary, cross-check, or discovery sources unless reuse rights and source quality have been reviewed.

- Link to original pages where allowed.
- Do not bulk copy proprietary descriptions, rating values, certification marks, tables, images, or product databases.
- Do not imply endorsement, partnership, certification, or affiliation.
- Prefer reviewing the official or primary sources cited by those websites.
- Keep imported data blocked until reuse rights, provenance, and evidence relationship are approved.

For EWG Skin Deep, Skin Deep scores and content must not be reproduced or distributed without required permission. For CosDNA, automated extraction and reuse permission is unknown unless written permission or a suitable documented licence is obtained.

Preferred workflow:

```text
EWG or CosDNA page discovered
        ↓
Record as discovery source
        ↓
Locate underlying official, regulatory, database, or primary source
        ↓
Reviewer reads the underlying source
        ↓
Create a structured EvidenceCandidate
        ↓
Record route, dose, concentration, product type, test system, jurisdiction, and uncertainty
        ↓
Reviewer approves or rejects
        ↓
Create an active EvidenceClaim only after approval
```

## Product Formulation Freshness

Every public product version must show a freshness status derived from label observation date, independent verification date, brand confirmation date, conflicting newer submissions, and market-specific formulation evidence.

Allowed public statuses are:

- 最新已核實
- 最近核實
- 可能已更新
- 舊配方
- 核實日期不明

Historical formulations must be preserved. A newly submitted ingredient list for an existing product creates a comparison and possible reformulation review task; it must not overwrite the existing version automatically.

## Source Registry Examples

- User-submitted product labels
- Brand ingredient lists
- EU CosIng
- SCCS opinions
- ECHA data
- PubChem
- EPA CompTox
- Cosmetic Ingredient Review
- Open Beauty Facts
- Academic studies
- Official regulatory notices

Open Beauty Facts, PubChem, and EPA CompTox use explicit provider workflows. EWG Skin Deep and CosDNA are configured as `reference_only_no_import`.
