import { describe, expect, it } from "vitest";
import { cleanOcrIngredientText, DeterministicOcrProvider } from "../src/index";

describe("OCR helpers", () => {
  it("repairs common OCR line-break issues without removing text", () => {
    expect(cleanOcrIngredientText("Ingredi-\nents: Aqua |\n Glycerin")).toBe(
      "Ingredients: Aqua I\n Glycerin",
    );
  });

  it("returns deterministic OCR output for tests", async () => {
    const provider = new DeterministicOcrProvider("Ingredients: Aqua, Glycerin");
    const result = await provider.recognize({ data: new Uint8Array(), languageCodes: ["eng"] });

    expect(result.provider).toBe("deterministic-test");
    expect(result.rawText).toContain("Glycerin");
    expect(result.averageConfidence).toBeGreaterThan(0.9);
  });
});
