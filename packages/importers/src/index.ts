import { createHash } from "node:crypto";
import { normalizeLabelText } from "@cosmetic-lens/ingredient-parser";
import type { DataSourcePolicyRecord, IngredientRecord } from "@cosmetic-lens/shared";

export interface ImportOptions {
  limit?: number;
  batchSize?: number;
  dryRun?: boolean;
  commit?: boolean;
  requireIngredients?: boolean;
  checkpoint?: ImportCheckpoint;
  sourcePolicy?: DataSourcePolicyRecord;
}

export interface ImportCheckpoint {
  page: number;
  importedCount: number;
}

export interface ImportPreview {
  sourceKey: string;
  allowed: boolean;
  requestedLimit: number;
  approvedFields: string[];
  warnings: string[];
}

export interface ImportValidationResult {
  valid: boolean;
  externalRecordId?: string;
  errors: string[];
  warnings: string[];
}

export interface ImportLogEntry {
  level: "info" | "warning" | "error";
  message: string;
  externalRecordId?: string;
}

export interface ImportResult {
  sourceKey: string;
  jobId: string;
  dryRun: boolean;
  importedCount: number;
  stagedCount: number;
  skippedCount: number;
  rejectedCount: number;
  warningCount: number;
  errorCount: number;
  checkpoint: ImportCheckpoint;
  attributionFile?: MachineReadableAttributionFile;
  manifest?: ImportManifest;
  logs: ImportLogEntry[];
  rejections: ImportValidationResult[];
  conflicts: ImportConflict[];
}

export interface ImportConflict {
  externalRecordId: string;
  kind: "duplicate_external_id" | "duplicate_barcode" | "formula_hash_match";
  message: string;
}

export interface ProductDataImporter {
  sourceKey: string;
  preview(options: ImportOptions): Promise<ImportPreview>;
  import(options: ImportOptions): Promise<ImportResult>;
  resume(jobId: string): Promise<ImportResult>;
  validate(record: unknown): ImportValidationResult;
}

export interface OpenBeautyFactsRecord {
  id?: string;
  code?: string;
  brands?: string;
  product_name?: string;
  categories?: string;
  countries?: string;
  ingredients_text?: string;
  image_ingredients_url?: string;
  url?: string;
  last_modified_t?: number;
  [key: string]: unknown;
}

export interface StagedImportedProduct {
  externalSourceRecordId: string;
  barcode?: string;
  brand: string;
  productName: string;
  productCategory?: string;
  countriesOrMarkets: string[];
  rawIngredientText: string;
  normalisedIngredientText: string;
  imageReferences: string[];
  sourceUrl?: string;
  sourceModificationTimestamp?: string;
  importTimestamp: string;
  licence: string;
  attribution: string;
  rawSourcePayloadHash: string;
  importerVersion: string;
  sourceType: "open_product_database";
  verificationStatus: "externally_imported_unverified";
  publicationStatus: "review_required";
  marketDisplayStatus: "市場版本未確認";
  fieldProvenance: Record<string, "open_beauty_facts">;
}

export interface ImportManifest {
  sourceKey: string;
  importerVersion: string;
  generatedAt: string;
  requestedScope: Record<string, unknown>;
  transformations: string[];
  licence: string;
  attribution: string;
  fieldProvenance: Record<string, string>;
}

export interface MachineReadableAttributionFile {
  generatedAt: string;
  sources: Array<{
    sourceKey: string;
    sourceName: string;
    licenceName: string;
    licenceUrl?: string;
    attribution: string;
    recordCount: number;
  }>;
}

export interface ImportStore {
  hasExternalRecord(sourceKey: string, externalRecordId: string): boolean;
  hasBarcode(barcode: string): boolean;
  saveRaw(sourceKey: string, externalRecordId: string, payloadHash: string, payload: unknown): void;
  stageProduct(product: StagedImportedProduct): void;
  getCheckpoint(jobId: string): ImportCheckpoint | undefined;
  saveCheckpoint(jobId: string, checkpoint: ImportCheckpoint): void;
}

export class MemoryImportStore implements ImportStore {
  readonly rawRecords = new Map<string, unknown>();
  readonly stagedProducts: StagedImportedProduct[] = [];
  readonly checkpoints = new Map<string, ImportCheckpoint>();
  readonly barcodes = new Set<string>();

  hasExternalRecord(sourceKey: string, externalRecordId: string): boolean {
    return this.rawRecords.has(`${sourceKey}:${externalRecordId}`);
  }

