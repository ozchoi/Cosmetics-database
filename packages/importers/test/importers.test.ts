import { describe, expect, it } from "vitest";
import type { DataSourcePolicyRecord, IngredientRecord } from "@cosmetic-lens/shared";
import {
  CompToxEnrichmentProvider,
  MemoryImportStore,
  OpenBeautyFactsImporter,
  PubChemEnrichmentProvider,
  assertImporterAllowed,
  sha256Json,
} from "../src/index";

const approvedPolicy: DataSourcePolicyRecord = {
  id: "policy-test-open-source",
  sourceId: "test-open-source",
  sourceName: "Synthetic Open Product Source",
  sourceDomain: "example.test",
  sourceAccessClass: "open_structured_source",
  accessMethod: "API",
  licenceName: "Synthetic ODbL-like test licence",
  licenceUrl: "https://example.test/licence",
  attributionRequired: true,
  shareAlikeRequired: true,
  commercialUseStatus: "allowed",
  imageReuseStatus: "allowed",
  textReuseStatus: "allowed",
  automatedAccessAllowed: true,
  legalReviewStatus: "provisional",
  approvedFieldsJson: [
    "id",
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
  prohibitedFieldsJson: ["scores"],
  requiredAttributionText: "Synthetic test attribution",
  importerEnabled: true,
};

const blockedPolicy: DataSourcePolicyRecord = {
  ...approvedPolicy,
  id: "policy-test-blocked",
  sourceId: "blocked.test",
  legalReviewStatus: "not_reviewed",
  importerEnabled: false,
  requiredAttributionText: "",
};

const productPage = {
  products: [
    {
      id: "synthetic-001",
      code: "1234567890123",
      brands: "Synthetic Brand",
      product_name: "Synthetic Lotion",
      categories: "Cosmetics",
      countries: "United Kingdom, Hong Kong",
      ingredients_text: "Aqua, Glycerin",
      image_ingredients_url: "https://example.test/image.jpg",
      url: "https://example.test/product/1234567890123",
      last_modified_t: 1_700_000_000,
    },
    {
      id: "synthetic-002",
      code: "2234567890123",
      brands: "",
      product_name: "Rejected Lotion",
      ingredients_text: "Aqua",
    },
  ],
};

describe("source policy enforcement", () => {
  it("blocks importers when licence approval or attribution is missing", () => {
    expect(assertImporterAllowed(blockedPolicy, ["brands"])).toEqual([
      "Source legal review is not approved or provisional.",
      "Importer is disabled for this source.",
      "Required attribution text is missing.",
    ]);
  });

  it("blocks proprietary score fields", () => {
    expect(assertImporterAllowed(approvedPolicy, ["brands", "scores"])).toContain(
      "Field is not approved for import: scores",
    );
  });
});

describe("Open Beauty Facts importer", () => {
  it("previews approved bounded imports", async () => {
    const importer = new OpenBeautyFactsImporter(async () => productPage);
    const preview = await importer.preview({ sourcePolicy: approvedPolicy, limit: 250 });
    expect(preview.allowed).toBe(true);
    expect(preview.requestedLimit).toBe(250);
    expect(preview.warnings.join(" ")).toContain("unverified");
  });

  it("stages valid records, rejects invalid records, and preserves attribution", async () => {
    const store = new MemoryImportStore();
    const importer = new OpenBeautyFactsImporter(
      async () => productPage,
      store,
      () => new Date("2026-07-14T00:00:00Z"),
    );

    const result = await importer.import({
      sourcePolicy: approvedPolicy,
      limit: 2,
      batchSize: 2,
      commit: true,
    });

    expect(result.stagedCount).toBe(1);
    expect(result.rejectedCount).toBe(1);
    expect(store.stagedProducts[0]).toMatchObject({
      externalSourceRecordId: "1234567890123",
      verificationStatus: "externally_imported_unverified",
      publicationStatus: "review_required",
      marketDisplayStatus: "市場版本未確認",
      attribution: "Synthetic test attribution",
    });
    expect(store.stagedProducts[0]?.normalisedIngredientText).toBe("Aqua, Glycerin");
    expect(result.attributionFile?.sources[0]?.recordCount).toBe(1);
    expect(result.manifest?.transformations.join(" ")).toContain("stage only");
  });

  it("supports dry-run without writing staged products", async () => {
    const store = new MemoryImportStore();
    const importer = new OpenBeautyFactsImporter(async () => productPage, store);
    const result = await importer.import({ sourcePolicy: approvedPolicy, dryRun: true, limit: 1 });
    expect(result.stagedCount).toBe(1);
    expect(result.importedCount).toBe(0);
    expect(store.stagedProducts).toHaveLength(0);
  });

  it("reports duplicate external IDs and duplicate barcodes", async () => {
    const store = new MemoryImportStore();
    store.saveRaw("open-beauty-facts", "1234567890123", "hash", {});
    store.barcodes.add("1234567890123");
    const importer = new OpenBeautyFactsImporter(async () => productPage, store);
    const result = await importer.import({ sourcePolicy: approvedPolicy, limit: 1 });
    expect(result.conflicts.map((conflict) => conflict.kind)).toEqual([
      "duplicate_external_id",
      "duplicate_barcode",
    ]);
  });

  it("hashes raw payloads deterministically", () => {
    expect(sha256Json({ a: 1 })).toBe(sha256Json({ a: 1 }));
  });
});

describe("PubChem enrichment provider", () => {
  it("retrieves exact reviewed CAS matches as pending-review candidates", async () => {
    const provider = new PubChemEnrichmentProvider(async () => ({
      IdentifierList: { CID: [753] },
    }));
    const candidate = await provider.findByReviewedCas("56-81-5");
    expect(candidate).toMatchObject({
      cid: 753,
      matchMethod: "exact_reviewed_cas",
      mappingConfidence: 1,
      reviewStatus: "pending_review",
    });
  });

  it("rejects automatic single-compound mapping for mixtures and fragrance", () => {
    const provider = new PubChemEnrichmentProvider(async () => ({}));
    const fragrance: Pick<IngredientRecord, "ingredientType" | "canonicalInciName"> = {
      ingredientType: "fragrance_mixture",
      canonicalInciName: "PARFUM",
    };
    expect(provider.isEligibleIngredient(fragrance)).toBe(false);
    expect(provider.rejectAmbiguousSynonym("Parfum").valid).toBe(false);
  });
});

describe("EPA CompTox staging", () => {
  it("does not create active evidence claims automatically", () => {
    const staged = new CompToxEnrichmentProvider().stageEndpoint({
      sourcePolicyId: "epa-comptox",
      endpointKind: "in_vitro_assay",
      endpointJson: { assay: "synthetic assay" },
    });
    expect(staged.reviewStatus).toBe("pending_review");
    expect(staged.activeEvidenceClaimCreated).toBe(false);
  });
});
