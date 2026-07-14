-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'contributor', 'reviewer', 'admin');

-- CreateEnum
CREATE TYPE "UsageType" AS ENUM ('leave_on', 'rinse_off', 'mixed', 'unknown');

-- CreateEnum
CREATE TYPE "ProductForm" AS ENUM ('cream', 'liquid', 'gel', 'powder', 'spray', 'aerosol', 'stick', 'unknown');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending_review', 'reviewed', 'needs_correction', 'rejected', 'externally_imported_unverified');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('draft', 'published', 'archived', 'review_required');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending_review', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ContributionMode" AS ENUM ('instant_only', 'text_only', 'processed_image_and_text');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('product_front', 'product_back', 'ingredient_label', 'barcode', 'other');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('queued', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "IngredientType" AS ENUM ('defined_chemical', 'mixture', 'uvcb', 'botanical', 'extract', 'polymer', 'fragrance_mixture', 'colourant', 'mineral', 'unknown');

-- CreateEnum
CREATE TYPE "NameType" AS ENUM ('preferred', 'inci', 'common', 'scientific', 'botanical', 'label_alias', 'historical', 'misspelling');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('draft', 'reviewed', 'active', 'superseded', 'disputed', 'rejected');

-- CreateEnum
CREATE TYPE "MatchMethod" AS ENUM ('exact_canonical_inci', 'exact_reviewed_alias', 'exact_identifier', 'normalised_alias', 'fuzzy_candidate', 'manual_resolution');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('confirmed', 'uncertain', 'unresolved');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('regulation', 'official_opinion', 'original_study', 'systematic_review', 'professional_database', 'brand_document', 'package_label', 'open_product_database', 'secondary_website', 'discovery_source', 'community_submission', 'reference_only_no_import');

-- CreateEnum
CREATE TYPE "SourceAccessClass" AS ENUM ('open_structured_source', 'official_reference_source', 'secondary_or_discovery_source', 'user_contributed_primary_observation');

-- CreateEnum
CREATE TYPE "SourceAccessMethod" AS ENUM ('API', 'bulk_export', 'manual_entry', 'user_submission', 'reviewer_research', 'prohibited');

-- CreateEnum
CREATE TYPE "CommercialUseStatus" AS ENUM ('allowed', 'restricted', 'unknown', 'prohibited');

