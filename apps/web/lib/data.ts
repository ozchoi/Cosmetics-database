import {
  concernDimensionLabels,
  demoEvidenceFixtures,
  findIngredientBySlug,
  findProductBySlug,
  findSourceById,
  ingredientFixtures,
  productFixtures,
  sourceFixtures,
  appConfig,
  type ConcernDimension,
  type IngredientRecord,
  type ProductRecord,
  type ProductVersionRecord,
} from "@cosmetic-lens/shared";
import { normalizeName } from "@cosmetic-lens/ingredient-parser";
import { calculateProductRatings, type RatingDimensionResult } from "@cosmetic-lens/scoring";

export interface SearchResult<T> {
  item: T;
  rank: number;
  matchLabel: string;
  matchType: "exact" | "prefix" | "fuzzy";
}

const levenshtein = (left: string, right: string): number => {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array<number>(right.length + 1).fill(0),
  );
  for (let row = 0; row <= left.length; row += 1) matrix[row]![0] = row;
  for (let col = 0; col <= right.length; col += 1) matrix[0]![col] = col;
  for (let row = 1; row <= left.length; row += 1) {
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row]![col] = Math.min(
        matrix[row - 1]![col]! + 1,
        matrix[row]![col - 1]! + 1,
        matrix[row - 1]![col - 1]! + cost,
      );
    }
  }
  return matrix[left.length]![right.length]!;
};

const similarity = (left: string, right: string): number => {
  const max = Math.max(left.length, right.length);
  return max === 0 ? 1 : 1 - levenshtein(left, right) / max;
};

const ingredientSearchTerms = (ingredient: IngredientRecord): string[] => [
  ingredient.canonicalInciName,
  ingredient.preferredEnglishName,
  ingredient.preferredZhHantHkName,
  ...ingredient.aliases.map((alias) => alias.name),
  ...ingredient.identifiers.map((identifier) => identifier.value),
];

const productSearchTerms = (product: ProductRecord): string[] => [
  product.preferredName,
  product.brand,
  product.slug,
  ...product.versions.flatMap((version) => [
    version.barcode ?? "",
    version.marketCode,
    version.category,
    version.formulaHash,
  ]),
];

const rankTerms = (
  query: string,
  terms: string[],
): Pick<SearchResult<unknown>, "rank" | "matchLabel" | "matchType"> | undefined => {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return undefined;

  const normalizedTerms = terms
    .filter(Boolean)
    .map((term) => ({ original: term, normalized: normalizeName(term) }))
    .filter((term) => term.normalized.length > 0);

  const exact = normalizedTerms.find((term) => term.normalized === normalizedQuery);
  if (exact) return { rank: 100, matchLabel: exact.original, matchType: "exact" };

  const prefix = normalizedTerms.find((term) => term.normalized.startsWith(normalizedQuery));
  if (prefix) return { rank: 80, matchLabel: prefix.original, matchType: "prefix" };

  const fuzzy = normalizedTerms
    .map((term) => ({ ...term, score: similarity(normalizedQuery, term.normalized) }))
    .filter((term) => term.score >= 0.48)
    .sort((a, b) => b.score - a.score)[0];

  if (fuzzy)
    return { rank: Math.round(fuzzy.score * 60), matchLabel: fuzzy.original, matchType: "fuzzy" };
  return undefined;
};

export const searchIngredients = (query: string): SearchResult<IngredientRecord>[] =>
  ingredientFixtures
    .map((ingredient) => {
      const rank = rankTerms(query, ingredientSearchTerms(ingredient));
      return rank ? { item: ingredient, ...rank } : undefined;
    })
    .filter((result): result is SearchResult<IngredientRecord> => Boolean(result))
    .sort(
      (left, right) =>
        right.rank - left.rank ||
        left.item.preferredEnglishName.localeCompare(right.item.preferredEnglishName),
    );

