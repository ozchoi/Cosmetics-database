import {
  concernDimensionLabels,
  demoEvidenceFixtures,
  findIngredientBySlug,
  findProductBySlug,
  findSourceById,
  ingredientFixtures,
  productFixtures,
  sourceFixtures,
  type ConcernDimension,
  type IngredientRecord,
  type ProductRecord,
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
