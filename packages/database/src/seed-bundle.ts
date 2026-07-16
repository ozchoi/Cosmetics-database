import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { z } from "zod";

export const seedBundleImporterVersion = "cosmetics-evidence-seed-v0.1-importer-v1";

export interface ImportIssue {
  file: string;
  recordId?: string;
  category: string;
  severity: "info" | "warning" | "error";
  message: string;
  originalValue?: string;
  recommendedAction?: string;
}

export interface SeedBundleData {
  manifest: Record<string, unknown>;
  ingredients: IngredientSeed[];
  aliasesSubstances: AliasSubstanceSeed[];
  sources: SourceSeed[];
  evidenceClaims: EvidenceClaimSeed[];
  regulatoryRules: RegulatoryRuleSeed[];
  productSeeds: ProductSeed[];
  productIngredients: ProductIngredientSeed[];
  coverageMatrix: CoverageSeed[];
  conflictsGaps: ConflictGapSeed[];
}

export interface SeedBundleReport {
  importerVersion: string;
  bundlePath: string;
  checksumValid: boolean;
  dryRun: boolean;
  databaseWriteAttempted: boolean;
  counts: Record<string, number>;
  insertCount: number;
  updateCount: number;
  skipCount: number;
  rejectCount: number;
  issues: ImportIssue[];
}

const requiredFiles = [
  "README.md",
  "manifest.json",
  "sha256sums.json",
  "seed_bundle.json",
  "ingredients.csv",
  "aliases_substances.csv",
  "source_registry.csv",
  "evidence_claims.csv",
  "regulatory_rules.csv",
  "product_seeds.csv",
  "product_ingredients.csv",
  "coverage_matrix.csv",
  "conflicts_gaps.csv",
  "codex_import_prompt.txt",
] as const;

const nonEmpty = z.string().trim().min(1);
const optionalText = z.string();

const ingredientSchema = z.object({
  ingredient_id: nonEmpty.regex(/^ING-\d{4}$/u),
  canonical_inci: nonEmpty,
  preferred_english: nonEmpty,
  preferred_zh_hant_hk: nonEmpty,
  ingredient_type: nonEmpty,
  functions_zh: optionalText,
  cas_number: optionalText,
  ec_number: optionalText,
  pubchem_cid: optionalText,
  substance_identity_notes: optionalText,
  identity_source: optionalText,
  identity_source_url: optionalText,
  translation_status: optionalText,
  review_status: nonEmpty,
  last_reviewed_at: optionalText,
});
export type IngredientSeed = z.infer<typeof ingredientSchema>;

const aliasSubstanceSchema = z.object({
  record_id: nonEmpty,
  ingredient_id: nonEmpty,
  record_type: nonEmpty,
  alias_or_substance_name: nonEmpty,
  language_code: optionalText,
  region_code: optionalText,
  alias_type: optionalText,
  cas_number: optionalText,
  pubchem_cid: optionalText,
  relationship_type: optionalText,
  mapping_confidence: optionalText,
  source_url: optionalText,
  notes: optionalText,
});
export type AliasSubstanceSeed = z.infer<typeof aliasSubstanceSchema>;

const sourceSchema = z.object({
  source_id: nonEmpty.regex(/^SRC-\d{3}$/u),
  publisher: nonEmpty,
  title: nonEmpty,
  source_type: nonEmpty,
  authority_level: optionalText,
  jurisdiction: optionalText,
  endpoint_scope: optionalText,
  primary_or_secondary: optionalText,
  publication_date: optionalText,
  version: optionalText,
  external_url: optionalText,
  exact_locator: optionalText,
  accessed_at: optionalText,
  licence_status: nonEmpty,
  commercial_reuse_status: nonEmpty,
  attribution_text: optionalText,
  review_status: nonEmpty,
  notes: optionalText,
});
export type SourceSeed = z.infer<typeof sourceSchema>;