export const searchProducts = (query: string): SearchResult<ProductRecord>[] =>
  productFixtures
    .map((product) => {
      const rank = rankTerms(query, productSearchTerms(product));
      return rank ? { item: product, ...rank } : undefined;
    })
    .filter((result): result is SearchResult<ProductRecord> => Boolean(result))
    .sort(
      (left, right) =>
        right.rank - left.rank || left.item.preferredName.localeCompare(right.item.preferredName),
    );

export const latestReviewedProducts = (): ProductRecord[] =>
  productFixtures
    .filter((product) =>
      product.versions.some((version) => version.verificationStatus === "reviewed"),
    )
    .slice(0, 3);

export const getIngredient = findIngredientBySlug;
export const getProduct = findProductBySlug;
export const getSource = findSourceById;
export const listSources = () => sourceFixtures;

export const getIngredientDemoEvidence = (ingredientSlug: string) =>
  demoEvidenceFixtures.filter((evidence) => evidence.ingredientSlug === ingredientSlug);

export const productRatingsForDisplay = (): RatingDimensionResult[] => calculateProductRatings([]);

export const allDimensionLabels = Object.entries(concernDimensionLabels) as Array<
  [ConcernDimension, string]
>;

export type DataFreshnessStatus =
  | "最新已核實"
  | "最近核實"
  | "可能已更新"
  | "舊配方"
  | "核實日期不明";

export interface ProductBrowseFilters {
  category?: string;
  brand?: string;
  usageType?: string;
  productForm?: string;
  bodyArea?: string;
  market?: string;
  verificationStatus?: string;
  freshness?: DataFreshnessStatus;
  evidenceConfidence?: string;
  minCompleteness?: number;
  concernDimension?: ConcernDimension;
  sort?: string;
}

export interface ProductBrowseItem {
  product: ProductRecord;
  version: ProductVersionRecord;
  freshness: DataFreshnessStatus;
  freshnessReason: string;
  isPossiblyStale: boolean;
}

const parseDate = (value?: string): Date | undefined => (value ? new Date(`${value}T00:00:00Z`) : undefined);

