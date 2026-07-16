# Evidence Model

The evidence model separates ingredient identity, chemical substance identity, product context, source records, evidence claims, and regulatory rules.

Evidence claims preserve:

- domain
- endpoint
- conclusion code
- concentration bounds and unit
- usage type and product form
- route
- population and age range
- aggregation context
- evidence kind and grade
- claim status
- source version, publication date, and exact locator
- limitations

No claim is converted into a single overall product safety score. Missing evidence is represented as `insufficient_data`, `unknown`, `pending_review`, `not_assessed`, or `context_excluded`, never as zero risk.