const evidenceClaimSchema = z.object({
  claim_id: nonEmpty.regex(/^CLM-\d{4}$/u),
  ingredient_id: nonEmpty,
  domain: nonEmpty,
  endpoint: nonEmpty,
  conclusion_code: nonEmpty,
  context_label_zh: optionalText,
  summary_zh_hant: nonEmpty,
  concentration_min: optionalText,
  concentration_max: optionalText,
  concentration_unit: optionalText,
  concentration_basis: optionalText,
  usage_type: optionalText,
  product_form: optionalText,
  route: optionalText,
  population: optionalText,
  age_min: optionalText,
  age_max: optionalText,
  aggregation_context: optionalText,
  evidence_kind: nonEmpty,
  evidence_grade: nonEmpty,
  claim_status: nonEmpty,
  requires_product_context: optionalText,
  source_id: nonEmpty,
  source_version: optionalText,
  publication_date: optionalText,
  exact_locator: optionalText,
  limitations_zh_hant: optionalText,
  reviewer_status: optionalText,
});
export type EvidenceClaimSeed = z.infer<typeof evidenceClaimSchema>;

const regulatoryRuleSchema = z.object({
  rule_id: nonEmpty.regex(/^REG-\d{3}$/u),
  ingredient_id: optionalText,
  legal_instrument: optionalText,
  jurisdiction: nonEmpty,
  rule_type: nonEmpty,
  threshold_min: optionalText,
  threshold_unit: optionalText,
  status: nonEmpty,
  product_scope: optionalText,
  usage_type: optionalText,
  effective_from: optionalText,
  effective_to: optionalText,
  source_id: nonEmpty,
  exact_locator: optionalText,
  summary_zh_hant: nonEmpty,
  notes: optionalText,
});
export type RegulatoryRuleSeed = z.infer<typeof regulatoryRuleSchema>;

const productSeedSchema = z.object({
  product_version_id: nonEmpty.regex(/^PRD-\d{4}-V\d+$/u),
  brand: nonEmpty,
  product_name: nonEmpty,
  market: nonEmpty,
  category: nonEmpty,
  product_form: nonEmpty,
  usage_type: nonEmpty,
  body_area: nonEmpty,
  label_observed_at: nonEmpty,
  verification_status: nonEmpty,
  package_photo_verified: nonEmpty,
  publication_status: nonEmpty,
  formula_hash: nonEmpty.regex(/^[a-f0-9]{64}$/u),
  ingredient_count: nonEmpty,
  source_id: nonEmpty,
  source_url: optionalText,
  source_accessed_at: optionalText,
  source_warning_zh: nonEmpty,
  notes: optionalText,
});
export type ProductSeed = z.infer<typeof productSeedSchema>;

const productIngredientSchema = z.object({
  product_version_id: nonEmpty,
  position: nonEmpty,
  raw_label_token: nonEmpty,
  normalized_token: nonEmpty,
  ingredient_id: optionalText,
  matched_inci: optionalText,
  match_status: nonEmpty,
  match_method: optionalText,
  match_confidence: optionalText,
  is_may_contain: optionalText,
  source_id: optionalText,
  notes: optionalText,
});
export type ProductIngredientSeed = z.infer<typeof productIngredientSchema>;

const coverageSchema = z.object({
  ingredient_id: nonEmpty,
  canonical_inci: nonEmpty,
  CosIng: optionalText,
  PubChem: optionalText,
  CIR: optionalText,
  SCCS: optionalText,
  EU_REACH_ECHA: optionalText,
  EPA_CompTox_ECOTOX: optionalText,
  Health_Canada: optionalText,
  NORMAN: optionalText,
  NMPA_IECIC: optionalText,
  Product_Label_Observed: optionalText,
  Reviewed_Count: optionalText,
  Pending_Count: optionalText,
  notes: optionalText,
});
export type CoverageSeed = z.infer<typeof coverageSchema>;

const conflictGapSchema = z.object({
  gap_id: nonEmpty,
  priority: nonEmpty,
  entity_type: nonEmpty,
  entity_id: nonEmpty,
  issue_category: nonEmpty,
  issue_zh: nonEmpty,
  impact_zh: nonEmpty,
  recommended_action_zh: nonEmpty,
  source_or_context: optionalText,
  status: nonEmpty,
});
export type ConflictGapSeed = z.infer<typeof conflictGapSchema>;

