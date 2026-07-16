import {
  seedCoverageRecords,
  seedEvidenceSummaries,
  seedIngredientRecords,
  seedProductRecords,
  seedReviewIssueRecords,
  seedSourceRecords,
} from "./imported-seed-data";

export const appConfig = {
  productName: process.env["APP_NAME"] ?? "化妝品成分資料平台",
  productEnglishName: process.env["APP_ENGLISH_NAME"] ?? "Cosmetic Ingredient Database",
  locale: "zh-Hant-HK",
  formulationStaleYears: Number(process.env["FORMULATION_STALE_YEARS"] ?? 3),
} as const;

export type EvidenceGrade = "A" | "B" | "C" | "D" | "U";

export type IngredientType =
  | "defined_chemical"
  | "mixture"
  | "uvcb"
  | "botanical"
  | "extract"
  | "polymer"
  | "fragrance_mixture"
  | "colourant"
  | "mineral"
  | "stereochemical_family"
  | "material_family"
  | "unknown";

export type UsageType = "leave_on" | "rinse_off" | "mixed" | "unknown";

export type ProductForm =
  "cream" | "liquid" | "gel" | "powder" | "spray" | "aerosol" | "stick" | "serum" | "unknown";

export type VerificationStatus =
  | "pending_review"
  | "reviewed"
  | "needs_correction"
  | "rejected"
  | "brand_page"
  | "externally_imported_unverified";

export type SourceAccessClass =
  | "open_structured_source"
  | "official_reference_source"
  | "secondary_or_discovery_source"
  | "user_contributed_primary_observation";

export type SourceAccessMethod =
  "API" | "bulk_export" | "manual_entry" | "user_submission" | "reviewer_research" | "prohibited";

export type LegalReviewStatus = "not_reviewed" | "provisional" | "approved" | "rejected";

export type CommercialUseStatus = "allowed" | "restricted" | "unknown" | "prohibited";

export type ConcernDimension =
  | "skin_eye"
  | "sensitisation"
  | "systemic_health"
  | "inhalation"
  | "environment"
  | "regulatory_market";

export const concernDimensionLabels: Record<ConcernDimension, string> = {
  skin_eye: "局部皮膚／眼睛關注",
  sensitisation: "過敏／致敏關注",
  systemic_health: "系統性健康關注",
  inhalation: "呼吸／吸入關注",
  environment: "環境關注",
  regulatory_market: "法規及市場訊號",
};

export const evidenceGradeDescriptions: Record<EvidenceGrade, string> = {
  A: "官方法規、最終官方安全意見，或與條件高度相符的權威證據。",
  B: "高質素人體證據、系統性評估，或多個一致的高質素來源。",
  C: "有限人體、動物、體外、類推或單一研究證據。",
  D: "模型、QSAR、間接推論或非常有限證據。",
  U: "資料不足或未能取得相關證據。",
};

export interface IngredientIdentifier {
  kind: "CAS" | "EC" | "PubChem" | "DTXSID" | "CI";
  value: string;
}

export interface IngredientAlias {
  name: string;
  languageCode: string;
  regionCode?: string;
  nameType:
    | "preferred"
    | "inci"
    | "common"
    | "scientific"
    | "botanical"
    | "label_alias"
    | "historical"
    | "misspelling";
  reviewed: boolean;
}

export interface IngredientRecord {
  id: string;
  slug: string;
  canonicalInciName: string;
  preferredEnglishName: string;
  preferredZhHantHkName: string;
  ingredientType: IngredientType;
  functions: string[];
  identifiers: IngredientIdentifier[];
  aliases: IngredientAlias[];
  descriptionZhHant: string;
  reviewStatus: "reviewed" | "draft";
  lastReviewedAt?: string;
  evidenceClaims?: EvidenceClaimRecord[];
  regulatoryRules?: RegulatoryRuleRecord[];
  identityNotes?: string;
  translationStatus?: string;
}

