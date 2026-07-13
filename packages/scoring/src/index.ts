import type { ConcernDimension, EvidenceGrade } from "@cosmetic-lens/shared";
import { concernDimensionLabels } from "@cosmetic-lens/shared";

export type ConcernBand = "低潛在關注" | "中等潛在關注" | "較高潛在關注" | "資料不足";
export type RatingStatus = "calculated" | "insufficient_data" | "not_applicable";

export interface Range {
  min: number;
  max: number;
}

export interface MethodologyConfig {
  id: string;
  name: string;
  semanticVersion: string;
  largestContributionWeight: number;
  topThreeMeanWeight: number;
  concernBandThresholds: {
    medium: number;
    high: number;
  };
  contextModifiers: Record<string, number>;
}

export const mvpMethodology: MethodologyConfig = {
  id: "methodology-mvp-0-1",
  name: "mvp-0.1",
  semanticVersion: "0.1.0",
  largestContributionWeight: 0.7,
  topThreeMeanWeight: 0.3,
  concernBandThresholds: {
    medium: 2,
    high: 6,
  },
  contextModifiers: {
    leave_on: 1.25,
    rinse_off: 0.65,
    eye_area: 1.2,
    lip_area: 1.15,
    spray_or_powder: 1.4,
    child_use: 1.25,
    unknown_concentration: 1,
  },
};

export interface RatingInputContribution {
  productIngredientId: string;
  ingredientName: string;
  dimension: ConcernDimension;
  hazardSeverity?: Range;
  exposure?: Range;
  contextModifierKeys: string[];
  evidenceGrade: EvidenceGrade;
  dataCompleteness: number;
  evidenceClaimId?: string;
  explanationZhHant: string;
}

export interface RatingContributionResult {
  productIngredientId: string;
  evidenceClaimId?: string;
  ingredientName: string;
  contributionMin: number;
  contributionMax: number;
  evidenceGrade: EvidenceGrade;
  dataCompleteness: number;
  explanationZhHant: string;
}

export interface RatingDimensionResult {
  dimension: ConcernDimension;
  labelZhHant: string;
  scoreMin?: number;
  scoreMax?: number;
  concernBand: ConcernBand;
  confidenceGrade: EvidenceGrade;
  dataCompleteness: number;
  status: RatingStatus;
  explanationZhHant: string;
  contributions: RatingContributionResult[];
}

const confidenceRank: Record<EvidenceGrade, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  U: 1,
};

