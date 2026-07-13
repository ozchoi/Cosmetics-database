import type { IngredientRecord } from "@cosmetic-lens/shared";

export interface ParsedIngredientToken {
  raw: string;
  normalized: string;
  position: number;
  isMayContain: boolean;
  isNano: boolean;
  parentToken?: string;
  subIngredients: string[];
}

export type MatchMethod =
  | "exact_canonical_inci"
  | "exact_reviewed_alias"
  | "exact_identifier"
  | "normalised_alias"
  | "fuzzy_candidate"
  | "manual_resolution";

export type MatchStatus = "confirmed" | "uncertain" | "unresolved";

export interface IngredientMatchCandidate {
  ingredient: IngredientRecord;
  confidence: number;
  method: MatchMethod;
  matchedOn: string;
}

export interface IngredientMatchResult {
  token: ParsedIngredientToken;
  status: MatchStatus;
  method?: MatchMethod;
  confidence: number;
  ingredient?: IngredientRecord;
  candidates: IngredientMatchCandidate[];
}

const punctuationMap: Array<[RegExp, string]> = [
  [/[，、；]/gu, ","],
  [/[：]/gu, ":"],
  [/[（]/gu, "("],
  [/[）]/gu, ")"],
  [/[［]/gu, "["],
  [/[］]/gu, "]"],
  [/[／]/gu, "/"],
  [/[–—]/gu, "-"],
  [/[“”]/gu, '"'],
  [/[‘’]/gu, "'"],
];

export const normalizeUnicodePunctuation = (value: string): string =>
  punctuationMap.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value.normalize("NFKC"),
  );

export const normalizeWhitespace = (value: string): string => value.replace(/\s+/gu, " ").trim();

export const normalizeCiNumber = (value: string): string =>
  value.replace(/\bCI\s*([0-9]{5})\b/giu, "CI $1");

export const normalizeLabelText = (value: string): string => {
  const punctuationNormalized = normalizeUnicodePunctuation(value);
  const repairedLineBreaks = punctuationNormalized.replace(
    /([A-Za-z])-\s*\n\s*([A-Za-z])/gu,
    "$1$2",
  );
  const separatorsNormalized = repairedLineBreaks
    .replace(/\r\n?/gu, "\n")
    .replace(/\n+/gu, ",")
    .replace(/[;]+/gu, ",");
  return normalizeWhitespace(normalizeCiNumber(separatorsNormalized));
};

export const normalizeName = (value: string): string => {
  const normalized = normalizeLabelText(value)
    .toLocaleLowerCase("en")
    .replace(/\[[^\]]+\]/gu, "")
    .replace(/\([^)]*\)$/u, "")
    .replace(/[^a-z0-9\u4e00-\u9fff/ -]/giu, " ")
    .replace(/\s*\/\s*/gu, "/");
  return normalizeWhitespace(normalized);
};

const removeIngredientHeading = (value: string): string =>
  value.replace(/^\s*(ingredients?|成分|全成分)\s*[:：]\s*/iu, "");