export const validateChecksums = (bundlePath: string): ImportIssue[] => {
  const issues: ImportIssue[] = [];
  const sumsPath = join(bundlePath, "sha256sums.json");
  if (!existsSync(sumsPath)) {
    return [
      {
        file: "sha256sums.json",
        category: "checksum",
        severity: "error",
        message: "Missing sha256sums.json; import stopped.",
      },
    ];
  }
  const parsedSums = JSON.parse(readFileSync(sumsPath, "utf8")) as
    Record<string, string> | { files?: Record<string, string> };
  const candidate = parsedSums as { files?: unknown };
  const sums: Record<string, string> =
    candidate.files && typeof candidate.files === "object"
      ? (candidate.files as Record<string, string>)
      : (parsedSums as Record<string, string>);
  for (const file of requiredFiles) {
    if (file === "sha256sums.json") {
      if (!existsSync(join(bundlePath, file))) {
        issues.push({
          file,
          category: "checksum",
          severity: "error",
          message: "Required checksum file is missing from bundle.",
        });
      }
      continue;
    }
    const expected = sums[file];
    const filePath = join(bundlePath, file);
    if (!expected || !existsSync(filePath)) {
      issues.push({
        file,
        category: "checksum",
        severity: "error",
        message: "Required file is missing from checksum registry or bundle.",
      });
      continue;
    }
    const actual = sha256(readFileSync(filePath));
    if (actual !== expected) {
      issues.push({
        file,
        category: "checksum",
        severity: "error",
        message: "SHA-256 checksum mismatch; import stopped.",
        originalValue: actual,
        recommendedAction: `Expected ${expected}. Re-download or re-export the immutable bundle.`,
      });
    }
  }
  return issues;
};

export const loadSeedBundle = (
  bundlePath: string,
): { data?: SeedBundleData; issues: ImportIssue[] } => {
  const checksumIssues = validateChecksums(bundlePath);
  if (checksumIssues.some((issue) => issue.severity === "error")) {
    return { issues: checksumIssues };
  }

  const issues: ImportIssue[] = [];
  const parseFile = <T extends z.ZodType>(
    file: string,
    schema: T,
    idField: string,
  ): Array<z.infer<T>> => {
    const rows = parseCsv(readFileSync(join(bundlePath, file), "utf8"));
    return rows.flatMap((row, index) => {
      const parsed = schema.safeParse(row);
      if (parsed.success) return [parsed.data];
      issues.push({
        file,
        recordId: String(row[idField] ?? `row-${index + 2}`),
        category: "schema_validation",
        severity: "error",
        message: z.prettifyError(parsed.error),
      });
      return [];
    });
  };

  const data: SeedBundleData = {
    manifest: JSON.parse(readFileSync(join(bundlePath, "manifest.json"), "utf8")) as Record<
      string,
      unknown
    >,
    ingredients: parseFile("ingredients.csv", ingredientSchema, "ingredient_id"),
    aliasesSubstances: parseFile("aliases_substances.csv", aliasSubstanceSchema, "record_id"),
    sources: parseFile("source_registry.csv", sourceSchema, "source_id"),
    evidenceClaims: parseFile("evidence_claims.csv", evidenceClaimSchema, "claim_id"),
    regulatoryRules: parseFile("regulatory_rules.csv", regulatoryRuleSchema, "rule_id"),
    productSeeds: parseFile("product_seeds.csv", productSeedSchema, "product_version_id"),
    productIngredients: parseFile(
      "product_ingredients.csv",
      productIngredientSchema,
      "product_version_id",
    ),
    coverageMatrix: parseFile("coverage_matrix.csv", coverageSchema, "ingredient_id"),
    conflictsGaps: parseFile("conflicts_gaps.csv", conflictGapSchema, "gap_id"),
  };

  issues.push(...validateRelationships(data));
  return { data, issues };
};

export const createImportReport = (
  bundlePath: string,
  dryRun: boolean,
  databaseWriteAttempted = false,
): SeedBundleReport => {
  const { data, issues } = loadSeedBundle(bundlePath);
  const counts = data
    ? {
        sources: data.sources.length,
        ingredients: data.ingredients.length,
        aliasesAndSubstanceMappings: data.aliasesSubstances.length,
        evidenceClaims: data.evidenceClaims.length,
        regulatoryRules: data.regulatoryRules.length,
        productVersions: data.productSeeds.length,
        productIngredientTokens: data.productIngredients.length,
        unresolvedTokens: data.productIngredients.filter(
          (item) => item.match_status === "unresolved_in_seed",
        ).length,
        coverageRows: data.coverageMatrix.length,
        conflictGapRows: data.conflictsGaps.length,
        reviewIssues: issues.length + (data?.conflictsGaps.length ?? 0),
      }
    : {};
  const errors = issues.filter((issue) => issue.severity === "error").length;
  return {
    importerVersion: seedBundleImporterVersion,
    bundlePath,
    checksumValid: !issues.some(
      (issue) => issue.category === "checksum" && issue.severity === "error",
    ),
    dryRun,
    databaseWriteAttempted,
    counts,
    insertCount:
      dryRun || errors > 0 ? 0 : Object.values(counts).reduce((sum, value) => sum + value, 0),
    updateCount: 0,
    skipCount: 0,
    rejectCount: errors,
    issues,
  };
};

