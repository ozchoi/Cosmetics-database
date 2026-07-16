import { describe, expect, it } from "vitest";
import { createImportReport, defaultBundlePath, formulaHash, loadSeedBundle } from "./seed-bundle";

describe("cosmetics evidence seed bundle", () => {
  it("validates checksums and every active claim has a non-discovery source", () => {
    const { data, issues } = loadSeedBundle(defaultBundlePath);
    expect(data).toBeDefined();
    expect(issues.filter((issue) => issue.severity === "error")).toHaveLength(0);
    const sources = new Map(data!.sources.map((source) => [source.source_id, source]));
    for (const claim of data!.evidenceClaims.filter((item) => item.claim_status === "active")) {
      const source = sources.get(claim.source_id);
      expect(source, claim.claim_id).toBeDefined();
      expect(source!.review_status).not.toBe("discovery_only");
    }
  });

  it("keeps missing environmental data as insufficient or not assessed, not a zero score", () => {
    const { data } = loadSeedBundle(defaultBundlePath);
    const environmental = data!.evidenceClaims.filter(
      (claim) => claim.domain === "environmental_health",
    );
    expect(environmental.length).toBeGreaterThan(0);
    expect(
      environmental.every((claim) =>
        ["active", "insufficient_data", "context_excluded"].includes(claim.claim_status),
      ),
    ).toBe(true);
    expect(JSON.stringify(environmental)).not.toMatch(/zero|0-risk|零風險/u);
  });

  it("preserves required context-separated evidence examples", () => {
    const { data } = loadSeedBundle(defaultBundlePath);
    const claims = data!.evidenceClaims;
    expect(claims.filter((claim) => claim.ingredient_id === "ING-0006").length).toBeGreaterThan(3);
    expect(
      claims.some(
        (claim) =>
          claim.ingredient_id === "ING-0006" &&
          /child|children|兒童|3/u.test(`${claim.population} ${claim.context_label_zh}`),
      ),
    ).toBe(true);
    expect(
      claims.some(
        (claim) =>
          claim.ingredient_id === "ING-0012" &&
          /nano|powder|aerosol|dermal|oral|loose/i.test(
            `${claim.context_label_zh} ${claim.product_form} ${claim.route}`,
          ),
      ),
    ).toBe(true);
  });

  it("preserves product order and unresolved tokens", () => {
    const { data } = loadSeedBundle(defaultBundlePath);
    const grouped = data!.productSeeds.map((product) =>
      data!.productIngredients
        .filter((item) => item.product_version_id === product.product_version_id)
        .sort((left, right) => Number(left.position) - Number(right.position)),
    );
    expect(
      grouped.every((tokens) =>
        tokens.every((token, index) => Number(token.position) === index + 1),
      ),
    ).toBe(true);
    expect(
      data!.productIngredients.filter((item) => item.match_status === "unresolved_in_seed"),
    ).toHaveLength(61);
    expect(data!.productSeeds.every((product) => product.package_photo_verified === "False")).toBe(
      true,
    );
  });

  it("has deterministic formula hashes and idempotent dry-run counts", () => {
    expect(formulaHash(["AQUA", "GLYCERIN"])).toBe(formulaHash(["AQUA", "GLYCERIN"]));
    const first = createImportReport(defaultBundlePath, true);
    const second = createImportReport(defaultBundlePath, true);
    expect(first.counts).toEqual(second.counts);
    expect(first.rejectCount).toBe(0);
    expect(second.rejectCount).toBe(0);
  });
});
