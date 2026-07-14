# Implementation Plan

## Assumptions

- This repository is empty except for Git metadata, so the MVP is scaffolded from scratch.
- The default public locale is `zh-Hant-HK`; developer documentation and code identifiers use English.
- The product names `成分透視` and `Cosmetic Ingredient Lens` are configurable.
- PostgreSQL is the production data store; normal bootstrap scripts do not create consumer-facing product or evidence data.
- Browser-side OCR is the default free provider; deterministic OCR fixtures support isolated tests.
- Production-facing data must come from approved reusable sources, real package-label observations, user submissions retained with consent, reviewer-entered source-backed records, or approved official chemical identity APIs.

## Architecture Decisions

- Use a pnpm workspace rather than a monorepo framework to keep tooling transparent.
- Use Next.js App Router for the web app, with server-side validation and protected admin routes.
- Keep replaceable provider interfaces for OCR, image storage, source import, ingredient matching, rating methodology, and authentication.
- Model ingredients, chemical substances, evidence, regulatory rules, product versions, images, OCR jobs, observations, ratings, and audit logs in Prisma.
- Keep ingredient parsing, matching, formula hashing, and scoring in pure packages with Vitest coverage.
- Use a local object-storage abstraction and MinIO-compatible environment variables, but never expose original uploaded images publicly by default.

## Build Sequence

1. Create root rules, workspace configuration, environment template, Docker Compose, and CI.
2. Add domain packages for shared types, ingredient parsing/matching, scoring, OCR, storage, and importers.
3. Add Prisma schema, migration SQL, source-policy bootstrap, and staged import commands.
4. Implement public pages, search, ingredient/product views, upload/OCR review flow, contribution submission, auth, and admin review surfaces.
5. Add documentation for architecture, data model, OCR pipeline, scoring, source policy, security, deployment, and roadmap.
6. Run formatting, lint, typecheck, unit/integration tests, E2E where available, and production build.

## MVP Boundaries

- No automated scraping or paid API integration.
- No absolute safety, toxicity, diagnosis, pregnancy-safety, or treatment claims.
- No single overall safety score.
- No automatic publication of community submissions.
- No exact concentration inference from ingredient order.