export const writeReport = (report: SeedBundleReport, outPath: string) => {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
};

export const writeSharedSnapshot = (bundlePath: string, outputPath: string): SeedBundleReport => {
  const { data, issues } = loadSeedBundle(bundlePath);
  if (!data || issues.some((issue) => issue.severity === "error")) {
    return createImportReport(bundlePath, false, false);
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, renderSharedSnapshot(data, issues));
  return createImportReport(bundlePath, false, false);
};

export const renderSharedSnapshot = (data: SeedBundleData, issues: ImportIssue[]): string => {
  const ingredientSlugById = new Map(
    data.ingredients.map((ingredient) => [
      ingredient.ingredient_id,
      slugify(ingredient.canonical_inci),
    ]),
  );
  const sourceRecords = data.sources.map((source) => ({
    id: source.source_id,
    publisher: source.publisher,
    title: source.title,
    sourceType: mapSourceType(source.source_type),
    jurisdiction: blankToUndefined(source.jurisdiction),
    publicationDate: blankToUndefined(source.publication_date),
    version: blankToUndefined(source.version),
    externalUrl: blankToUndefined(source.external_url),
    exactLocator: blankToUndefined(source.exact_locator),
    accessedAt: blankToUndefined(source.accessed_at),
    languageCode: undefined,
    licenceStatus: mapLicenceStatus(source.licence_status),
    commercialReuseStatus: mapReuseStatus(source.commercial_reuse_status),
    reviewStatus: source.review_status === "discovery_only" ? "draft" : "reviewed",
    evidenceGrade: "U",
    evidenceRelationship: mapRelationship(source.primary_or_secondary),
    isDemo: false,
  }));
  const aliasByIngredient = groupBy(data.aliasesSubstances, (item) => item.ingredient_id);
  const claimByIngredient = groupBy(data.evidenceClaims, (claim) => claim.ingredient_id);
  const regulatoryByIngredient = groupBy(
    data.regulatoryRules.filter((rule) => rule.ingredient_id),
    (rule) => rule.ingredient_id,
  );
  const ingredientRecords = data.ingredients.map((ingredient) => {
    const aliases = (aliasByIngredient.get(ingredient.ingredient_id) ?? [])
      .filter((item) => item.record_type === "alias")
      .map((item) => ({
        name: item.alias_or_substance_name,
        languageCode: item.language_code || "und",
        regionCode: blankToUndefined(item.region_code),
        nameType: mapNameType(item.alias_type),
        reviewed: item.mapping_confidence === "reviewed" || ingredient.review_status === "reviewed",
      }));
    const identifiers = [
      ingredient.cas_number ? { kind: "CAS", value: ingredient.cas_number } : undefined,
      ingredient.ec_number ? { kind: "EC", value: ingredient.ec_number } : undefined,
      ingredient.pubchem_cid ? { kind: "PubChem", value: ingredient.pubchem_cid } : undefined,
    ].filter(Boolean);
    return {
      id: ingredient.ingredient_id,
      slug: ingredientSlugById.get(ingredient.ingredient_id)!,
      canonicalInciName: ingredient.canonical_inci,
      preferredEnglishName: ingredient.preferred_english,
      preferredZhHantHkName: ingredient.preferred_zh_hant_hk,
      ingredientType: mapIngredientType(ingredient.ingredient_type),
      functions: splitFunctions(ingredient.functions_zh),
      identifiers,
      aliases,
      descriptionZhHant:
        ingredient.substance_identity_notes || "資料不足；不應將資料不足解讀為低潛在關注。",
      reviewStatus: ingredient.review_status === "reviewed" ? "reviewed" : "draft",
      lastReviewedAt: blankToUndefined(ingredient.last_reviewed_at),
      evidenceClaims: (claimByIngredient.get(ingredient.ingredient_id) ?? []).map(
        mapClaimForSnapshot,
      ),
      regulatoryRules: (regulatoryByIngredient.get(ingredient.ingredient_id) ?? []).map(
        mapRuleForSnapshot,
      ),
      identityNotes: ingredient.substance_identity_notes,
      translationStatus: ingredient.translation_status,
    };
  });
  const productIngredients = groupBy(data.productIngredients, (item) => item.product_version_id);
  const sourceById = new Map(data.sources.map((source) => [source.source_id, source]));
  const products = [
    ...groupBy(data.productSeeds, (item) => `${item.brand}:::${item.product_name}`).entries(),
  ].map(([key, versions]) => {
    const [brand, productName] = key.split(":::");
    const productId = stableProductId(versions[0]!.product_version_id);
    return {
      id: productId,
      slug: slugify(`${brand}-${productName}`),
      brand,
      brandSlug: slugify(brand ?? ""),
      preferredName: productName,
      descriptionZhHant:
        "此產品成分表來自品牌官方網頁，尚未與香港實物包裝逐字核實；配方可能因市場、時間或產品版本而不同。",
      versions: versions.map((version) => ({
        id: version.product_version_id,
        versionLabel: version.product_version_id,
        marketCode: version.market,
        barcode: undefined,
        category: version.category,
        productForm: mapProductForm(version.product_form),
        usageType: mapUsageType(version.usage_type),
        bodyArea: version.body_area.split(/[_;/,\s]+/u).filter(Boolean),
        targetUserGroup: "未指定",
        labelObservedAt: version.label_observed_at,
        lastIndependentVerificationAt: undefined,
        brandConfirmedAt: undefined,
        conflictingNewerSubmissionCount: 0,
        marketSpecificEvidenceCount: 0,
        formulaHash: version.formula_hash,
        verificationStatus: "brand_page",
        publicationStatus: "published_with_source_warning",
        submittedAt: version.label_observed_at,
        evidenceConfidence: "U",
        dataCompleteness: 0.35,
        concernDimensionValues: {},
        ingredients: (productIngredients.get(version.product_version_id) ?? [])
          .sort((left, right) => Number(left.position) - Number(right.position))
          .map((item) => ({
            position: Number(item.position),
            rawLabelToken: item.raw_label_token,
            normalisedToken: item.normalized_token,
            ingredientSlug: item.ingredient_id
              ? ingredientSlugById.get(item.ingredient_id)
              : undefined,
            matchStatus: item.match_status === "unresolved_in_seed" ? "unresolved" : "confirmed",
            rawMatchStatus: item.match_status,
            matchMethod: item.match_method || "seed_mapping",
            matchConfidence: Number(item.match_confidence || 0),
            sourceId: blankToUndefined(item.source_id),
            notes: blankToUndefined(item.notes),
          })),
        sourceIds: [version.source_id],
        sourceWarningZh: version.source_warning_zh,
        sourceUrl: version.source_url,
        sourceAccessedAt: version.source_accessed_at,
        packagePhotoVerified: version.package_photo_verified.toLowerCase() === "true",
        rawVerificationStatus: version.verification_status,
        sourcePublisher: sourceById.get(version.source_id)?.publisher,
      })),
    };
  });
  const evidenceSummaries = data.evidenceClaims.map((claim) => ({
    id: claim.claim_id,
    ingredientSlug: ingredientSlugById.get(claim.ingredient_id) ?? slugify(claim.ingredient_id),
    dimension: mapConcernDimension(claim),
    summaryZhHant: claim.summary_zh_hant,
    evidenceGrade: mapEvidenceGrade(claim.evidence_grade),
    dataCompleteness: claim.claim_status === "active" ? 0.7 : 0.25,
    sourceIds: [claim.source_id],
    endpoint: claim.endpoint,
    conclusionCode: claim.conclusion_code,
    contextLabelZh: claim.context_label_zh,
    concentration:
      claim.concentration_min || claim.concentration_max
        ? `${claim.concentration_min || "?"}-${claim.concentration_max || "?"} ${claim.concentration_unit}`.trim()
        : undefined,
    usageType: blankToUndefined(claim.usage_type),
    productForm: blankToUndefined(claim.product_form),
    route: blankToUndefined(claim.route),
    population: blankToUndefined(claim.population),
    limitationsZhHant: blankToUndefined(claim.limitations_zh_hant),
    claimStatus: claim.claim_status,
    exactLocator: blankToUndefined(claim.exact_locator),
    sourceVersion: blankToUndefined(claim.source_version),
    publicationDate: blankToUndefined(claim.publication_date),
  }));
  const coverage = data.coverageMatrix.map((row) => ({ ...row }));
  const reviewIssues = [
    ...data.conflictsGaps.map((gap) => ({
      id: gap.gap_id,
      priority: gap.priority,
      entityType: gap.entity_type,
      entityId: gap.entity_id,
      issueCategory: gap.issue_category,
      issueZh: gap.issue_zh,
      impactZh: gap.impact_zh,
      recommendedActionZh: gap.recommended_action_zh,
      sourceOrContext: gap.source_or_context,
      status: gap.status,
    })),
    ...issues.map((issue, index) => ({
      id: `IMPORT-${String(index + 1).padStart(3, "0")}`,
      priority: issue.severity === "error" ? "High" : "Medium",
      entityType: "import",
      entityId: issue.recordId ?? issue.file,
      issueCategory: issue.category,
      issueZh: issue.message,
      impactZh: "匯入時需保留原始值並交由審核員處理。",
      recommendedActionZh: issue.recommendedAction ?? "檢查來源資料及欄位映射。",
      sourceOrContext: issue.file,
      status: "open",
    })),
  ];
  return `// Generated by ${seedBundleImporterVersion}. Do not edit by hand.\n\nexport const seedIngredientRecords = ${toTs(ingredientRecords)};\n\nexport const seedSourceRecords = ${toTs(sourceRecords)};\n\nexport const seedProductRecords = ${toTs(products)};\n\nexport const seedEvidenceSummaries = ${toTs(evidenceSummaries)};\n\nexport const seedCoverageRecords = ${toTs(coverage)};\n\nexport const seedReviewIssueRecords = ${toTs(reviewIssues)};\n`;
};

