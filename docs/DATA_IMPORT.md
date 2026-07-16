# Data Import

Evidence bundle imports are handled by `@cosmetic-lens/database`.

Commands:

```bash
pnpm data:validate --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1 --dry-run
pnpm data:import --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1 --write-snapshot
pnpm data:import:sources --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import:ingredients --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import:evidence --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import:products --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:report --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
```

The current public app reads a generated, non-public TypeScript snapshot at `packages/shared/src/imported-seed-data.ts`. Production database import requires `DATABASE_URL`, applying Prisma migrations, and wiring the public read layer to Prisma. The original bundle is not required at runtime and must not be placed under `public/`.

Import order follows: import run/report, sources, ingredients, aliases/substance mappings, evidence claims, regulatory rules, brands, products, product versions, ordered product ingredients, coverage, conflicts/gaps, review queue items.

Formula hash validation recalculates from ordered normalized tokens joined with newline and SHA-256 hashed. Source hash values are preserved; mismatches create review issues and are not overwritten.
