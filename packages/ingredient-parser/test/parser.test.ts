import { describe, expect, it } from "vitest";
import { ingredientFixtures } from "@cosmetic-lens/shared";
import {
  createFormulaHash,
  createStableFormulaText,
  matchIngredientList,
  matchIngredientToken,
  normalizeName,
  parseIngredientList,
} from "../src/index";

describe("normalisation", () => {
  it("normalises Unicode punctuation, whitespace, and CI numbers", () => {
    expect(normalizeName("  CI77491，  Titanium Dioxide［nano］ ")).toBe(
      "ci 77491 titanium dioxide",
    );
  });

  it("keeps slashes that are part of aliases", () => {
    expect(normalizeName("Caprylic ／ Capric Triglyceride")).toBe("caprylic/capric triglyceride");
  });
});

describe("ingredient list parser", () => {
  it("tokenises comma, semicolon, line breaks, parentheses, and May contain", () => {
    const tokens = parseIngredientList(
      "Ingredients: Aqua, Glycerin; Cetearyl Alcohol (and) Panthenol\nMay contain: CI77491, Titanium Dioxide [nano]",
    );

    expect(tokens.map((token) => token.raw)).toEqual([
      "Aqua",
      "Glycerin",
      "Cetearyl Alcohol (and) Panthenol",
      "CI 77491",
      "Titanium Dioxide [nano]",
    ]);
    expect(tokens[2]?.subIngredients).toEqual(["and"]);
    expect(tokens[3]?.isMayContain).toBe(true);
    expect(tokens[4]?.isNano).toBe(true);
  });

  it("preserves formula hash stability across punctuation variants", async () => {
    const left = parseIngredientList("Aqua, Glycerin, CI77491");
    const right = parseIngredientList("Aqua； Glycerin， CI 77491");

    expect(createStableFormulaText(left)).toBe(createStableFormulaText(right));
    await expect(createFormulaHash(left)).resolves.toBe(await createFormulaHash(right));
  });
});

describe("ingredient matcher", () => {
  it("matches Traditional Chinese aliases", () => {
    const [result] = matchIngredientList("甘油", ingredientFixtures);
    expect(result?.status).toBe("confirmed");
    expect(result?.ingredient?.slug).toBe("glycerin");
    expect(result?.method).toBe("exact_reviewed_alias");
  });

  it("matches English INCI and CAS identifiers", () => {
    const inci = matchIngredientList("GLYCERIN", ingredientFixtures)[0];
    const cas = matchIngredientList("56-81-5", ingredientFixtures)[0];

    expect(inci?.method).toBe("exact_canonical_inci");
    expect(cas?.method).toBe("exact_identifier");
  });

  it("does not auto-confirm a weak fuzzy candidate", () => {
    const [token] = parseIngredientList("Glyzerin");
    const result = matchIngredientToken(token!, ingredientFixtures, { autoConfirmThreshold: 0.95 });

    expect(result.status).toBe("uncertain");
    expect(result.ingredient).toBeUndefined();
    expect(result.candidates[0]?.ingredient.slug).toBe("glycerin");
  });

  it("keeps unresolved tokens for reviewer queues", () => {
    const [result] = matchIngredientList("Unobtainium Complex", ingredientFixtures);
    expect(result?.status).toBe("unresolved");
    expect(result?.candidates).toEqual([]);
  });
});