export interface EvidenceClaimRecord {
  id: string;
  domain: string;
  endpoint: string;
  conclusionCode: string;
  contextLabelZh?: string;
  summaryZhHant: string;
  concentrationMin?: string;
  concentrationMax?: string;
  concentrationUnit?: string;
  concentrationBasis?: string;
  usageType?: string;
  productForm?: string;
  route?: string;
  population?: string;
  ageMin?: string;
  ageMax?: string;
  aggregationContext?: string;
  evidenceKind: string;
  evidenceGrade: EvidenceGrade;
  claimStatus: string;
  sourceIds: string[];
  sourceVersion?: string;
  publicationDate?: string;
  exactLocator?: string;
  limitationsZhHant?: string;
}

export interface RegulatoryRuleRecord {
  id: string;
  jurisdiction: string;
  ruleType: string;
  status: string;
  productScope?: string;
  usageType?: string;
  concentrationMin?: string;
  concentrationMax?: string;
  concentrationUnit?: string;
  requiredWarningText?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  sourceId: string;
  exactLocator?: string;
  summaryZhHant: string;
  reviewStatus: string;
  notes?: string;
}

export interface SourceRecord {
  id: string;
  publisher: string;
  title: string;
  sourceType:
    | "regulation"
    | "official_opinion"
    | "original_study"
    | "systematic_review"
    | "professional_database"
    | "brand_document"
    | "package_label"
    | "open_product_database"
    | "secondary_website"
    | "discovery_source"
    | "community_submission"
    | "reference_only_no_import";
  jurisdiction?: string;
  publicationDate?: string;
  version?: string;
  externalUrl?: string;
  exactLocator?: string;
  accessedAt?: string;
  languageCode?: string;
  licenceStatus: "known" | "unknown" | "restricted" | "not_applicable";
  commercialReuseStatus: "allowed" | "unknown" | "restricted" | "not_applicable";
  reviewStatus: "draft" | "reviewed" | "superseded";
  evidenceGrade: EvidenceGrade;
  evidenceRelationship?:
    "primary" | "supporting" | "conflicting" | "secondary" | "discovery" | "cross_check";
  isDemo?: boolean;
}

export interface DataSourcePolicyRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceDomain: string;
  sourceAccessClass: SourceAccessClass;
  accessMethod: SourceAccessMethod;
  licenceName: string;
  licenceUrl?: string;
  attributionRequired: boolean;
  shareAlikeRequired: boolean;
  commercialUseStatus: CommercialUseStatus;
  derivativeDatabaseRequirement?: string;
  imageReuseStatus: CommercialUseStatus;
  textReuseStatus: CommercialUseStatus;
  automatedAccessAllowed: boolean;
  robotsReviewedAt?: string;
  termsReviewedAt?: string;
  legalReviewStatus: LegalReviewStatus;
  approvedFieldsJson: string[];
  prohibitedFieldsJson: string[];
  requiredAttributionText?: string;
  importerEnabled: boolean;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ProductIngredientRecord {
  position: number;
  rawLabelToken: string;
  normalisedToken?: string;
  ingredientSlug?: string;
  matchStatus: "confirmed" | "uncertain" | "unresolved";
  rawMatchStatus?: string;
  matchMethod?: string;
  matchConfidence: number;
  sourceId?: string;
  notes?: string;
}

export interface ProductVersionRecord {
  id: string;
  versionLabel: string;
  marketCode: string;
  barcode?: string;
  category: string;
  productForm: ProductForm;
  usageType: UsageType;
  bodyArea: string[];
  targetUserGroup: string;
  labelObservedAt: string;
  lastIndependentVerificationAt?: string;
  brandConfirmedAt?: string;
  conflictingNewerSubmissionCount?: number;
  marketSpecificEvidenceCount?: number;
  formulaHash: string;
  verificationStatus: VerificationStatus;
  publicationStatus: "draft" | "published" | "review_required" | "published_with_source_warning";
  submittedAt?: string;
  evidenceConfidence: EvidenceGrade;
  dataCompleteness: number;
  concernDimensionValues: Partial<Record<ConcernDimension, number>>;
  ingredients: ProductIngredientRecord[];
  sourceIds: string[];
  sourceWarningZh?: string;
  sourceUrl?: string;
  sourceAccessedAt?: string;
  packagePhotoVerified?: boolean;
  rawVerificationStatus?: string;
  sourcePublisher?: string;
}