const validateRelationships = (data: SeedBundleData): ImportIssue[] => {
  const issues: ImportIssue[] = [];
  const ingredientIds = new Set(data.ingredients.map((item) => item.ingredient_id));
  const sourceById = new Map(data.sources.map((item) => [item.source_id, item]));
  for (const alias of data.aliasesSubstances) {
    if (!ingredientIds.has(alias.ingredient_id)) {
      issues.push(
        issue(
          "aliases_substances.csv",
          alias.record_id,
          "missing_ingredient",
          "error",
          alias.ingredient_id,
        ),
      );
    }
  }
  for (const claim of data.evidenceClaims) {
    if (!ingredientIds.has(claim.ingredient_id)) {
      issues.push(
        issue(
          "evidence_claims.csv",
          claim.claim_id,
          "missing_ingredient",
          "error",
          claim.ingredient_id,
        ),
      );
    }
    const source = sourceById.get(claim.source_id);
    if (!source) {
      issues.push(
        issue("evidence_claims.csv", claim.claim_id, "missing_source", "error", claim.source_id),
      );
    }
    if (claim.claim_status === "active" && source?.review_status === "discovery_only") {
      issues.push({
        file: "evidence_claims.csv",
        recordId: claim.claim_id,
        category: "discovery_only_active_claim",
        severity: "error",
        message:
          "Active claims cannot be supported only by discovery or secondary consumer sources.",
      });
    }
    if ((claim.concentration_min || claim.concentration_max) && !claim.concentration_unit) {
      issues.push(
        issue("evidence_claims.csv", claim.claim_id, "missing_concentration_unit", "error"),
      );
    }
    if (
      claim.concentration_min &&
      claim.concentration_max &&
      Number(claim.concentration_min) > Number(claim.concentration_max)
    ) {
      issues.push(
        issue("evidence_claims.csv", claim.claim_id, "invalid_concentration_range", "error"),
      );
    }
    if (claim.domain === "environmental_health" && /SCCS/u.test(claim.source_id)) {
      issues.push(issue("evidence_claims.csv", claim.claim_id, "scope_mismatch", "warning"));
    }
  }
  for (const rule of data.regulatoryRules) {
    if (!rule.jurisdiction)
      issues.push(issue("regulatory_rules.csv", rule.rule_id, "missing_jurisdiction", "error"));
    if (!sourceById.has(rule.source_id))
      issues.push(issue("regulatory_rules.csv", rule.rule_id, "missing_source", "error"));
    if (rule.threshold_min && !rule.threshold_unit) {
      issues.push(
        issue("regulatory_rules.csv", rule.rule_id, "missing_concentration_unit", "error"),
      );
    }
  }
  const versionIds = new Set(data.productSeeds.map((item) => item.product_version_id));
  const positionsByVersion = new Map<string, Set<string>>();
  for (const item of data.productIngredients) {
    if (!versionIds.has(item.product_version_id)) {
      issues.push(
        issue(
          "product_ingredients.csv",
          item.product_version_id,
          "missing_product_version",
          "error",
        ),
      );
    }
    if (item.ingredient_id && !ingredientIds.has(item.ingredient_id)) {
      issues.push(
        issue(
          "product_ingredients.csv",
          item.product_version_id,
          "missing_ingredient",
          "error",
          item.ingredient_id,
        ),
      );
    }
    const positions = positionsByVersion.get(item.product_version_id) ?? new Set<string>();
    if (positions.has(item.position)) {
      issues.push(
        issue(
          "product_ingredients.csv",
          item.product_version_id,
          "duplicate_position",
          "error",
          item.position,
        ),
      );
    }
    positions.add(item.position);
    positionsByVersion.set(item.product_version_id, positions);
  }
  for (const product of data.productSeeds) {
    const tokens = data.productIngredients
      .filter((item) => item.product_version_id === product.product_version_id)
      .sort((left, right) => Number(left.position) - Number(right.position))
      .map((item) => item.normalized_token);
    if (Number(product.ingredient_count) !== tokens.length) {
      issues.push(
        issue(
          "product_seeds.csv",
          product.product_version_id,
          "ingredient_count_mismatch",
          "warning",
        ),
      );
    }
    const recalculated = formulaHash(tokens);
    if (recalculated !== product.formula_hash) {
      issues.push({
        file: "product_seeds.csv",
        recordId: product.product_version_id,
        category: "formula_hash_mismatch",
        severity: "warning",
        message:
          "Recalculated formula hash differs from source value; source value is preserved and review is required.",
        originalValue: product.formula_hash,
        recommendedAction: `Recalculated ${recalculated}. Confirm the bundle hash method before publication.`,
      });
    }
    if (
      product.verification_status === "brand_page" &&
      product.package_photo_verified.toLowerCase() === "true"
    ) {
      issues.push(
        issue(
          "product_seeds.csv",
          product.product_version_id,
          "invalid_package_photo_status",
          "error",
        ),
      );
    }
  }
  return issues;
};