const yearsBetween = (older: Date, newer: Date): number =>
  (newer.getTime() - older.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

const latestKnownVerificationDate = (version: ProductVersionRecord): Date | undefined => {
  const dates = [
    parseDate(version.lastIndependentVerificationAt),
    parseDate(version.brandConfirmedAt),
    parseDate(version.labelObservedAt),
  ].filter((date): date is Date => Boolean(date));
  return dates.sort((left, right) => right.getTime() - left.getTime())[0];
};

export const productVersionFreshness = (
  version: ProductVersionRecord,
  today = new Date(),
): { status: DataFreshnessStatus; reason: string; isPossiblyStale: boolean } => {
  const latestVerification = latestKnownVerificationDate(version);
  if (!latestVerification) {
    return {
      status: "核實日期不明",
      reason: "缺少標籤觀察、獨立核實或品牌確認日期。",
      isPossiblyStale: true,
    };
  }

  const ageYears = yearsBetween(latestVerification, today);
  const isOld = ageYears > appConfig.formulationStaleYears;

  if (isOld) {
    return {
      status: "舊配方",
      reason: `最近核實已超過 ${appConfig.formulationStaleYears} 年。`,
      isPossiblyStale: true,
    };
  }

  if ((version.conflictingNewerSubmissionCount ?? 0) > 0) {
    return {
      status: "可能已更新",
      reason: "已有較新的衝突提交，需審核是否改配方。",
      isPossiblyStale: true,
    };
  }

  if (ageYears <= 0.5 && version.verificationStatus === "reviewed") {
    return {
      status: "最新已核實",
      reason: "最近半年內有已審核標籤或品牌核實資料。",
      isPossiblyStale: false,
    };
  }

  return {
    status: "最近核實",
    reason: "核實日期仍在可接受期限內，但購買前仍應對照實物包裝。",
    isPossiblyStale: false,
  };
};

export const productBrowseOptions = () => {
  const versions = productFixtures.flatMap((product) => product.versions.map((version) => ({ product, version })));
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
  return {
    categories: unique(versions.map(({ version }) => version.category)),
    brands: unique(productFixtures.map((product) => product.brand)),
    usageTypes: unique(versions.map(({ version }) => version.usageType)),
    productForms: unique(versions.map(({ version }) => version.productForm)),
    bodyAreas: unique(versions.flatMap(({ version }) => version.bodyArea)),
    markets: unique(versions.map(({ version }) => version.marketCode)),
    verificationStatuses: unique(versions.map(({ version }) => version.verificationStatus)),
    evidenceGrades: unique(versions.map(({ version }) => version.evidenceConfidence)),
    dimensions: allDimensionLabels,
  };
};

export const browseProducts = (filters: ProductBrowseFilters): ProductBrowseItem[] => {
  const selectedSort = filters.sort ?? "recently_verified";
  let items = productFixtures.flatMap((product) =>
    product.versions
      .filter((version) => version.publicationStatus === "published")
      .map((version) => {
        const freshness = productVersionFreshness(version);
        return {
          product,
          version,
          freshness: freshness.status,
          freshnessReason: freshness.reason,
          isPossiblyStale: freshness.isPossiblyStale,
        };
      }),
  );

  items = items.filter(({ product, version, freshness }) => {
    if (filters.category && version.category !== filters.category) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    if (filters.usageType && version.usageType !== filters.usageType) return false;
    if (filters.productForm && version.productForm !== filters.productForm) return false;
    if (filters.bodyArea && !version.bodyArea.includes(filters.bodyArea)) return false;
    if (filters.market && version.marketCode !== filters.market) return false;
    if (filters.verificationStatus && version.verificationStatus !== filters.verificationStatus) return false;
    if (filters.freshness && freshness !== filters.freshness) return false;
    if (filters.evidenceConfidence && version.evidenceConfidence !== filters.evidenceConfidence) return false;
    if (filters.minCompleteness !== undefined && version.dataCompleteness < filters.minCompleteness) return false;
    return true;
  });

  return items.sort((left, right) => {
    if (selectedSort === "alphabetical") {
      return left.product.preferredName.localeCompare(right.product.preferredName, "zh-Hant-HK");
    }
    if (selectedSort === "most_complete") {
      return right.version.dataCompleteness - left.version.dataCompleteness;
    }
    if (selectedSort === "recently_submitted") {
      return (parseDate(right.version.submittedAt)?.getTime() ?? 0) - (parseDate(left.version.submittedAt)?.getTime() ?? 0);
    }
    if (selectedSort === "dimension_low" || selectedSort === "dimension_high") {
      const dimension = filters.concernDimension;
      const leftValue = dimension ? (left.version.concernDimensionValues[dimension] ?? Number.POSITIVE_INFINITY) : 0;
      const rightValue = dimension ? (right.version.concernDimensionValues[dimension] ?? Number.POSITIVE_INFINITY) : 0;
      return selectedSort === "dimension_low" ? leftValue - rightValue : rightValue - leftValue;
    }
    return (
      (latestKnownVerificationDate(right.version)?.getTime() ?? 0) -
      (latestKnownVerificationDate(left.version)?.getTime() ?? 0)
    );
  });
};

export const sourceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    regulation: "官方法規",
    official_opinion: "官方安全意見",
    original_study: "原始研究",
    systematic_review: "系統性回顧",
    professional_database: "專業資料庫",
    brand_document: "品牌文件",
    package_label: "包裝標籤",
    secondary_website: "第三方消費者網站",
    discovery_source: "發現來源",
    community_submission: "社群提交",
  };
  return labels[type] ?? type;
};

export const evidenceRelationshipLabel = (relationship?: string): string => {
  const labels: Record<string, string> = {
    primary: "主要來源",
    supporting: "支持來源",
    conflicting: "衝突來源",
    secondary: "次級來源",
    discovery: "發現來源",
    cross_check: "交叉核對",
  };
  return relationship ? (labels[relationship] ?? relationship) : "未標示";
};