export interface ProductRecord {
  id: string;
  slug: string;
  brand: string;
  brandSlug: string;
  preferredName: string;
  descriptionZhHant: string;
  versions: ProductVersionRecord[];
}

export interface EvidenceSummaryRecord {
  id: string;
  ingredientSlug: string;
  dimension: ConcernDimension;
  summaryZhHant: string;
  evidenceGrade: EvidenceGrade;
  dataCompleteness: number;
  sourceIds: string[];
  endpoint?: string;
  conclusionCode?: string;
  contextLabelZh?: string;
  concentration?: string;
  usageType?: string;
  productForm?: string;
  route?: string;
  population?: string;
  limitationsZhHant?: string;
  claimStatus?: string;
  exactLocator?: string;
  sourceVersion?: string;
  publicationDate?: string;
}

export interface CoverageMatrixRecord {
  ingredient_id: string;
  canonical_inci: string;
  Reviewed_Count?: string;
  Pending_Count?: string;
  notes?: string;
  [sourceKey: string]: string | undefined;
}

export interface ReviewIssueRecord {
  id: string;
  priority: string;
  entityType: string;
  entityId: string;
  issueCategory: string;
  issueZh: string;
  impactZh: string;
  recommendedActionZh: string;
  sourceOrContext?: string;
  status: string;
}

export const productionIngredientRecords: IngredientRecord[] =
  seedIngredientRecords as unknown as IngredientRecord[];

export const productionSourceRecords: SourceRecord[] =
  seedSourceRecords as unknown as SourceRecord[];

export const productionProductRecords: ProductRecord[] =
  seedProductRecords as unknown as ProductRecord[];

export const productionEvidenceSummaries: EvidenceSummaryRecord[] =
  seedEvidenceSummaries as unknown as EvidenceSummaryRecord[];

export const productionCoverageRecords: CoverageMatrixRecord[] =
  seedCoverageRecords as unknown as CoverageMatrixRecord[];

export const productionReviewIssueRecords: ReviewIssueRecord[] =
  seedReviewIssueRecords as unknown as ReviewIssueRecord[];