const splitTopLevel = (value: string): string[] => {
  const tokens: string[] = [];
  let current = "";
  let depthRound = 0;
  let depthSquare = 0;

  for (const char of value) {
    if (char === "(") depthRound += 1;
    if (char === ")" && depthRound > 0) depthRound -= 1;
    if (char === "[") depthSquare += 1;
    if (char === "]" && depthSquare > 0) depthSquare -= 1;

    if ((char === "," || char === "\n") && depthRound === 0 && depthSquare === 0) {
      if (current.trim().length > 0) tokens.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) tokens.push(current.trim());
  return tokens;
};

const mayContainPattern = /^(may\s+(?:also\s+)?contain|[+/-]+)\s*:?\s*/iu;

const extractSubIngredients = (token: string): string[] => {
  const matches = token.match(/\(([^()]*)\)/gu) ?? [];
  return matches.flatMap((match) => splitTopLevel(match.slice(1, -1))).filter(Boolean);
};

export const parseIngredientList = (input: string): ParsedIngredientToken[] => {
  const normalizedText = removeIngredientHeading(normalizeLabelText(input));
  const rawTokens = splitTopLevel(normalizedText);
  let inMayContainBlock = false;

  return rawTokens.map((rawToken, index) => {
    const startsMayContain = mayContainPattern.test(rawToken);
    if (startsMayContain) inMayContainBlock = true;

    const raw = startsMayContain ? rawToken.replace(mayContainPattern, "").trim() : rawToken;
    const isNano = /\[\s*nano\s*\]/iu.test(raw);
    const normalized = normalizeName(raw);
    const subIngredients = extractSubIngredients(raw);

    return {
      raw,
      normalized,
      position: index + 1,
      isMayContain: inMayContainBlock || startsMayContain,
      isNano,
      subIngredients,
    };
  });
};

export const createStableFormulaText = (
  tokens: Array<Pick<ParsedIngredientToken, "normalized" | "isMayContain">>,
): string =>
  tokens.map((token) => `${token.isMayContain ? "may:" : "main:"}${token.normalized}`).join("|");

export const createFormulaHash = async (
  tokens: Array<Pick<ParsedIngredientToken, "normalized" | "isMayContain">>,
): Promise<string> => {
  const stableText = createStableFormulaText(tokens);
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(stableText),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
};

export interface IngredientListDiffItem {
  raw: string;
  normalized: string;
  fromPosition?: number;
  toPosition?: number;
}

export interface IngredientListDiff {
  added: IngredientListDiffItem[];
  removed: IngredientListDiffItem[];
  reordered: IngredientListDiffItem[];
  hasChanges: boolean;
}

type DiffToken = Pick<ParsedIngredientToken, "raw" | "normalized" | "position" | "isMayContain">;

interface DiffEntry {
  id: string;
  item: IngredientListDiffItem;
}

const diffKey = (token: DiffToken): string =>
  `${token.isMayContain ? "may" : "main"}:${token.normalized}`;

const toDiffEntries = (tokens: DiffToken[]): DiffEntry[] => {
  const occurrences = new Map<string, number>();
  return tokens.map((token) => {
    const key = diffKey(token);
    const occurrence = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, occurrence);
    return {
      id: `${key}#${occurrence}`,
      item: {
        raw: token.raw,
        normalized: token.normalized,
        fromPosition: token.position,
        toPosition: token.position,
      },
    };
  });
};

export const compareOrderedIngredientLists = (
  baseline: DiffToken[],
  candidate: DiffToken[],
): IngredientListDiff => {
  const baselineEntries = toDiffEntries(baseline);
  const candidateEntries = toDiffEntries(candidate);
  const baselineIds = new Set(baselineEntries.map((entry) => entry.id));
  const candidateIds = new Set(candidateEntries.map((entry) => entry.id));

  const added = candidateEntries
    .filter((entry) => !baselineIds.has(entry.id))
    .map(({ item }) => ({
      raw: item.raw,
      normalized: item.normalized,
      ...(item.toPosition ? { toPosition: item.toPosition } : {}),
    }));

  const removed = baselineEntries
    .filter((entry) => !candidateIds.has(entry.id))
    .map(({ item }) => ({
      raw: item.raw,
      normalized: item.normalized,
      ...(item.fromPosition ? { fromPosition: item.fromPosition } : {}),
    }));

  const commonIds = new Set(
    baselineEntries.filter((entry) => candidateIds.has(entry.id)).map((entry) => entry.id),
  );
  const baselineCommonOrder = baselineEntries
    .filter((entry) => commonIds.has(entry.id))
    .map((entry) => entry.id);
  const candidateCommonOrder = candidateEntries
    .filter((entry) => commonIds.has(entry.id))
    .map((entry) => entry.id);
  const candidateIndex = new Map(candidateCommonOrder.map((id, index) => [id, index]));
  const candidateById = new Map(candidateEntries.map((entry) => [entry.id, entry]));

  const reordered = baselineCommonOrder.flatMap((id, baselineIndex) => {
    const currentIndex = candidateIndex.get(id);
    const baselineEntry = baselineEntries.find((entry) => entry.id === id);
    const candidateEntry = candidateById.get(id);
    if (currentIndex === undefined || !baselineEntry || !candidateEntry) return [];
    if (currentIndex === baselineIndex) return [];
    return [
      {
        raw: baselineEntry.item.raw,
        normalized: baselineEntry.item.normalized,
        ...(baselineEntry.item.fromPosition
          ? { fromPosition: baselineEntry.item.fromPosition }
          : {}),
        ...(candidateEntry.item.toPosition ? { toPosition: candidateEntry.item.toPosition } : {}),
      },
    ];
  });

  return {
    added,
    removed,
    reordered,
    hasChanges: added.length > 0 || removed.length > 0 || reordered.length > 0,
  };
};