  hasBarcode(barcode: string): boolean {
    return this.barcodes.has(barcode);
  }

  saveRaw(sourceKey: string, externalRecordId: string, _payloadHash: string, payload: unknown) {
    this.rawRecords.set(`${sourceKey}:${externalRecordId}`, payload);
  }

  stageProduct(product: StagedImportedProduct) {
    if (product.barcode) this.barcodes.add(product.barcode);
    this.stagedProducts.push(product);
  }

  getCheckpoint(jobId: string): ImportCheckpoint | undefined {
    return this.checkpoints.get(jobId);
  }

  saveCheckpoint(jobId: string, checkpoint: ImportCheckpoint) {
    this.checkpoints.set(jobId, checkpoint);
  }
}

export type FetchJson = (
  url: string,
  init: { headers: Record<string, string> },
) => Promise<unknown>;

export const sha256Json = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const assertImporterAllowed = (
  policy: DataSourcePolicyRecord | undefined,
  requestedFields: string[],
): string[] => {
  const errors: string[] = [];
  if (!policy) errors.push("Missing source policy.");
  if (policy && !["approved", "provisional"].includes(policy.legalReviewStatus)) {
    errors.push("Source legal review is not approved or provisional.");
  }
  if (policy && !policy.importerEnabled) errors.push("Importer is disabled for this source.");
  if (policy && !policy.licenceName) errors.push("Source licence is missing.");
  if (policy && !policy.requiredAttributionText)
    errors.push("Required attribution text is missing.");
  if (policy) {
    for (const field of requestedFields) {
      if (!policy.approvedFieldsJson.includes(field)) {
        errors.push(`Field is not approved for import: ${field}`);
      }
    }
  }
  return errors;
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class OpenBeautyFactsImporter implements ProductDataImporter {
  sourceKey = "open-beauty-facts";
  importerVersion = "open-beauty-facts-v0.1.0";
  approvedFields = [
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
  ];

  constructor(
    private readonly fetchJson: FetchJson,
    private readonly store: ImportStore = new MemoryImportStore(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async preview(options: ImportOptions): Promise<ImportPreview> {
    const limit = clampLimit(options.limit);
    const errors = assertImporterAllowed(options.sourcePolicy, this.approvedFields);
    return {
      sourceKey: this.sourceKey,
      allowed: errors.length === 0,
      requestedLimit: limit,
      approvedFields: this.approvedFields,
      warnings: [
        ...errors,
        "Open Beauty Facts records are externally imported and unverified; review is required before publication.",
        "Market lists are not proof of a current Hong Kong formulation.",
      ],
    };
  }

  async import(options: ImportOptions): Promise<ImportResult> {
    const preview = await this.preview(options);
    const jobId = `job_${this.sourceKey}_${this.now().toISOString()}`;
    const result = emptyResult(this.sourceKey, jobId, Boolean(options.dryRun));
    if (!preview.allowed) {
      result.errorCount += preview.warnings.length;
      result.logs.push(
        ...preview.warnings.map((message) => ({ level: "error" as const, message })),
      );
      return result;
    }

    const limit = clampLimit(options.limit);
    const batchSize = Math.min(Math.max(options.batchSize ?? 100, 1), 500);
    let page = options.checkpoint?.page ?? 1;
    let staged = options.checkpoint?.importedCount ?? 0;
    let examined = 0;

    while (examined < limit) {
      const pageSize = Math.min(batchSize, limit - examined);
      const records = await this.fetchPage(page, pageSize);
      if (records.length === 0) break;

      for (const record of records) {
        if (examined >= limit) break;
        examined += 1;
        const validation = this.validate(record);
        if (!validation.valid || !validation.externalRecordId) {
          result.rejectedCount += 1;
          result.rejections.push(validation);
          continue;
        }
        const conflicts = this.detectConflicts(record, validation.externalRecordId);
        result.conflicts.push(...conflicts);
        if (conflicts.some((conflict) => conflict.kind === "duplicate_external_id")) {
          result.skippedCount += 1;
          continue;
        }

        const mapped = this.mapRecord(record, validation.externalRecordId, options.sourcePolicy!);
        if (!options.dryRun) {
          this.store.saveRaw(
            this.sourceKey,
            validation.externalRecordId,
            mapped.rawSourcePayloadHash,
            record,
          );
          this.store.stageProduct(mapped);
        }
        staged += 1;
        result.stagedCount += 1;
        result.importedCount += options.dryRun ? 0 : 1;
      }

      result.checkpoint = { page, importedCount: staged };
      this.store.saveCheckpoint(jobId, result.checkpoint);
      page += 1;
      await sleep(0);
    }

    result.warningCount = result.conflicts.length;
    result.manifest = this.createManifest(options, result.stagedCount, options.sourcePolicy!);
    result.attributionFile = this.createAttribution(options.sourcePolicy!, result.stagedCount);
    return result;
  }

  async resume(jobId: string): Promise<ImportResult> {
    const checkpoint = this.store.getCheckpoint(jobId);
    if (!checkpoint) {
      return {
        ...emptyResult(this.sourceKey, jobId, false),
        errorCount: 1,
        logs: [{ level: "error", message: "Checkpoint not found." }],
      };
    }
    return { ...emptyResult(this.sourceKey, jobId, false), checkpoint };
  }

  validate(record: unknown): ImportValidationResult {
    const product = record as OpenBeautyFactsRecord;
    const externalRecordId = String(product.code || product.id || "");
    const errors: string[] = [];
    if (!externalRecordId) errors.push("Missing external id or barcode.");
    if (!String(product.brands ?? "").trim()) errors.push("Missing brand.");
    if (!String(product.product_name ?? "").trim()) errors.push("Missing product name.");
    if (!String(product.ingredients_text ?? "").trim()) errors.push("Missing ingredient list.");
    return {
      valid: errors.length === 0,
      ...(externalRecordId ? { externalRecordId } : {}),
      errors,
      warnings: product.countries
        ? []
        : ["Source market list missing; market version remains unconfirmed."],
    };
  }

  private async fetchPage(page: number, pageSize: number): Promise<OpenBeautyFactsRecord[]> {
    const url = new URL("https://world.openbeautyfacts.org/cgi/search.pl");
    url.searchParams.set("json", "1");
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", String(pageSize));
    url.searchParams.set("fields", this.approvedFields.join(","));
    const response = (await withRetries(() =>
      this.fetchJson(url.toString(), {
        headers: {
          "user-agent": "CosmeticIngredientLens/0.1 importer (contact: admin@example.test)",
        },
      }),
    )) as { products?: OpenBeautyFactsRecord[] };
    return response.products ?? [];
  }

  private detectConflicts(
    record: OpenBeautyFactsRecord,
    externalRecordId: string,
  ): ImportConflict[] {
    const conflicts: ImportConflict[] = [];
    if (this.store.hasExternalRecord(this.sourceKey, externalRecordId)) {
      conflicts.push({
        externalRecordId,
        kind: "duplicate_external_id",
        message: "External source record was already imported.",
      });
    }
    if (record.code && this.store.hasBarcode(record.code)) {
      conflicts.push({
        externalRecordId,
        kind: "duplicate_barcode",
        message: "Barcode already exists in staged or canonical records.",
      });
    }
    return conflicts;
  }

  private mapRecord(
    record: OpenBeautyFactsRecord,
    externalRecordId: string,
    policy: DataSourcePolicyRecord,
  ): StagedImportedProduct {
    const rawIngredientText = String(record.ingredients_text);
    return {
      externalSourceRecordId: externalRecordId,
      ...(record.code ? { barcode: String(record.code) } : {}),
      brand: String(record.brands),
      productName: String(record.product_name),
      ...(record.categories ? { productCategory: String(record.categories) } : {}),
      countriesOrMarkets: splitList(record.countries),
      rawIngredientText,
      normalisedIngredientText: normalizeLabelText(rawIngredientText),
      imageReferences:
        record.image_ingredients_url && policy.imageReuseStatus !== "prohibited"
          ? [String(record.image_ingredients_url)]
          : [],
      ...(record.url ? { sourceUrl: String(record.url) } : {}),
      ...(record.last_modified_t
        ? {
            sourceModificationTimestamp: new Date(
              Number(record.last_modified_t) * 1000,
            ).toISOString(),
          }
        : {}),
      importTimestamp: this.now().toISOString(),
      licence: policy.licenceName,
      attribution: policy.requiredAttributionText ?? "",
      rawSourcePayloadHash: sha256Json(record),
      importerVersion: this.importerVersion,
      sourceType: "open_product_database",
      verificationStatus: "externally_imported_unverified",
      publicationStatus: "review_required",
      marketDisplayStatus: "市場版本未確認",
      fieldProvenance: {
        externalSourceRecordId: "open_beauty_facts",
        barcode: "open_beauty_facts",
        brand: "open_beauty_facts",
        productName: "open_beauty_facts",
        rawIngredientText: "open_beauty_facts",
      },
    };
  }

  private createManifest(
    options: ImportOptions,
    stagedCount: number,
    policy: DataSourcePolicyRecord,
  ): ImportManifest {
    return {
      sourceKey: this.sourceKey,
      importerVersion: this.importerVersion,
      generatedAt: this.now().toISOString(),
      requestedScope: {
        limit: clampLimit(options.limit),
        batchSize: options.batchSize ?? 100,
        requireIngredients: options.requireIngredients ?? true,
        stagedCount,
      },
      transformations: [
        "normalise ingredient text punctuation and whitespace",
        "stage only; no automatic publication",
      ],
      licence: policy.licenceName,
      attribution: policy.requiredAttributionText ?? "",
      fieldProvenance: {
        brand: "Open Beauty Facts",
        productName: "Open Beauty Facts",
        rawIngredientText: "Open Beauty Facts",
      },
    };
  }

  private createAttribution(
    policy: DataSourcePolicyRecord,
    recordCount: number,
  ): MachineReadableAttributionFile {
    return {
      generatedAt: this.now().toISOString(),
      sources: [
        {
          sourceKey: this.sourceKey,
          sourceName: policy.sourceName,
          licenceName: policy.licenceName,
          ...(policy.licenceUrl ? { licenceUrl: policy.licenceUrl } : {}),
          attribution: policy.requiredAttributionText ?? "",
          recordCount,
        },
      ],
    };
  }
}

export interface PubChemCandidate {
  cid: number;
  query: string;
  matchMethod:
    | "exact_reviewed_cas"
    | "exact_reviewed_inchikey"
    | "exact_canonical_name"
    | "reviewed_synonym"
    | "candidate_generation";
  mappingConfidence: number;
  reviewStatus: "pending_review" | "approved" | "rejected";
  payloadHash: string;
}

export class PubChemEnrichmentProvider {
  constructor(private readonly fetchJson: FetchJson) {}

  isEligibleIngredient(
    ingredient: Pick<IngredientRecord, "ingredientType" | "canonicalInciName">,
  ): boolean {
    return ![
      "mixture",
      "uvcb",
      "botanical",
      "extract",
      "polymer",
      "fragrance_mixture",
      "colourant",
    ].includes(ingredient.ingredientType);
  }

  async findByReviewedCas(cas: string): Promise<PubChemCandidate> {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cas)}/cids/JSON`;
    const payload = (await this.fetchJson(url, {
      headers: { "user-agent": "CosmeticIngredientLens/0.1 pubchem-enricher" },
    })) as { IdentifierList?: { CID?: number[] } };
    const cid = payload.IdentifierList?.CID?.[0];
    if (!cid) throw new Error("No PubChem CID found for reviewed CAS.");
    return {
      cid,
      query: cas,
      matchMethod: "exact_reviewed_cas",
      mappingConfidence: 1,
      reviewStatus: "pending_review",
      payloadHash: sha256Json(payload),
    };
  }

  rejectAmbiguousSynonym(name: string): ImportValidationResult {
    return {
      valid: false,
      errors: [
        `Ambiguous cosmetic ingredient cannot be automatically mapped to one compound: ${name}`,
      ],
      warnings: ["Manual review required."],
    };
  }
}

export class CompToxEnrichmentProvider {
  stageEndpoint(endpoint: {
    sourcePolicyId: string;
    endpointKind: string;
    endpointJson: unknown;
  }): {
    reviewStatus: "pending_review";
    activeEvidenceClaimCreated: false;
    endpoint: typeof endpoint;
  } {
    return {
      reviewStatus: "pending_review",
      activeEvidenceClaimCreated: false,
      endpoint,
    };
  }
}

const clampLimit = (limit = 250): number => Math.min(Math.max(limit, 1), 500);

const splitList = (value: unknown): string[] =>
  String(value ?? "")
    .split(/[,;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);

const emptyResult = (sourceKey: string, jobId: string, dryRun: boolean): ImportResult => ({
  sourceKey,
  jobId,
  dryRun,
  importedCount: 0,
  stagedCount: 0,
  skippedCount: 0,
  rejectedCount: 0,
  warningCount: 0,
  errorCount: 0,
  checkpoint: { page: 1, importedCount: 0 },
  logs: [],
  rejections: [],
  conflicts: [],
});

const withRetries = async <T>(fn: () => Promise<T>, attempts = 3): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await sleep(2 ** attempt);
    }
  }
  throw lastError;
};