-- CreateEnum
CREATE TYPE "LegalReviewStatus" AS ENUM ('not_reviewed', 'provisional', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ImportRecordStatus" AS ENUM ('pending', 'validated', 'staged', 'rejected', 'imported');

-- CreateEnum
CREATE TYPE "StagingReviewStatus" AS ENUM ('pending_review', 'approved', 'rejected', 'needs_more_source');

-- CreateEnum
CREATE TYPE "ProposedImportAction" AS ENUM ('create', 'update', 'link_existing', 'reject');

-- CreateEnum
CREATE TYPE "ExternalEndpointKind" AS ENUM ('measured_result', 'predicted_result', 'in_vitro_assay', 'animal_result', 'human_observation', 'regulatory_classification', 'exposure_estimate', 'environmental_fate_property', 'other');

-- CreateEnum
CREATE TYPE "EvidenceGrade" AS ENUM ('A', 'B', 'C', 'D', 'U');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('draft', 'reviewed', 'active', 'superseded', 'disputed');

-- CreateEnum
CREATE TYPE "ClaimSourceRelationship" AS ENUM ('primary', 'supporting', 'conflicting', 'secondary', 'discovery', 'cross_check');

-- CreateEnum
CREATE TYPE "RatingStatus" AS ENUM ('calculated', 'insufficient_data', 'not_applicable');

-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "preferred_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_aliases" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "normalised_alias" TEXT NOT NULL,
    "locale" TEXT NOT NULL,

    CONSTRAINT "brand_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "preferred_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description_zh_hant" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name_zh_hant" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_versions" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "market_code" TEXT NOT NULL,
    "barcode" TEXT,
    "category_id" UUID,
    "product_form" "ProductForm" NOT NULL DEFAULT 'unknown',
    "usage_type" "UsageType" NOT NULL DEFAULT 'unknown',
    "body_area" TEXT[],
    "target_user_group" TEXT,
    "label_observed_at" TIMESTAMP(3),
    "last_independent_verification_at" TIMESTAMP(3),
    "brand_confirmed_at" TIMESTAMP(3),
    "conflicting_newer_submission_count" INTEGER NOT NULL DEFAULT 0,
    "market_specific_evidence_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "formula_hash" TEXT NOT NULL,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending_review',
    "publication_status" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "submitted_at" TIMESTAMP(3),
    "evidence_confidence" "EvidenceGrade" NOT NULL DEFAULT 'U',
    "data_completeness" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "concern_dimension_values_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending_review',
    "contribution_mode" "ContributionMode" NOT NULL,
    "notes" TEXT,
    "compared_product_version_id" UUID,
    "formulation_diff_json" JSONB,
    "review_task_type" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "product_version_id" UUID,
    "image_type" "ImageType" NOT NULL,
    "storage_provider" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT,
    "mime_type" TEXT NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sha256" TEXT NOT NULL,
    "exif_removed" BOOLEAN NOT NULL DEFAULT false,
    "consent_to_store" BOOLEAN NOT NULL DEFAULT false,
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_jobs" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "product_image_id" UUID,
    "provider" TEXT NOT NULL,
    "provider_version" TEXT NOT NULL,
    "status" "OcrStatus" NOT NULL DEFAULT 'queued',
    "language_codes" TEXT[],
    "raw_text" TEXT,
    "average_confidence" DECIMAL(5,4),
    "processing_metadata_json" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ocr_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_segments" (
    "id" UUID NOT NULL,
    "ocr_job_id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DECIMAL(5,4),
    "bounding_box_json" JSONB,
    "sequence_number" INTEGER NOT NULL,

    CONSTRAINT "ocr_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_list_observations" (
    "id" UUID NOT NULL,
    "submission_id" UUID,
    "product_version_id" UUID,
    "raw_ocr_text" TEXT,
    "corrected_text" TEXT NOT NULL,
    "parser_version" TEXT NOT NULL,
    "normalised_ordered_text" TEXT NOT NULL,
    "formula_hash" TEXT NOT NULL,
    "confirmed_by_user" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_list_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" UUID NOT NULL,
    "canonical_inci_name" TEXT NOT NULL,
    "preferred_english_name" TEXT NOT NULL,
    "preferred_zh_hant_hk_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ingredient_type" "IngredientType" NOT NULL,
    "description_zh_hant" TEXT,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_names" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalised_name" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "region_code" TEXT,
    "name_type" "NameType" NOT NULL,
    "source_id" UUID,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_functions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_zh_hant" TEXT NOT NULL,
    "description_zh_hant" TEXT,

    CONSTRAINT "ingredient_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_function_mappings" (
    "ingredient_id" UUID NOT NULL,
    "function_id" UUID NOT NULL,
    "source_id" UUID,

    CONSTRAINT "ingredient_function_mappings_pkey" PRIMARY KEY ("ingredient_id","function_id")
);

-- CreateTable
CREATE TABLE "chemical_substances" (
    "id" UUID NOT NULL,
    "preferred_name" TEXT NOT NULL,
    "cas_number" TEXT,
    "ec_number" TEXT,
    "pubchem_cid" TEXT,
    "dtxsid" TEXT,
    "inchikey" TEXT,
    "substance_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chemical_substances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_substance_mappings" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "substance_id" UUID NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "mapping_confidence" DECIMAL(5,4) NOT NULL,
    "source_id" UUID,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "ingredient_substance_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_ingredients" (
    "id" UUID NOT NULL,
    "product_version_id" UUID NOT NULL,
    "ingredient_list_observation_id" UUID,
    "position" INTEGER NOT NULL,
    "raw_label_token" TEXT NOT NULL,
    "normalised_token" TEXT NOT NULL,
    "ingredient_id" UUID,
    "match_method" "MatchMethod",
    "match_confidence" DECIMAL(5,4) NOT NULL,
    "match_status" "MatchStatus" NOT NULL,
    "is_may_contain" BOOLEAN NOT NULL DEFAULT false,
    "concentration_min" DECIMAL(8,4),
    "concentration_max" DECIMAL(8,4),
    "concentration_basis" TEXT,
    "concentration_is_inferred" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "product_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "publisher" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "jurisdiction" TEXT,
    "publication_date" TIMESTAMP(3),
    "version" TEXT,
    "external_url" TEXT,
    "exact_locator" TEXT,
    "accessed_at" TIMESTAMP(3),
    "language_code" TEXT,
    "licence_status" TEXT NOT NULL,
    "commercial_reuse_status" TEXT NOT NULL,
    "attribution_text" TEXT,
    "archived_snapshot_sha256" TEXT,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'draft',
    "evidence_relationship" "ClaimSourceRelationship",
    "evidence_grade" "EvidenceGrade" NOT NULL DEFAULT 'U',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_claims" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID,
    "substance_id" UUID,
    "claim_type" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "effect_direction" TEXT NOT NULL,
    "summary_zh_hant" TEXT NOT NULL,
    "structured_value" JSONB,
    "unit" TEXT,
    "route" TEXT,
    "test_system" TEXT,
    "population" TEXT,
    "concentration_min" DECIMAL(8,4),
    "concentration_max" DECIMAL(8,4),
    "applicable_product_types_json" JSONB,
    "applicable_conditions_json" JSONB,
    "evidence_grade" "EvidenceGrade" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'draft',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_sources" (
    "evidence_claim_id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "relationship_type" "ClaimSourceRelationship" NOT NULL,

    CONSTRAINT "claim_sources_pkey" PRIMARY KEY ("evidence_claim_id","source_id","relationship_type")
);

-- CreateTable
CREATE TABLE "regulatory_rules" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID,
    "substance_id" UUID,
    "jurisdiction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "product_scope" TEXT,
    "usage_type" "UsageType",
    "concentration_min" DECIMAL(8,4),
    "concentration_max" DECIMAL(8,4),
    "required_warning_text" TEXT,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "summary_zh_hant" TEXT NOT NULL,
    "source_id" UUID NOT NULL,
    "review_status" "ReviewStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "regulatory_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "methodology_versions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "semantic_version" TEXT NOT NULL,
    "description_zh_hant" TEXT NOT NULL,
    "configuration_json" JSONB NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "publication_status" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "methodology_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_runs" (
    "id" UUID NOT NULL,
    "product_version_id" UUID NOT NULL,
    "methodology_version_id" UUID NOT NULL,
    "source_snapshot_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_dimension_results" (
    "id" UUID NOT NULL,
    "rating_run_id" UUID NOT NULL,
    "dimension" TEXT NOT NULL,
    "score_min" DECIMAL(8,4),
    "score_max" DECIMAL(8,4),
    "concern_band" TEXT,
    "confidence_grade" "EvidenceGrade" NOT NULL,
    "data_completeness" DECIMAL(5,4) NOT NULL,
    "status" "RatingStatus" NOT NULL,
    "explanation_zh_hant" TEXT NOT NULL,

    CONSTRAINT "rating_dimension_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rating_contributions" (
    "id" UUID NOT NULL,
    "rating_dimension_result_id" UUID NOT NULL,
    "product_ingredient_id" UUID NOT NULL,
    "evidence_claim_id" UUID,
    "contribution_min" DECIMAL(8,4),
    "contribution_max" DECIMAL(8,4),
    "explanation_zh_hant" TEXT NOT NULL,

    CONSTRAINT "rating_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correction_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "proposed_change_json" JSONB NOT NULL,
    "evidence_notes" TEXT,
    "status" "CorrectionStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correction_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_source_policies" (
    "id" UUID NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_domain" TEXT NOT NULL,
    "source_access_class" "SourceAccessClass" NOT NULL,
    "access_method" "SourceAccessMethod" NOT NULL,
    "licence_name" TEXT NOT NULL,
    "licence_url" TEXT,
    "attribution_required" BOOLEAN NOT NULL DEFAULT false,
    "share_alike_required" BOOLEAN NOT NULL DEFAULT false,
    "commercial_use_status" "CommercialUseStatus" NOT NULL,
    "derivative_database_requirement" TEXT,
    "image_reuse_status" "CommercialUseStatus" NOT NULL,
    "text_reuse_status" "CommercialUseStatus" NOT NULL,
    "automated_access_allowed" BOOLEAN NOT NULL DEFAULT false,
    "robots_reviewed_at" TIMESTAMP(3),
    "terms_reviewed_at" TIMESTAMP(3),
    "legal_review_status" "LegalReviewStatus" NOT NULL DEFAULT 'not_reviewed',
    "approved_fields_json" JSONB NOT NULL,
    "prohibited_fields_json" JSONB NOT NULL,
    "required_attribution_text" TEXT,
    "importer_enabled" BOOLEAN NOT NULL DEFAULT false,
    "review_notes" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_source_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "source_policy_id" UUID NOT NULL,
    "importer_version" TEXT NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'queued',
    "requested_scope_json" JSONB NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "checkpoint_json" JSONB,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_count" INTEGER NOT NULL DEFAULT 0,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "manifest_path" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_import_records" (
    "id" UUID NOT NULL,
    "import_job_id" UUID NOT NULL,
    "external_record_id" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "payload_sha256" TEXT NOT NULL,
    "source_updated_at" TIMESTAMP(3),
    "processing_status" "ImportRecordStatus" NOT NULL DEFAULT 'pending',
    "validation_errors_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_import_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staged_products" (
    "id" UUID NOT NULL,
    "raw_import_record_id" UUID NOT NULL,
    "mapped_fields_json" JSONB NOT NULL,
    "source_derived_fields_json" JSONB,
    "matching_candidates_json" JSONB,
    "conflict_report_json" JSONB,
    "proposed_action" "ProposedImportAction" NOT NULL,
    "review_status" "StagingReviewStatus" NOT NULL DEFAULT 'pending_review',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "staged_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staged_ingredients" (
    "id" UUID NOT NULL,
    "raw_import_record_id" UUID NOT NULL,
    "raw_name" TEXT NOT NULL,
    "normalised_name" TEXT NOT NULL,
    "candidate_ingredient_ids_json" JSONB,
    "proposed_action" "ProposedImportAction" NOT NULL,
    "review_status" "StagingReviewStatus" NOT NULL DEFAULT 'pending_review',

    CONSTRAINT "staged_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_chemical_records" (
    "id" UUID NOT NULL,
    "raw_import_record_id" UUID,
    "source_policy_id" UUID NOT NULL,
    "external_record_id" TEXT NOT NULL,
    "query_json" JSONB NOT NULL,
    "payload_sha256" TEXT NOT NULL,
    "retrieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint_version" TEXT,
    "candidate_matches_json" JSONB,
    "mapping_confidence" DECIMAL(5,4),
    "review_status" "StagingReviewStatus" NOT NULL DEFAULT 'pending_review',

    CONSTRAINT "external_chemical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_endpoint_records" (
    "id" UUID NOT NULL,
    "raw_import_record_id" UUID,
    "external_chemical_record_id" UUID,
    "endpoint_kind" "ExternalEndpointKind" NOT NULL,
    "endpoint_json" JSONB NOT NULL,
    "route" TEXT,
    "dose_json" JSONB,
    "test_system" TEXT,
    "relevance_status" TEXT,
    "review_status" "StagingReviewStatus" NOT NULL DEFAULT 'pending_review',

    CONSTRAINT "external_endpoint_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_candidates" (
    "id" UUID NOT NULL,
    "source_policy_id" UUID NOT NULL,
    "raw_import_record_id" UUID,
    "ingredient_id" UUID,
    "substance_id" UUID,
    "proposed_claim_json" JSONB NOT NULL,
    "identity_confidence" DECIMAL(5,4),
    "evidence_relevance_status" TEXT NOT NULL,
    "review_status" "StagingReviewStatus" NOT NULL DEFAULT 'pending_review',
    "reviewer_notes" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "evidence_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_review_decisions" (
    "id" UUID NOT NULL,
    "evidence_candidate_id" UUID NOT NULL,
    "decision" "StagingReviewStatus" NOT NULL,
    "notes" TEXT,
    "decided_by" UUID,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_review_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brand_aliases_normalised_alias_idx" ON "brand_aliases"("normalised_alias");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE INDEX "product_versions_product_id_idx" ON "product_versions"("product_id");

-- CreateIndex
CREATE INDEX "product_versions_barcode_idx" ON "product_versions"("barcode");

-- CreateIndex
CREATE INDEX "product_versions_formula_hash_idx" ON "product_versions"("formula_hash");

-- CreateIndex
CREATE INDEX "product_versions_market_code_idx" ON "product_versions"("market_code");

-- CreateIndex
CREATE INDEX "product_versions_verification_status_idx" ON "product_versions"("verification_status");

-- CreateIndex
CREATE INDEX "product_versions_publication_status_idx" ON "product_versions"("publication_status");

-- CreateIndex
CREATE INDEX "product_versions_label_observed_at_idx" ON "product_versions"("label_observed_at");

-- CreateIndex
CREATE INDEX "product_versions_last_independent_verification_at_idx" ON "product_versions"("last_independent_verification_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_versions_product_id_market_code_formula_hash_key" ON "product_versions"("product_id", "market_code", "formula_hash");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_compared_product_version_id_idx" ON "submissions"("compared_product_version_id");

-- CreateIndex
CREATE INDEX "product_images_sha256_idx" ON "product_images"("sha256");

-- CreateIndex
CREATE INDEX "ocr_jobs_submission_id_idx" ON "ocr_jobs"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "ocr_segments_ocr_job_id_sequence_number_key" ON "ocr_segments"("ocr_job_id", "sequence_number");

-- CreateIndex
CREATE INDEX "ingredient_list_observations_formula_hash_idx" ON "ingredient_list_observations"("formula_hash");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_slug_key" ON "ingredients"("slug");

-- CreateIndex
CREATE INDEX "ingredients_canonical_inci_name_idx" ON "ingredients"("canonical_inci_name");

-- CreateIndex
CREATE INDEX "ingredient_names_normalised_name_idx" ON "ingredient_names"("normalised_name");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_functions_code_key" ON "ingredient_functions"("code");

-- CreateIndex
CREATE INDEX "chemical_substances_cas_number_idx" ON "chemical_substances"("cas_number");

-- CreateIndex
CREATE INDEX "ingredient_substance_mappings_ingredient_id_idx" ON "ingredient_substance_mappings"("ingredient_id");

-- CreateIndex
CREATE INDEX "ingredient_substance_mappings_substance_id_idx" ON "ingredient_substance_mappings"("substance_id");

-- CreateIndex
CREATE INDEX "product_ingredients_normalised_token_idx" ON "product_ingredients"("normalised_token");

-- CreateIndex
CREATE UNIQUE INDEX "product_ingredients_product_version_id_position_key" ON "product_ingredients"("product_version_id", "position");

-- CreateIndex
CREATE INDEX "sources_publisher_idx" ON "sources"("publisher");

-- CreateIndex
CREATE INDEX "sources_source_type_idx" ON "sources"("source_type");

-- CreateIndex
CREATE INDEX "evidence_claims_ingredient_id_idx" ON "evidence_claims"("ingredient_id");

-- CreateIndex
CREATE INDEX "evidence_claims_substance_id_idx" ON "evidence_claims"("substance_id");

-- CreateIndex
CREATE INDEX "regulatory_rules_jurisdiction_idx" ON "regulatory_rules"("jurisdiction");

-- CreateIndex
CREATE UNIQUE INDEX "methodology_versions_name_semantic_version_key" ON "methodology_versions"("name", "semantic_version");

-- CreateIndex
CREATE INDEX "rating_runs_product_version_id_idx" ON "rating_runs"("product_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "rating_dimension_results_rating_run_id_dimension_key" ON "rating_dimension_results"("rating_run_id", "dimension");

-- CreateIndex
CREATE INDEX "rating_contributions_product_ingredient_id_idx" ON "rating_contributions"("product_ingredient_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "correction_requests_entity_type_entity_id_idx" ON "correction_requests"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_source_policies_source_id_key" ON "data_source_policies"("source_id");

-- CreateIndex
CREATE INDEX "data_source_policies_source_access_class_idx" ON "data_source_policies"("source_access_class");

-- CreateIndex
CREATE INDEX "data_source_policies_legal_review_status_idx" ON "data_source_policies"("legal_review_status");

-- CreateIndex
CREATE INDEX "data_source_policies_importer_enabled_idx" ON "data_source_policies"("importer_enabled");

-- CreateIndex
CREATE INDEX "import_jobs_source_policy_id_idx" ON "import_jobs"("source_policy_id");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

-- CreateIndex
CREATE INDEX "raw_import_records_payload_sha256_idx" ON "raw_import_records"("payload_sha256");

-- CreateIndex
CREATE UNIQUE INDEX "raw_import_records_import_job_id_external_record_id_key" ON "raw_import_records"("import_job_id", "external_record_id");

-- CreateIndex
CREATE INDEX "staged_products_review_status_idx" ON "staged_products"("review_status");

-- CreateIndex
CREATE INDEX "staged_ingredients_normalised_name_idx" ON "staged_ingredients"("normalised_name");

-- CreateIndex
CREATE INDEX "staged_ingredients_review_status_idx" ON "staged_ingredients"("review_status");

-- CreateIndex
CREATE INDEX "external_chemical_records_payload_sha256_idx" ON "external_chemical_records"("payload_sha256");

-- CreateIndex
CREATE UNIQUE INDEX "external_chemical_records_source_policy_id_external_record__key" ON "external_chemical_records"("source_policy_id", "external_record_id");

-- CreateIndex
CREATE INDEX "external_endpoint_records_endpoint_kind_idx" ON "external_endpoint_records"("endpoint_kind");

-- CreateIndex
CREATE INDEX "external_endpoint_records_review_status_idx" ON "external_endpoint_records"("review_status");

-- CreateIndex
CREATE INDEX "evidence_candidates_review_status_idx" ON "evidence_candidates"("review_status");

-- CreateIndex
CREATE INDEX "evidence_candidates_source_policy_id_idx" ON "evidence_candidates"("source_policy_id");

-- CreateIndex
CREATE INDEX "evidence_review_decisions_evidence_candidate_id_idx" ON "evidence_review_decisions"("evidence_candidate_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_aliases" ADD CONSTRAINT "brand_aliases_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_versions" ADD CONSTRAINT "product_versions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_versions" ADD CONSTRAINT "product_versions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_compared_product_version_id_fkey" FOREIGN KEY ("compared_product_version_id") REFERENCES "product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_product_image_id_fkey" FOREIGN KEY ("product_image_id") REFERENCES "product_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_segments" ADD CONSTRAINT "ocr_segments_ocr_job_id_fkey" FOREIGN KEY ("ocr_job_id") REFERENCES "ocr_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_list_observations" ADD CONSTRAINT "ingredient_list_observations_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_list_observations" ADD CONSTRAINT "ingredient_list_observations_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_names" ADD CONSTRAINT "ingredient_names_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_names" ADD CONSTRAINT "ingredient_names_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_function_mappings" ADD CONSTRAINT "ingredient_function_mappings_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_function_mappings" ADD CONSTRAINT "ingredient_function_mappings_function_id_fkey" FOREIGN KEY ("function_id") REFERENCES "ingredient_functions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_function_mappings" ADD CONSTRAINT "ingredient_function_mappings_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_substance_mappings" ADD CONSTRAINT "ingredient_substance_mappings_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_substance_mappings" ADD CONSTRAINT "ingredient_substance_mappings_substance_id_fkey" FOREIGN KEY ("substance_id") REFERENCES "chemical_substances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_substance_mappings" ADD CONSTRAINT "ingredient_substance_mappings_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "product_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_list_observation_id_fkey" FOREIGN KEY ("ingredient_list_observation_id") REFERENCES "ingredient_list_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_claims" ADD CONSTRAINT "evidence_claims_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_claims" ADD CONSTRAINT "evidence_claims_substance_id_fkey" FOREIGN KEY ("substance_id") REFERENCES "chemical_substances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_claims" ADD CONSTRAINT "evidence_claims_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_sources" ADD CONSTRAINT "claim_sources_evidence_claim_id_fkey" FOREIGN KEY ("evidence_claim_id") REFERENCES "evidence_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_sources" ADD CONSTRAINT "claim_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_rules" ADD CONSTRAINT "regulatory_rules_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_rules" ADD CONSTRAINT "regulatory_rules_substance_id_fkey" FOREIGN KEY ("substance_id") REFERENCES "chemical_substances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_rules" ADD CONSTRAINT "regulatory_rules_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_runs" ADD CONSTRAINT "rating_runs_product_version_id_fkey" FOREIGN KEY ("product_version_id") REFERENCES "product_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_runs" ADD CONSTRAINT "rating_runs_methodology_version_id_fkey" FOREIGN KEY ("methodology_version_id") REFERENCES "methodology_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_dimension_results" ADD CONSTRAINT "rating_dimension_results_rating_run_id_fkey" FOREIGN KEY ("rating_run_id") REFERENCES "rating_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_contributions" ADD CONSTRAINT "rating_contributions_rating_dimension_result_id_fkey" FOREIGN KEY ("rating_dimension_result_id") REFERENCES "rating_dimension_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_contributions" ADD CONSTRAINT "rating_contributions_product_ingredient_id_fkey" FOREIGN KEY ("product_ingredient_id") REFERENCES "product_ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_contributions" ADD CONSTRAINT "rating_contributions_evidence_claim_id_fkey" FOREIGN KEY ("evidence_claim_id") REFERENCES "evidence_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correction_requests" ADD CONSTRAINT "correction_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_source_policy_id_fkey" FOREIGN KEY ("source_policy_id") REFERENCES "data_source_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_import_records" ADD CONSTRAINT "raw_import_records_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staged_products" ADD CONSTRAINT "staged_products_raw_import_record_id_fkey" FOREIGN KEY ("raw_import_record_id") REFERENCES "raw_import_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staged_ingredients" ADD CONSTRAINT "staged_ingredients_raw_import_record_id_fkey" FOREIGN KEY ("raw_import_record_id") REFERENCES "raw_import_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_chemical_records" ADD CONSTRAINT "external_chemical_records_raw_import_record_id_fkey" FOREIGN KEY ("raw_import_record_id") REFERENCES "raw_import_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_endpoint_records" ADD CONSTRAINT "external_endpoint_records_raw_import_record_id_fkey" FOREIGN KEY ("raw_import_record_id") REFERENCES "raw_import_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_candidates" ADD CONSTRAINT "evidence_candidates_source_policy_id_fkey" FOREIGN KEY ("source_policy_id") REFERENCES "data_source_policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_candidates" ADD CONSTRAINT "evidence_candidates_raw_import_record_id_fkey" FOREIGN KEY ("raw_import_record_id") REFERENCES "raw_import_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_candidates" ADD CONSTRAINT "evidence_candidates_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_candidates" ADD CONSTRAINT "evidence_candidates_substance_id_fkey" FOREIGN KEY ("substance_id") REFERENCES "chemical_substances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_review_decisions" ADD CONSTRAINT "evidence_review_decisions_evidence_candidate_id_fkey" FOREIGN KEY ("evidence_candidate_id") REFERENCES "evidence_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