export interface MatcherOptions {
  autoConfirmThreshold: number;
  fuzzyCandidateLimit: number;
}

const defaultMatcherOptions: MatcherOptions = {
  autoConfirmThreshold: 0.9,
  fuzzyCandidateLimit: 5,
};

const ingredientNames = (
  ingredient: IngredientRecord,
): Array<{ value: string; reviewed: boolean; method: MatchMethod }> => [
  { value: ingredient.canonicalInciName, reviewed: true, method: "exact_canonical_inci" },
  { value: ingredient.preferredEnglishName, reviewed: true, method: "exact_reviewed_alias" },
  { value: ingredient.preferredZhHantHkName, reviewed: true, method: "exact_reviewed_alias" },
  ...ingredient.aliases.map((alias) => ({
    value: alias.name,
    reviewed: alias.reviewed,
    method: alias.reviewed ? ("exact_reviewed_alias" as const) : ("normalised_alias" as const),
  })),
];

const normalizeIdentifier = (value: string): string => normalizeName(value).replace(/\s+/gu, "");

const levenshtein = (left: string, right: string): number => {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) matrix[row]![0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0]![col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
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
  if (left === right) return 1;
  const maxLength = Math.max(left.length, right.length);
  if (maxLength === 0) return 1;
  return 1 - levenshtein(left, right) / maxLength;
};

const exactCandidate = (
  token: ParsedIngredientToken,
  ingredient: IngredientRecord,
): IngredientMatchCandidate | undefined => {
  const tokenName = token.normalized;
  const tokenIdentifier = normalizeIdentifier(token.raw);

  if (normalizeName(ingredient.canonicalInciName) === tokenName) {
    return {
      ingredient,
      confidence: 1,
      method: "exact_canonical_inci",
      matchedOn: ingredient.canonicalInciName,
    };
  }

  for (const identifier of ingredient.identifiers) {
    if (normalizeIdentifier(identifier.value) === tokenIdentifier) {
      return { ingredient, confidence: 1, method: "exact_identifier", matchedOn: identifier.value };
    }
  }

  for (const name of ingredientNames(ingredient)) {
    if (normalizeName(name.value) === tokenName) {
      return {
        ingredient,
        confidence: name.reviewed ? 1 : 0.95,
        method: name.reviewed ? name.method : "normalised_alias",
        matchedOn: name.value,
      };
    }
  }

  return undefined;
};

export const matchIngredientToken = (
  token: ParsedIngredientToken,
  ingredients: IngredientRecord[],
  options: Partial<MatcherOptions> = {},
): IngredientMatchResult => {
  const resolvedOptions = { ...defaultMatcherOptions, ...options };

  for (const ingredient of ingredients) {
    const candidate = exactCandidate(token, ingredient);
    if (candidate) {
      return {
        token,
        status: "confirmed",
        method: candidate.method,
        confidence: candidate.confidence,
        ingredient,
        candidates: [candidate],
      };
    }
  }

  const candidates = ingredients
    .flatMap((ingredient) =>
      ingredientNames(ingredient).map((name) => ({
        ingredient,
        confidence: similarity(token.normalized, normalizeName(name.value)),
        method: "fuzzy_candidate" as const,
        matchedOn: name.value,
      })),
    )
    .filter((candidate) => candidate.confidence >= 0.55)
    .sort((a, b) => b.confidence - a.confidence)
    .filter(
      (candidate, index, all) =>
        all.findIndex((item) => item.ingredient.id === candidate.ingredient.id) === index,
    )
    .slice(0, resolvedOptions.fuzzyCandidateLimit);

  const best = candidates[0];
  if (!best) {
    return { token, status: "unresolved", confidence: 0, candidates: [] };
  }

  return {
    token,
    status: best.confidence >= resolvedOptions.autoConfirmThreshold ? "confirmed" : "uncertain",
    method: "fuzzy_candidate",
    confidence: best.confidence,
    ...(best.confidence >= resolvedOptions.autoConfirmThreshold
      ? { ingredient: best.ingredient }
      : {}),
    candidates,
  };
};

export const matchIngredientList = (
  input: string,
  ingredients: IngredientRecord[],
  options: Partial<MatcherOptions> = {},
): IngredientMatchResult[] =>
  parseIngredientList(input).map((token) => matchIngredientToken(token, ingredients, options));