export const formulaHash = (normalisedOrderedTokens: string[]): string =>
  sha256(
    Buffer.from(normalisedOrderedTokens.map((token) => token.trim().toLowerCase()).join("\n")),
  );

const parseCsv = (text: string): Array<Record<string, string>> => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/u, "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]!;
    const next = input[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/u, ""));
    rows.push(row);
  }
  const [header, ...body] = rows.filter((item) => item.some((cellValue) => cellValue.trim()));
  if (!header) return [];
  return body.map((cells) =>
    Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])),
  );
};

const issue = (
  file: string,
  recordId: string,
  category: string,
  severity: "warning" | "error",
  originalValue?: string,
): ImportIssue => ({
  file,
  recordId,
  category,
  severity,
  message: `${category} requires reviewer attention.`,
  ...(originalValue ? { originalValue } : {}),
});

const sha256 = (buffer: Buffer): string => createHash("sha256").update(buffer).digest("hex");
const blankToUndefined = (value: string): string | undefined => (value.trim() ? value : undefined);
const splitFunctions = (value: string): string[] =>
  value
    .split(/[;；|、]/u)
    .map((item) => item.trim())
    .filter(Boolean);
const slugify = (value: string): string =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
const stableProductId = (versionId: string): string => versionId.replace(/-V\d+$/u, "");
const toTs = (value: unknown): string => `${JSON.stringify(value, null, 2)} as const`;
const groupBy = <T>(items: T[], key: (item: T) => string): Map<string, T[]> => {
  const grouped = new Map<string, T[]>();
  for (const item of items) grouped.set(key(item), [...(grouped.get(key(item)) ?? []), item]);
  return grouped;
};

