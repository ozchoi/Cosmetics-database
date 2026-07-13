# Data Model

The database separates product observations, ingredient identity, chemical substances, evidence, regulatory rules, ratings, and audit history. Ingredient identity is an internal UUID and must never depend on a translated Chinese name.

```mermaid
erDiagram
  User ||--o{ Session : owns
  User ||--o{ Submission : creates
  Brand ||--o{ Product : owns
  Product ||--o{ ProductVersion : versions
  ProductVersion ||--o{ ProductIngredient : has
  Submission ||--o{ ProductImage : uploads
  Submission ||--o{ OcrJob : runs
  OcrJob ||--o{ OcrSegment : segments
  Submission ||--o{ IngredientListObservation : confirms
  ProductVersion ||--o{ IngredientListObservation : supports
  Ingredient ||--o{ IngredientName : aliases
  Ingredient ||--o{ ProductIngredient : matches
  Ingredient ||--o{ IngredientSubstanceMapping : maps
  ChemicalSubstance ||--o{ IngredientSubstanceMapping : maps
  Ingredient ||--o{ EvidenceClaim : claims
  ChemicalSubstance ||--o{ EvidenceClaim : claims
  EvidenceClaim ||--o{ ClaimSource : cites
  Source ||--o{ ClaimSource : cited
  Source ||--o{ RegulatoryRule : supports
  ProductVersion ||--o{ RatingRun : rated
  MethodologyVersion ||--o{ RatingRun : configures
  RatingRun ||--o{ RatingDimensionResult : produces
  RatingDimensionResult ||--o{ RatingContribution : explains
  ProductIngredient ||--o{ RatingContribution : contributes
  User ||--o{ AuditLog : acts
  User ||--o{ CorrectionRequest : proposes
```

## Key Rules

- Product versions are immutable; a changed normalised ordered ingredient list creates a new `ProductVersion`.
- Formula hash is deterministic from the normalised ordered ingredient tokens.
- Unmatched label tokens are stored in `ProductIngredient` with `match_status = unresolved`.
- `IngredientName.normalised_name` is indexed but not globally unique, because ambiguous aliases exist.
- Deleting sources referenced by active evidence must be restricted.
- Demo evidence has `is_demo = true` and must not appear as production evidence.