const evidenceGradeFromRank = (rank: number): EvidenceGrade => {
  const match = Object.entries(confidenceRank).find(([, value]) => value === rank)?.[0] as
    EvidenceGrade | undefined;
  return match ?? "U";
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const modifierFor = (keys: string[], methodology: MethodologyConfig): number =>
  keys.reduce((modifier, key) => modifier * (methodology.contextModifiers[key] ?? 1), 1);

const hasRequiredInputs = (input: RatingInputContribution): boolean =>
  Boolean(input.hazardSeverity && input.exposure);

const calculateContribution = (
  input: RatingInputContribution,
  methodology: MethodologyConfig,
): RatingContributionResult | undefined => {
  if (!hasRequiredInputs(input)) return undefined;

  const modifier = modifierFor(input.contextModifierKeys, methodology);
  const contributionMin = input.hazardSeverity!.min * input.exposure!.min * modifier;
  const contributionMax = input.hazardSeverity!.max * input.exposure!.max * modifier;

  return {
    productIngredientId: input.productIngredientId,
    ...(input.evidenceClaimId ? { evidenceClaimId: input.evidenceClaimId } : {}),
    ingredientName: input.ingredientName,
    contributionMin,
    contributionMax,
    evidenceGrade: input.evidenceGrade,
    dataCompleteness: clamp(input.dataCompleteness, 0, 1),
    explanationZhHant: input.explanationZhHant,
  };
};

const aggregateScores = (
  contributions: RatingContributionResult[],
  methodology: MethodologyConfig,
): Range => {
  const sortedMin = [...contributions].sort(
    (left, right) => right.contributionMin - left.contributionMin,
  );
  const sortedMax = [...contributions].sort(
    (left, right) => right.contributionMax - left.contributionMax,
  );
  const topMin = sortedMin.slice(0, 3);
  const topMax = sortedMax.slice(0, 3);
  const mean = (values: number[]): number =>
    values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

  return {
    min:
      sortedMin[0]!.contributionMin * methodology.largestContributionWeight +
      mean(topMin.map((item) => item.contributionMin)) * methodology.topThreeMeanWeight,
    max:
      sortedMax[0]!.contributionMax * methodology.largestContributionWeight +
      mean(topMax.map((item) => item.contributionMax)) * methodology.topThreeMeanWeight,
  };
};

const concernBandFor = (scoreMax: number, methodology: MethodologyConfig): ConcernBand => {
  if (scoreMax >= methodology.concernBandThresholds.high) return "較高潛在關注";
  if (scoreMax >= methodology.concernBandThresholds.medium) return "中等潛在關注";
  return "低潛在關注";
};

const averageCompleteness = (contributions: RatingContributionResult[]): number =>
  contributions.reduce((sum, contribution) => sum + contribution.dataCompleteness, 0) /
  Math.max(contributions.length, 1);

const weakestConfidence = (contributions: RatingContributionResult[]): EvidenceGrade => {
  const weakest = contributions.reduce(
    (rank, contribution) => Math.min(rank, confidenceRank[contribution.evidenceGrade]),
    confidenceRank.A,
  );
  return evidenceGradeFromRank(weakest);
};

export const calculateDimensionRating = (
  dimension: ConcernDimension,
  inputs: RatingInputContribution[],
  methodology: MethodologyConfig = mvpMethodology,
): RatingDimensionResult => {
  const matchingInputs = inputs.filter((input) => input.dimension === dimension);
  const contributions = matchingInputs
    .map((input) => calculateContribution(input, methodology))
    .filter((result): result is RatingContributionResult => Boolean(result));

  if (matchingInputs.length === 0) {
    return {
      dimension,
      labelZhHant: concernDimensionLabels[dimension],
      concernBand: "資料不足",
      confidenceGrade: "U",
      dataCompleteness: 0,
      status: "insufficient_data",
      explanationZhHant: "未有足夠已審核資料計算此維度；資料不足不等同零潛在關注。",
      contributions: [],
    };
  }

  if (contributions.length !== matchingInputs.length || contributions.length === 0) {
    return {
      dimension,
      labelZhHant: concernDimensionLabels[dimension],
      concernBand: "資料不足",
      confidenceGrade: "U",
      dataCompleteness: averageCompleteness(contributions),
      status: "insufficient_data",
      explanationZhHant: "缺少危害或暴露輸入，系統不會以零分取代未知資料。",
      contributions,
    };
  }

  const score = aggregateScores(contributions, methodology);

  return {
    dimension,
    labelZhHant: concernDimensionLabels[dimension],
    scoreMin: score.min,
    scoreMax: score.max,
    concernBand: concernBandFor(score.max, methodology),
    confidenceGrade: weakestConfidence(contributions),
    dataCompleteness: averageCompleteness(contributions),
    status: "calculated",
    explanationZhHant:
      "此為暫定 mvp-0.1 方法的潛在關注範圍，綜合危害、暴露及產品情境；不代表疾病機率或醫療診斷。",
    contributions,
  };
};

export const calculateProductRatings = (
  inputs: RatingInputContribution[],
  methodology: MethodologyConfig = mvpMethodology,
): RatingDimensionResult[] =>
  (Object.keys(concernDimensionLabels) as ConcernDimension[]).map((dimension) =>
    calculateDimensionRating(dimension, inputs, methodology),
  );