export const dataSourcePolicyRecords: DataSourcePolicyRecord[] = [
  {
    id: "policy-open-beauty-facts",
    sourceId: "open-beauty-facts",
    sourceName: "Open Beauty Facts",
    sourceDomain: "world.openbeautyfacts.org",
    sourceAccessClass: "open_structured_source",
    accessMethod: "API",
    licenceName: "Open Database Licence (ODbL) - legal review required before public import",
    licenceUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
    attributionRequired: true,
    shareAlikeRequired: true,
    commercialUseStatus: "unknown",
    derivativeDatabaseRequirement:
      "Potential adapted-database obligations must be reviewed before production publication.",
    imageReuseStatus: "unknown",
    textReuseStatus: "unknown",
    automatedAccessAllowed: true,
    legalReviewStatus: "provisional",
    approvedFieldsJson: [
      "id",
      "external_id",
      "code",
      "brands",
      "product_name",
      "categories",
      "countries",
      "ingredients_text",
      "image_ingredients_url",
      "url",
      "last_modified_t",
    ],
    prohibitedFieldsJson: ["proprietary_scores", "unreviewed_scientific_claims"],
    requiredAttributionText:
      "Product data imported from Open Beauty Facts. Licence review required before production publication.",
    importerEnabled: true,
    reviewNotes: "Bounded staging import only; imported records require review before publication.",
  },
  {
    id: "policy-pubchem",
    sourceId: "pubchem",
    sourceName: "PubChem",
    sourceDomain: "pubchem.ncbi.nlm.nih.gov",
    sourceAccessClass: "open_structured_source",
    accessMethod: "API",
    licenceName: "Public domain / NCBI source attribution review required",
    licenceUrl: "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest",
    attributionRequired: true,
    shareAlikeRequired: false,
    commercialUseStatus: "unknown",
    imageReuseStatus: "prohibited",
    textReuseStatus: "unknown",
    automatedAccessAllowed: true,
    legalReviewStatus: "provisional",
    approvedFieldsJson: [
      "cid",
      "iupac_name",
      "molecular_formula",
      "molecular_weight",
      "canonical_smiles",
      "isomeric_smiles",
      "inchi",
      "inchikey",
      "synonyms",
    ],
    prohibitedFieldsJson: ["consumer_risk_claims_without_source_review"],
    requiredAttributionText:
      "Chemical identity data retrieved from PubChem. Consumer-facing claims require review of underlying evidence.",
    importerEnabled: true,
    reviewNotes: "Identity enrichment only; fuzzy matches and mixtures require manual review.",
  },
  {
    id: "policy-epa-comptox",
    sourceId: "epa-comptox",
    sourceName: "EPA CompTox Chemicals Dashboard",
    sourceDomain: "comptox.epa.gov",
    sourceAccessClass: "open_structured_source",
    accessMethod: "API",
    licenceName: "US EPA public data - legal review required",
    licenceUrl: "https://www.epa.gov/comptox-tools/comptox-chemicals-dashboard",
    attributionRequired: true,
    shareAlikeRequired: false,
    commercialUseStatus: "unknown",
    imageReuseStatus: "prohibited",
    textReuseStatus: "unknown",
    automatedAccessAllowed: true,
    legalReviewStatus: "provisional",
    approvedFieldsJson: ["dtxsid", "casrn", "chemical_name", "inchi_key", "endpoint_records"],
    prohibitedFieldsJson: ["automatic_active_evidence_claims", "collapsed_generic_toxicity_values"],
    importerEnabled: false,
    reviewNotes: "Stage-only until endpoint classification and legal review are complete.",
  },
  {
    id: "policy-ewg-skin-deep",
    sourceId: "ewg-skin-deep",
    sourceName: "EWG Skin Deep",
    sourceDomain: "ewg.org",
    sourceAccessClass: "secondary_or_discovery_source",
    accessMethod: "reviewer_research",
    licenceName: "reference_only_no_import",
    attributionRequired: true,
    shareAlikeRequired: false,
    commercialUseStatus: "prohibited",
    imageReuseStatus: "prohibited",
    textReuseStatus: "prohibited",
    automatedAccessAllowed: false,
    legalReviewStatus: "rejected",
    approvedFieldsJson: ["source_url", "access_date", "reviewer_note", "underlying_source_links"],
    prohibitedFieldsJson: [
      "scores",
      "ratings",
      "descriptions",
      "product_catalogue",
      "certification_marks",
      "images",
    ],
    importerEnabled: false,
    reviewNotes:
      "Discovery/reference only. Do not reproduce Skin Deep scores or proprietary content.",
  },
  {
    id: "policy-cosdna",
    sourceId: "cosdna",
    sourceName: "CosDNA",
    sourceDomain: "cosdna.com",
    sourceAccessClass: "secondary_or_discovery_source",
    accessMethod: "reviewer_research",
    licenceName: "reference_only_no_import",
    attributionRequired: true,
    shareAlikeRequired: false,
    commercialUseStatus: "unknown",
    imageReuseStatus: "prohibited",
    textReuseStatus: "prohibited",
    automatedAccessAllowed: false,
    legalReviewStatus: "not_reviewed",
    approvedFieldsJson: ["source_url", "access_date", "reviewer_note", "underlying_source_links"],
    prohibitedFieldsJson: ["scores", "ratings", "descriptions", "product_catalogue", "images"],
    importerEnabled: false,
    reviewNotes:
      "Reuse permission unknown unless written permission or a documented licence is obtained.",
  },
];

export const findIngredientBySlug = (slug: string): IngredientRecord | undefined =>
  productionIngredientRecords.find((ingredient) => ingredient.slug === slug);

export const findProductBySlug = (slug: string): ProductRecord | undefined =>
  productionProductRecords.find((product) => product.slug === slug);

export const findSourceById = (id: string): SourceRecord | undefined =>
  productionSourceRecords.find((source) => source.id === id);
