ALTER TYPE "ProductForm" ADD VALUE IF NOT EXISTS 'serum';
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'brand_page';
ALTER TYPE "PublicationStatus" ADD VALUE IF NOT EXISTS 'published_with_source_warning';
ALTER TYPE "IngredientType" ADD VALUE IF NOT EXISTS 'stereochemical_family';
ALTER TYPE "IngredientType" ADD VALUE IF NOT EXISTS 'material_family';
ALTER TYPE "MatchMethod" ADD VALUE IF NOT EXISTS 'unresolved_seed_scope';

ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "brands_external_seed_id_key" ON "brands"("external_seed_id");

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "products_external_seed_id_key" ON "products"("external_seed_id");

ALTER TABLE "product_versions" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "product_versions_external_seed_id_key" ON "product_versions"("external_seed_id");

ALTER TABLE "ingredients" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ingredients_external_seed_id_key" ON "ingredients"("external_seed_id");

ALTER TABLE "ingredient_names" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ingredient_names_external_seed_id_key" ON "ingredient_names"("external_seed_id");

ALTER TABLE "chemical_substances" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "chemical_substances_external_seed_id_key" ON "chemical_substances"("external_seed_id");

ALTER TABLE "ingredient_substance_mappings" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ingredient_substance_mappings_external_seed_id_key" ON "ingredient_substance_mappings"("external_seed_id");

ALTER TABLE "product_ingredients" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "product_ingredients_external_seed_id_key" ON "product_ingredients"("external_seed_id");

ALTER TABLE "sources" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "sources_external_seed_id_key" ON "sources"("external_seed_id");

ALTER TABLE "evidence_claims" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "evidence_claims_external_seed_id_key" ON "evidence_claims"("external_seed_id");

ALTER TABLE "regulatory_rules" ADD COLUMN IF NOT EXISTS "external_seed_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "regulatory_rules_external_seed_id_key" ON "regulatory_rules"("external_seed_id");

CREATE TABLE IF NOT EXISTS "import_issues" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "import_job_id" UUID,
  "external_seed_id" TEXT,
  "source_file" TEXT NOT NULL,
  "record_id" TEXT,
  "category" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "original_value" TEXT,
  "transformed_value" TEXT,
  "message" TEXT NOT NULL,
  "recommended_action" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "import_issues_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "import_issues_import_job_id_idx" ON "import_issues"("import_job_id");
CREATE INDEX IF NOT EXISTS "import_issues_severity_idx" ON "import_issues"("severity");
CREATE INDEX IF NOT EXISTS "import_issues_status_idx" ON "import_issues"("status");

CREATE TABLE IF NOT EXISTS "review_queue_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "external_seed_id" TEXT,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT,
  "issue_category" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "original_value_json" JSONB,
  "normalised_value_json" JSONB,
  "proposed_match_json" JSONB,
  "source_id" TEXT,
  "issue_zh" TEXT NOT NULL,
  "impact_zh" TEXT,
  "recommended_action_zh" TEXT,
  "reviewer_decision" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_queue_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "review_queue_items_external_seed_id_key" ON "review_queue_items"("external_seed_id");
CREATE INDEX IF NOT EXISTS "review_queue_items_entity_type_idx" ON "review_queue_items"("entity_type");
CREATE INDEX IF NOT EXISTS "review_queue_items_issue_category_idx" ON "review_queue_items"("issue_category");
CREATE INDEX IF NOT EXISTS "review_queue_items_priority_idx" ON "review_queue_items"("priority");
CREATE INDEX IF NOT EXISTS "review_queue_items_status_idx" ON "review_queue_items"("status");

CREATE TABLE IF NOT EXISTS "coverage_matrix_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "external_seed_id" TEXT NOT NULL,
  "ingredient_id" UUID,
  "canonical_inci" TEXT NOT NULL,
  "coverage_json" JSONB NOT NULL,
  "reviewed_count" INTEGER NOT NULL DEFAULT 0,
  "pending_count" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coverage_matrix_records_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "coverage_matrix_records_external_seed_id_key" ON "coverage_matrix_records"("external_seed_id");
CREATE INDEX IF NOT EXISTS "coverage_matrix_records_ingredient_id_idx" ON "coverage_matrix_records"("ingredient_id");
CREATE INDEX IF NOT EXISTS "coverage_matrix_records_reviewed_count_idx" ON "coverage_matrix_records"("reviewed_count");
CREATE INDEX IF NOT EXISTS "coverage_matrix_records_pending_count_idx" ON "coverage_matrix_records"("pending_count");
