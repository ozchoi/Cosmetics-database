import { describe, expect, it } from "vitest";
import {
  calculateDimensionRating,
  mvpMethodology,
  type RatingInputContribution,
} from "../src/index";

const baseInput: RatingInputContribution = {
  productIngredientId: "pi-1",
  ingredientName: "Demo ingredient",
  dimension: "skin_eye",
  hazardSeverity: { min: 1, max: 2 },
  exposure: { min: 0.5, max: 1 },
  contextModifierKeys: ["leave_on"],
  evidenceGrade: "C",
  dataCompleteness: 0.6,
  explanationZhHant: "開發示範，不作真實安全結論。",
};

describe("mvp-0.1 scoring", () => {
  it("calculates a range with configurable largest/top-three aggregation", () => {
    const result = calculateDimensionRating("skin_eye", [
      baseInput,
      {
        ...baseInput,
        productIngredientId: "pi-2",
        hazardSeverity: { min: 2, max: 3 },
        exposure: { min: 1, max: 1 },
      },
    ]);

    expect(result.status).toBe("calculated");
    expect(result.scoreMin).toBeGreaterThan(0);
    expect(result.scoreMax).toBeGreaterThan(result.scoreMin!);
    expect(result.concernBand).not.toBe("資料不足");
    expect(result.confidenceGrade).toBe("C");
  });

  it("does not calculate when required inputs are absent", () => {
    const missingExposure: RatingInputContribution = { ...baseInput };
    delete missingExposure.exposure;
    const result = calculateDimensionRating("skin_eye", [missingExposure]);

    expect(result.status).toBe("insufficient_data");
    expect(result.concernBand).toBe("資料不足");
    expect(result.scoreMin).toBeUndefined();
    expect(result.explanationZhHant).toContain("不會以零分取代未知資料");
  });

  it("does not reduce concern simply because confidence is low", () => {
    const highConfidence = calculateDimensionRating("skin_eye", [
      { ...baseInput, evidenceGrade: "A" },
    ]);
    const lowConfidence = calculateDimensionRating("skin_eye", [
      { ...baseInput, evidenceGrade: "D" },
    ]);

    expect(lowConfidence.scoreMax).toBe(highConfidence.scoreMax);
    expect(lowConfidence.confidenceGrade).toBe("D");
  });

  it("returns insufficient data for absent dimensions", () => {
    const result = calculateDimensionRating("environment", [baseInput], mvpMethodology);

    expect(result.status).toBe("insufficient_data");
    expect(result.dataCompleteness).toBe(0);
  });
});