const mapIngredientType = (value: string) =>
  [
    "defined_chemical",
    "mixture",
    "uvcb",
    "botanical",
    "extract",
    "polymer",
    "fragrance_mixture",
    "colourant",
    "mineral",
    "stereochemical_family",
    "material_family",
  ].includes(value)
    ? value
    : "unknown";
const mapUsageType = (value: string) =>
  ["leave_on", "rinse_off", "mixed"].includes(value) ? value : "unknown";
const mapProductForm = (value: string) =>
  ["cream", "liquid", "gel", "powder", "spray", "aerosol", "stick", "serum"].includes(value)
    ? value
    : "unknown";
const mapNameType = (value: string) =>
  [
    "preferred",
    "inci",
    "common",
    "scientific",
    "botanical",
    "label_alias",
    "historical",
    "misspelling",
  ].includes(value)
    ? value
    : "common";
const mapEvidenceGrade = (value: string) =>
  ["A", "B", "C", "D", "U"].includes(value) ? value : "U";
const mapSourceType = (value: string) => {
  if (/legislation|regulation/u.test(value)) return "regulation";
  if (/opinion/u.test(value)) return "official_opinion";
  if (/brand/u.test(value)) return "brand_document";
  if (/secondary|consumer/u.test(value)) return "discovery_source";
  if (/study/u.test(value)) return "original_study";
  return "professional_database";
};
const mapLicenceStatus = (value: string) =>
  value === "restricted" ? "restricted" : value === "unknown" ? "unknown" : "known";
