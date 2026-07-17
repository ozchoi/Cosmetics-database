# Data Import

Evidence bundle imports are handled by `@cosmetic-lens/database`.

Commands:

```bash
pnpm data:validate --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1 --dry-run
pnpm data:import --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1 --write-snapshot
pnpm data:import:sources --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import:ingredients --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import:evidence --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:import:products --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
pnpm data:report --path /Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1
```

The public product listing, product detail, product search, homepage product preview, and admin product list first try to read the application database through Prisma. If the database is unavailable during local build, the app falls back to the generated non-public TypeScript snapshot at `packages/shared/src/imported-seed-data.ts` so builds remain repeatable. Production database import requires `DATABASE_URL` and applied Prisma migrations. The original bundle is not required at runtime and must not be placed under `public/`.

`--write-snapshot` is only for refreshing the fallback snapshot. It is not a production import.

Import order follows: import run/report, sources, ingredients, aliases/substance mappings, evidence claims, regulatory rules, brands, products, product versions, ordered product ingredients, coverage, conflicts/gaps, review queue items.

Formula hash validation recalculates from ordered normalized tokens joined with newline and SHA-256 hashed. Source hash values are preserved; mismatches create review issues and are not overwritten.
