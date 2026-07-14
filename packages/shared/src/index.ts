export const appConfig = {
  productName: process.env["APP_NAME"] ?? "成分透視",
  productEnglishName: process.env["APP_ENGLISH_NAME"] ?? "Cosmetic Ingredient Lens",
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
  | "unknown";

export type UsageType = "leave_on" | "rinse_off" | "mixed" | "unknown";

export type ProductForm =
  "cream" | "liquid" | "gel" | "powder" | "spray" | "aerosol" | "stick" | "unknown";

export type VerificationStatus = "pending_review" | "reviewed" | "needs_correction" | "rejected";

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
    | "secondary_website"
    | "discovery_source"
    | "community_submission";
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

export interface ProductIngredientRecord {
  position: number;
  rawLabelToken: string;
  ingredientSlug?: string;
  matchStatus: "confirmed" | "uncertain" | "unresolved";
  matchConfidence: number;
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
  publicationStatus: "draft" | "published";
  submittedAt?: string;
  evidenceConfidence: EvidenceGrade;
  dataCompleteness: number;
  concernDimensionValues: Partial<Record<ConcernDimension, number>>;
  ingredients: ProductIngredientRecord[];
  sourceIds: string[];
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

export interface DemoEvidenceSummary {
  id: string;
  ingredientSlug: string;
  dimension: ConcernDimension;
  summaryZhHant: string;
  evidenceGrade: EvidenceGrade;
  dataCompleteness: number;
  sourceIds: string[];
  isDemo: true;
}

const aliases = (
  entries: Array<[string, string, string | undefined, IngredientAlias["nameType"], boolean]>,
): IngredientAlias[] =>
  entries.map(([name, languageCode, regionCode, nameType, reviewed]) => ({
    name,
    languageCode,
    ...(regionCode ? { regionCode } : {}),
    nameType,
    reviewed,
  }));

export const ingredientFixtures: IngredientRecord[] = [
  {
    id: "ing-aqua",
    slug: "aqua",
    canonicalInciName: "AQUA",
    preferredEnglishName: "Water",
    preferredZhHantHkName: "水",
    ingredientType: "defined_chemical",
    functions: ["溶劑"],
    identifiers: [{ kind: "CAS", value: "7732-18-5" }],
    aliases: aliases([
      ["Aqua", "en", undefined, "inci", true],
      ["Water", "en", undefined, "common", true],
      ["Eau", "fr", undefined, "label_alias", true],
      ["水", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "常見溶劑。此開發資料只包含身份資料，不包含安全結論。",
    reviewStatus: "reviewed",
    lastReviewedAt: "2026-07-13",
  },
  {
    id: "ing-glycerin",
    slug: "glycerin",
    canonicalInciName: "GLYCERIN",
    preferredEnglishName: "Glycerin",
    preferredZhHantHkName: "甘油",
    ingredientType: "defined_chemical",
    functions: ["保濕劑", "溶劑"],
    identifiers: [{ kind: "CAS", value: "56-81-5" }],
    aliases: aliases([
      ["Glycerin", "en", undefined, "inci", true],
      ["Glycerol", "en", undefined, "common", true],
      ["甘油", "zh-Hant", "HK", "preferred", true],
      ["丙三醇", "zh-Hant", "TW", "common", true],
    ]),
    descriptionZhHant: "常見保濕成分。資料庫以 INCI 及內部 UUID 辨識，並保留中文別名。",
    reviewStatus: "reviewed",
    lastReviewedAt: "2026-07-13",
  },
  {
    id: "ing-butylene-glycol",
    slug: "butylene-glycol",
    canonicalInciName: "BUTYLENE GLYCOL",
    preferredEnglishName: "Butylene Glycol",
    preferredZhHantHkName: "丁二醇",
    ingredientType: "defined_chemical",
    functions: ["保濕劑", "溶劑"],
    identifiers: [{ kind: "CAS", value: "107-88-0" }],
    aliases: aliases([
      ["Butylene Glycol", "en", undefined, "inci", true],
      ["1,3-Butanediol", "en", undefined, "scientific", true],
      ["丁二醇", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "常見溶劑及保濕成分。此記錄未包含濃度或毒理結論。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-niacinamide",
    slug: "niacinamide",
    canonicalInciName: "NIACINAMIDE",
    preferredEnglishName: "Niacinamide",
    preferredZhHantHkName: "煙酰胺",
    ingredientType: "defined_chemical",
    functions: ["皮膚調理劑"],
    identifiers: [{ kind: "CAS", value: "98-92-0" }],
    aliases: aliases([
      ["Niacinamide", "en", undefined, "inci", true],
      ["Nicotinamide", "en", undefined, "scientific", true],
      ["煙酰胺", "zh-Hant", "HK", "preferred", true],
      ["菸鹼醯胺", "zh-Hant", "TW", "common", true],
    ]),
    descriptionZhHant: "常見皮膚調理成分。功效及關注需依來源和條件分開記錄。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-sodium-hyaluronate",
    slug: "sodium-hyaluronate",
    canonicalInciName: "SODIUM HYALURONATE",
    preferredEnglishName: "Sodium Hyaluronate",
    preferredZhHantHkName: "透明質酸鈉",
    ingredientType: "polymer",
    functions: ["保濕劑", "皮膚調理劑"],
    identifiers: [],
    aliases: aliases([
      ["Sodium Hyaluronate", "en", undefined, "inci", true],
      ["Hyaluronic Acid Sodium Salt", "en", undefined, "common", true],
      ["透明質酸鈉", "zh-Hant", "HK", "preferred", true],
      ["玻尿酸鈉", "zh-Hant", "TW", "common", true],
    ]),
    descriptionZhHant: "高分子保濕成分。不同分子量資料不可自動合併。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-phenoxyethanol",
    slug: "phenoxyethanol",
    canonicalInciName: "PHENOXYETHANOL",
    preferredEnglishName: "Phenoxyethanol",
    preferredZhHantHkName: "苯氧乙醇",
    ingredientType: "defined_chemical",
    functions: ["防腐劑"],
    identifiers: [{ kind: "CAS", value: "122-99-6" }],
    aliases: aliases([
      ["Phenoxyethanol", "en", undefined, "inci", true],
      ["2-Phenoxyethanol", "en", undefined, "scientific", true],
      ["苯氧乙醇", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "防腐相關成分。任何濃度限制或法規狀態必須由來源記錄支援。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-tocopherol",
    slug: "tocopherol",
    canonicalInciName: "TOCOPHEROL",
    preferredEnglishName: "Tocopherol",
    preferredZhHantHkName: "生育酚",
    ingredientType: "defined_chemical",
    functions: ["抗氧化劑"],
    identifiers: [],
    aliases: aliases([
      ["Tocopherol", "en", undefined, "inci", true],
      ["Vitamin E", "en", undefined, "common", true],
      ["生育酚", "zh-Hant", "HK", "preferred", true],
      ["維他命E", "zh-Hant", "HK", "common", true],
    ]),
    descriptionZhHant: "抗氧化相關成分。天然來源不等同較低潛在關注。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-parfum",
    slug: "parfum",
    canonicalInciName: "PARFUM",
    preferredEnglishName: "Fragrance",
    preferredZhHantHkName: "香精",
    ingredientType: "fragrance_mixture",
    functions: ["香料"],
    identifiers: [],
    aliases: aliases([
      ["Parfum", "en", undefined, "inci", true],
      ["Fragrance", "en", undefined, "common", true],
      ["香精", "zh-Hant", "HK", "preferred", true],
      ["香料", "zh-Hant", "HK", "common", true],
    ]),
    descriptionZhHant: "香精通常是混合物，不能假設等同單一化學物質。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-citric-acid",
    slug: "citric-acid",
    canonicalInciName: "CITRIC ACID",
    preferredEnglishName: "Citric Acid",
    preferredZhHantHkName: "檸檬酸",
    ingredientType: "defined_chemical",
    functions: ["pH調節劑"],
    identifiers: [{ kind: "CAS", value: "77-92-9" }],
    aliases: aliases([
      ["Citric Acid", "en", undefined, "inci", true],
      ["檸檬酸", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "常用 pH 調節成分。實際關注需按濃度及產品條件判斷。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-sodium-chloride",
    slug: "sodium-chloride",
    canonicalInciName: "SODIUM CHLORIDE",
    preferredEnglishName: "Sodium Chloride",
    preferredZhHantHkName: "氯化鈉",
    ingredientType: "defined_chemical",
    functions: ["黏度調節劑"],
    identifiers: [{ kind: "CAS", value: "7647-14-5" }],
    aliases: aliases([
      ["Sodium Chloride", "en", undefined, "inci", true],
      ["Salt", "en", undefined, "common", true],
      ["氯化鈉", "zh-Hant", "HK", "preferred", true],
      ["食鹽", "zh-Hant", "HK", "common", true],
    ]),
    descriptionZhHant: "常見黏度或配方調節成分。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-panthenol",
    slug: "panthenol",
    canonicalInciName: "PANTHENOL",
    preferredEnglishName: "Panthenol",
    preferredZhHantHkName: "泛醇",
    ingredientType: "defined_chemical",
    functions: ["保濕劑", "皮膚調理劑"],
    identifiers: [{ kind: "CAS", value: "16485-10-2" }],
    aliases: aliases([
      ["Panthenol", "en", undefined, "inci", true],
      ["Provitamin B5", "en", undefined, "common", true],
      ["泛醇", "zh-Hant", "HK", "preferred", true],
      ["維他命原B5", "zh-Hant", "HK", "common", true],
    ]),
    descriptionZhHant: "常見保濕及皮膚調理成分。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-dimethicone",
    slug: "dimethicone",
    canonicalInciName: "DIMETHICONE",
    preferredEnglishName: "Dimethicone",
    preferredZhHantHkName: "聚二甲基矽氧烷",
    ingredientType: "polymer",
    functions: ["潤膚劑", "皮膚保護劑"],
    identifiers: [],
    aliases: aliases([
      ["Dimethicone", "en", undefined, "inci", true],
      ["Polydimethylsiloxane", "en", undefined, "scientific", true],
      ["聚二甲基矽氧烷", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "矽氧烷聚合物。聚合物資料需與單體或相關物質分開處理。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-cetearyl-alcohol",
    slug: "cetearyl-alcohol",
    canonicalInciName: "CETEARYL ALCOHOL",
    preferredEnglishName: "Cetearyl Alcohol",
    preferredZhHantHkName: "鯨蠟硬脂醇",
    ingredientType: "mixture",
    functions: ["乳化穩定劑", "潤膚劑"],
    identifiers: [],
    aliases: aliases([
      ["Cetearyl Alcohol", "en", undefined, "inci", true],
      ["Cetostearyl Alcohol", "en", undefined, "common", true],
      ["鯨蠟硬脂醇", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "脂肪醇混合物，不應等同於單一 CAS 物質。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-caprylic-capric-triglyceride",
    slug: "caprylic-capric-triglyceride",
    canonicalInciName: "CAPRYLIC/CAPRIC TRIGLYCERIDE",
    preferredEnglishName: "Caprylic/Capric Triglyceride",
    preferredZhHantHkName: "辛酸／癸酸甘油三酯",
    ingredientType: "mixture",
    functions: ["潤膚劑", "溶劑"],
    identifiers: [],
    aliases: aliases([
      ["Caprylic/Capric Triglyceride", "en", undefined, "inci", true],
      ["辛酸/癸酸甘油三酯", "zh-Hant", "HK", "label_alias", true],
      ["辛酸／癸酸甘油三酯", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "常見潤膚混合物。斜線屬名稱一部分，解析時需保留。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-carbomer",
    slug: "carbomer",
    canonicalInciName: "CARBOMER",
    preferredEnglishName: "Carbomer",
    preferredZhHantHkName: "卡波姆",
    ingredientType: "polymer",
    functions: ["增稠劑", "凝膠形成劑"],
    identifiers: [],
    aliases: aliases([
      ["Carbomer", "en", undefined, "inci", true],
      ["卡波姆", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "聚合物增稠成分。不同級別或交聯程度可能需要額外資料。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-titanium-dioxide",
    slug: "titanium-dioxide",
    canonicalInciName: "TITANIUM DIOXIDE",
    preferredEnglishName: "Titanium Dioxide",
    preferredZhHantHkName: "二氧化鈦",
    ingredientType: "mineral",
    functions: ["著色劑", "紫外線吸收／散射劑"],
    identifiers: [
      { kind: "CAS", value: "13463-67-7" },
      { kind: "CI", value: "CI 77891" },
    ],
    aliases: aliases([
      ["Titanium Dioxide", "en", undefined, "inci", true],
      ["CI 77891", "en", undefined, "label_alias", true],
      ["CI77891", "en", undefined, "label_alias", true],
      ["二氧化鈦", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "礦物成分。[nano]、吸入暴露及產品形態需分開記錄。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-iron-oxides",
    slug: "iron-oxides",
    canonicalInciName: "IRON OXIDES",
    preferredEnglishName: "Iron Oxides",
    preferredZhHantHkName: "氧化鐵",
    ingredientType: "colourant",
    functions: ["著色劑"],
    identifiers: [{ kind: "CI", value: "CI 77491" }],
    aliases: aliases([
      ["Iron Oxides", "en", undefined, "inci", true],
      ["CI 77491", "en", undefined, "label_alias", true],
      ["CI77491", "en", undefined, "label_alias", true],
      ["氧化鐵", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "著色劑群組。不同 CI 編號可代表不同氧化鐵顏色。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-salicylic-acid",
    slug: "salicylic-acid",
    canonicalInciName: "SALICYLIC ACID",
    preferredEnglishName: "Salicylic Acid",
    preferredZhHantHkName: "水楊酸",
    ingredientType: "defined_chemical",
    functions: ["角質調理劑"],
    identifiers: [{ kind: "CAS", value: "69-72-7" }],
    aliases: aliases([
      ["Salicylic Acid", "en", undefined, "inci", true],
      ["水楊酸", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "角質調理相關成分。任何適用條件或法規提示需有來源。",
    reviewStatus: "reviewed",
  },
  {
    id: "ing-ethylhexylglycerin",
    slug: "ethylhexylglycerin",
    canonicalInciName: "ETHYLHEXYLGLYCERIN",
    preferredEnglishName: "Ethylhexylglycerin",
    preferredZhHantHkName: "乙基己基甘油",
    ingredientType: "defined_chemical",
    functions: ["皮膚調理劑", "防腐助劑"],
    identifiers: [{ kind: "CAS", value: "70445-33-9" }],
    aliases: aliases([
      ["Ethylhexylglycerin", "en", undefined, "inci", true],
      ["乙基己基甘油", "zh-Hant", "HK", "preferred", true],
    ]),
    descriptionZhHant: "常見配方輔助成分。此記錄只作身份示範。",
    reviewStatus: "reviewed",
  },
];

export const sourceFixtures: SourceRecord[] = [
  {
    id: "src-demo-label-hk-001",
    publisher: "成分透視開發資料",
    title: "霧泉保濕精華標籤觀察（虛構產品）",
    sourceType: "package_label",
    jurisdiction: "HK",
    exactLocator: "開發種子資料",
    accessedAt: "2026-07-13",
    languageCode: "zh-Hant-HK",
    licenceStatus: "not_applicable",
    commercialReuseStatus: "not_applicable",
    reviewStatus: "reviewed",
    evidenceGrade: "U",
    evidenceRelationship: "primary",
    isDemo: true,
  },
  {
    id: "src-demo-label-hk-002",
    publisher: "成分透視開發資料",
    title: "青柚潔面凝露標籤觀察（虛構產品）",
    sourceType: "package_label",
    jurisdiction: "HK",
    exactLocator: "開發種子資料",
    accessedAt: "2026-07-13",
    languageCode: "zh-Hant-HK",
    licenceStatus: "not_applicable",
    commercialReuseStatus: "not_applicable",
    reviewStatus: "reviewed",
    evidenceGrade: "U",
    evidenceRelationship: "primary",
    isDemo: true,
  },
  {
    id: "src-registry-placeholder-cosing",
    publisher: "European Commission",
    title: "CosIng source registry placeholder",
    sourceType: "professional_database",
    jurisdiction: "EU",
    externalUrl: "https://ec.europa.eu/growth/tools-databases/cosing/",
    accessedAt: "2026-07-13",
    languageCode: "en",
    licenceStatus: "unknown",
    commercialReuseStatus: "unknown",
    reviewStatus: "draft",
    evidenceGrade: "U",
    evidenceRelationship: "discovery",
  },
  {
    id: "src-discovery-ewg-skin-deep",
    publisher: "Environmental Working Group",
    title: "EWG Skin Deep cosmetics database benchmark record",
    sourceType: "secondary_website",
    jurisdiction: "US",
    version: "Public website accessed for IA benchmark",
    externalUrl: "https://www.ewg.org/skindeep/",
    exactLocator: "Public category/search and methodology pages",
    accessedAt: "2026-07-13",
    languageCode: "en",
    licenceStatus: "restricted",
    commercialReuseStatus: "restricted",
    reviewStatus: "draft",
    evidenceGrade: "U",
    evidenceRelationship: "discovery",
  },
  {
    id: "src-discovery-cosdna",
    publisher: "CosDNA",
    title: "CosDNA cosmetics ingredient database benchmark record",
    sourceType: "secondary_website",
    version: "Public website accessed for IA benchmark",
    externalUrl: "https://www.cosdna.com/",
    exactLocator: "Public product and ingredient search pages",
    accessedAt: "2026-07-13",
    languageCode: "en",
    licenceStatus: "unknown",
    commercialReuseStatus: "unknown",
    reviewStatus: "draft",
    evidenceGrade: "U",
    evidenceRelationship: "cross_check",
  },
];

export const productFixtures: ProductRecord[] = [
  {
    id: "prod-mist-spring-serum",
    slug: "mist-spring-hydrating-serum",
    brand: "澄研室",
    brandSlug: "clear-lab-fictional",
    preferredName: "霧泉保濕精華",
    descriptionZhHant: "虛構產品，用於示範不同配方版本和來源追蹤。",
    versions: [
      {
        id: "pv-mist-spring-2026-hk-a",
        versionLabel: "香港版 2026-03",
        marketCode: "HK",
        barcode: "4890000000012",
        category: "面部精華",
        productForm: "liquid",
        usageType: "leave_on",
        bodyArea: ["面部"],
        targetUserGroup: "成人",
        labelObservedAt: "2026-03-18",
        lastIndependentVerificationAt: "2026-04-02",
        brandConfirmedAt: "2026-03-25",
        conflictingNewerSubmissionCount: 1,
        marketSpecificEvidenceCount: 2,
        formulaHash: "sha256:7de92dc5bc71b2d0a20e9f86d0136d1fddf816c67f6f5b04cfd7e7307d8b3f9a",
        verificationStatus: "reviewed",
        publicationStatus: "published",
        submittedAt: "2026-03-19",
        evidenceConfidence: "U",
        dataCompleteness: 0.42,
        concernDimensionValues: {
          skin_eye: 1.2,
          sensitisation: 1.6,
          systemic_health: 0.8,
          inhalation: 0.2,
          environment: 0.7,
          regulatory_market: 0.4,
        },
        sourceIds: ["src-demo-label-hk-001"],
        ingredients: [
          {
            position: 1,
            rawLabelToken: "Aqua",
            ingredientSlug: "aqua",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 2,
            rawLabelToken: "Glycerin",
            ingredientSlug: "glycerin",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 3,
            rawLabelToken: "Butylene Glycol",
            ingredientSlug: "butylene-glycol",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 4,
            rawLabelToken: "Niacinamide",
            ingredientSlug: "niacinamide",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 5,
            rawLabelToken: "Sodium Hyaluronate",
            ingredientSlug: "sodium-hyaluronate",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 6,
            rawLabelToken: "Phenoxyethanol",
            ingredientSlug: "phenoxyethanol",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 7,
            rawLabelToken: "Citric Acid",
            ingredientSlug: "citric-acid",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
        ],
      },
      {
        id: "pv-mist-spring-2026-hk-b",
        versionLabel: "香港版 2026-06",
        marketCode: "HK",
        barcode: "4890000000012",
        category: "面部精華",
        productForm: "liquid",
        usageType: "leave_on",
        bodyArea: ["面部"],
        targetUserGroup: "成人",
        labelObservedAt: "2026-06-28",
        lastIndependentVerificationAt: "2026-07-05",
        conflictingNewerSubmissionCount: 0,
        marketSpecificEvidenceCount: 1,
        formulaHash: "sha256:8a4e41ad72c70e7f1c8c2d947a64084aaf0b91755ac46d85a907d7c289a3fc42",
        verificationStatus: "pending_review",
        publicationStatus: "draft",
        submittedAt: "2026-06-29",
        evidenceConfidence: "U",
        dataCompleteness: 0.3,
        concernDimensionValues: {
          skin_eye: 1.1,
          sensitisation: 1.7,
          systemic_health: 0.8,
          inhalation: 0.2,
          environment: 0.9,
          regulatory_market: 0.4,
        },
        sourceIds: ["src-demo-label-hk-001"],
        ingredients: [
          {
            position: 1,
            rawLabelToken: "Aqua",
            ingredientSlug: "aqua",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 2,
            rawLabelToken: "Glycerin",
            ingredientSlug: "glycerin",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 3,
            rawLabelToken: "Butylene Glycol",
            ingredientSlug: "butylene-glycol",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 4,
            rawLabelToken: "Panthenol",
            ingredientSlug: "panthenol",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 5,
            rawLabelToken: "Niacinamide",
            ingredientSlug: "niacinamide",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 6,
            rawLabelToken: "Sodium Hyaluronate",
            ingredientSlug: "sodium-hyaluronate",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 7,
            rawLabelToken: "Phenoxyethanol",
            ingredientSlug: "phenoxyethanol",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 8,
            rawLabelToken: "Ethylhexylglycerin",
            ingredientSlug: "ethylhexylglycerin",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
        ],
      },
      {
        id: "pv-mist-spring-2021-hk",
        versionLabel: "香港版 2021-09（歷史配方）",
        marketCode: "HK",
        barcode: "4890000000012",
        category: "面部精華",
        productForm: "liquid",
        usageType: "leave_on",
        bodyArea: ["面部"],
        targetUserGroup: "成人",
        labelObservedAt: "2021-09-14",
        lastIndependentVerificationAt: "2021-10-02",
        conflictingNewerSubmissionCount: 2,
        marketSpecificEvidenceCount: 1,
        formulaHash: "sha256:14a734e6ef62ec7d92a6e632fda4d4ed6acbe1dbfa0ed41dd9d4a23efa245505",
        verificationStatus: "reviewed",
        publicationStatus: "published",
        submittedAt: "2021-09-15",
        evidenceConfidence: "U",
        dataCompleteness: 0.22,
        concernDimensionValues: {
          skin_eye: 1.4,
          sensitisation: 2.2,
          systemic_health: 1.0,
          inhalation: 0.2,
          environment: 0.8,
          regulatory_market: 0.5,
        },
        sourceIds: ["src-demo-label-hk-001"],
        ingredients: [
          {
            position: 1,
            rawLabelToken: "Aqua",
            ingredientSlug: "aqua",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 2,
            rawLabelToken: "Glycerin",
            ingredientSlug: "glycerin",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 3,
            rawLabelToken: "Butylene Glycol",
            ingredientSlug: "butylene-glycol",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 4,
            rawLabelToken: "Parfum",
            ingredientSlug: "parfum",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 5,
            rawLabelToken: "Phenoxyethanol",
            ingredientSlug: "phenoxyethanol",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
        ],
      },
    ],
  },
  {
    id: "prod-green-pomelo-cleanser",
    slug: "green-pomelo-cleansing-gel",
    brand: "禾光",
    brandSlug: "grainlight-fictional",
    preferredName: "青柚潔面凝露",
    descriptionZhHant: "虛構潔面產品，用於示範沖洗型產品情境。",
    versions: [
      {
        id: "pv-green-pomelo-2026-hk",
        versionLabel: "香港版 2026-04",
        marketCode: "HK",
        category: "潔面產品",
        productForm: "gel",
        usageType: "rinse_off",
        bodyArea: ["面部"],
        targetUserGroup: "成人",
        labelObservedAt: "2026-04-04",
        lastIndependentVerificationAt: "2026-04-20",
        conflictingNewerSubmissionCount: 0,
        marketSpecificEvidenceCount: 1,
        formulaHash: "sha256:6a2c851f3e9ccbd5b3dc4f935ba7d09956f96f90e5fb863da55b95c081be67c7",
        verificationStatus: "reviewed",
        publicationStatus: "published",
        submittedAt: "2026-04-05",
        evidenceConfidence: "U",
        dataCompleteness: 0.36,
        concernDimensionValues: {
          skin_eye: 1.0,
          sensitisation: 1.5,
          systemic_health: 0.6,
          inhalation: 0.2,
          environment: 0.5,
          regulatory_market: 0.3,
        },
        sourceIds: ["src-demo-label-hk-002"],
        ingredients: [
          {
            position: 1,
            rawLabelToken: "Aqua",
            ingredientSlug: "aqua",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 2,
            rawLabelToken: "Glycerin",
            ingredientSlug: "glycerin",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 3,
            rawLabelToken: "Sodium Chloride",
            ingredientSlug: "sodium-chloride",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 4,
            rawLabelToken: "Citric Acid",
            ingredientSlug: "citric-acid",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 5,
            rawLabelToken: "Parfum",
            ingredientSlug: "parfum",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
        ],
      },
    ],
  },
  {
    id: "prod-softlight-sunscreen",
    slug: "softlight-sunscreen-milk",
    brand: "璃日研究",
    brandSlug: "sunlit-lab-fictional",
    preferredName: "柔光防曬乳",
    descriptionZhHant: "虛構防曬產品，用於示範色料、礦物及 [nano] 等待審核標記。",
    versions: [
      {
        id: "pv-softlight-2026-hk",
        versionLabel: "香港版 2026-05",
        marketCode: "HK",
        barcode: "4890000000999",
        category: "防曬產品",
        productForm: "cream",
        usageType: "leave_on",
        bodyArea: ["面部", "頸部"],
        targetUserGroup: "成人",
        labelObservedAt: "2026-05-12",
        lastIndependentVerificationAt: "2026-05-25",
        conflictingNewerSubmissionCount: 0,
        marketSpecificEvidenceCount: 1,
        formulaHash: "sha256:4a06d19d2f3ae6155775d0c3b3ee3a61e3139d42aa4f65daff51831acfa87891",
        verificationStatus: "reviewed",
        publicationStatus: "published",
        submittedAt: "2026-05-13",
        evidenceConfidence: "U",
        dataCompleteness: 0.34,
        concernDimensionValues: {
          skin_eye: 1.5,
          sensitisation: 1.1,
          systemic_health: 0.7,
          inhalation: 1.9,
          environment: 1.0,
          regulatory_market: 0.8,
        },
        sourceIds: ["src-demo-label-hk-001"],
        ingredients: [
          {
            position: 1,
            rawLabelToken: "Aqua",
            ingredientSlug: "aqua",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 2,
            rawLabelToken: "Caprylic/Capric Triglyceride",
            ingredientSlug: "caprylic-capric-triglyceride",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 3,
            rawLabelToken: "Dimethicone",
            ingredientSlug: "dimethicone",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 4,
            rawLabelToken: "Titanium Dioxide [nano]",
            ingredientSlug: "titanium-dioxide",
            matchStatus: "uncertain",
            matchConfidence: 0.82,
          },
          {
            position: 5,
            rawLabelToken: "Tocopherol",
            ingredientSlug: "tocopherol",
            matchStatus: "confirmed",
            matchConfidence: 1,
          },
          {
            position: 6,
            rawLabelToken: "May contain: CI77491",
            ingredientSlug: "iron-oxides",
            matchStatus: "uncertain",
            matchConfidence: 0.86,
          },
        ],
      },
    ],
  },
];

export const demoEvidenceFixtures: DemoEvidenceSummary[] = [
  {
    id: "demo-unknown-glycerin-skin",
    ingredientSlug: "glycerin",
    dimension: "skin_eye",
    summaryZhHant: "開發示範資料：此項不代表真實安全或功效結論；正式資料需要來源審核。",
    evidenceGrade: "U",
    dataCompleteness: 0.1,
    sourceIds: ["src-demo-label-hk-001"],
    isDemo: true,
  },
];

export const findIngredientBySlug = (slug: string): IngredientRecord | undefined =>
  ingredientFixtures.find((ingredient) => ingredient.slug === slug);

export const findProductBySlug = (slug: string): ProductRecord | undefined =>
  productFixtures.find((product) => product.slug === slug);

export const findSourceById = (id: string): SourceRecord | undefined =>
  sourceFixtures.find((source) => source.id === id);