const mapReuseStatus = (value: string) =>
  value === "restricted" ? "restricted" : value === "allowed" ? "allowed" : "unknown";
const mapRelationship = (value: string) => {
  if (value === "secondary") return "discovery";
  if (value === "aggregator") return "supporting";
  return "primary";
};
const mapConcernDimension = (claim: EvidenceClaimSeed) => {
  if (claim.domain === "environmental_health") return "environment";
  if (/regulatory/u.test(claim.domain)) return "regulatory_market";
  if (/inhal/i.test(`${claim.endpoint} ${claim.route} ${claim.product_form}`)) return "inhalation";
  if (/sensiti|allerg/i.test(claim.endpoint)) return "sensitisation";
  if (/eye|skin|irrit/i.test(claim.endpoint)) return "skin_eye";
  return "systemic_health";
};
const mapClaimForSnapshot = (claim: EvidenceClaimSeed) => ({
  id: claim.claim_id,
  domain: claim.domain,
  endpoint: claim.endpoint,
  conclusionCode: claim.conclusion_code,
  contextLabelZh: claim.context_label_zh,
  summaryZhHant: claim.summary_zh_hant,
  concentrationMin: blankToUndefined(claim.concentration_min),
  concentrationMax: blankToUndefined(claim.concentration_max),
  concentrationUnit: blankToUndefined(claim.concentration_unit),
  concentrationBasis: blankToUndefined(claim.concentration_basis),
  usageType: blankToUndefined(claim.usage_type),
  productForm: blankToUndefined(claim.product_form),
  route: blankToUndefined(claim.route),
  population: blankToUndefined(claim.population),
  ageMin: blankToUndefined(claim.age_min),
  ageMax: blankToUndefined(claim.age_max),
  aggregationContext: blankToUndefined(claim.aggregation_context),
  evidenceKind: claim.evidence_kind,
  evidenceGrade: mapEvidenceGrade(claim.evidence_grade),
  claimStatus: claim.claim_status,
  sourceIds: [claim.source_id],
  sourceVersion: blankToUndefined(claim.source_version),
  publicationDate: blankToUndefined(claim.publication_date),
  exactLocator: blankToUndefined(claim.exact_locator),
  limitationsZhHant: blankToUndefined(claim.limitations_zh_hant),
});
const mapRuleForSnapshot = (rule: RegulatoryRuleSeed) => ({
  id: rule.rule_id,
  jurisdiction: rule.jurisdiction,
  ruleType: rule.rule_type,
  status: rule.status,
  productScope: blankToUndefined(rule.product_scope),
  usageType: blankToUndefined(rule.usage_type),
  legalInstrument: blankToUndefined(rule.legal_instrument),
  concentrationMin: blankToUndefined(rule.threshold_min),
  concentrationMax: undefined,
  concentrationUnit: blankToUndefined(rule.threshold_unit),
  requiredWarningText: undefined,
  effectiveFrom: blankToUndefined(rule.effective_from),
  effectiveTo: blankToUndefined(rule.effective_to),
  sourceId: rule.source_id,
  exactLocator: blankToUndefined(rule.exact_locator),
  summaryZhHant: rule.summary_zh_hant,
  reviewStatus: "reviewed",
  notes: blankToUndefined(rule.notes),
});

export const defaultBundlePath = "/Users/chunyinchoi/Downloads/cosmetics_evidence_seed_v0.1";
export const defaultReportPath = relative(
  process.cwd(),
  join(process.cwd(), "data", "import-reports", "cosmetics_evidence_seed_v0.1.report.json"),
);
