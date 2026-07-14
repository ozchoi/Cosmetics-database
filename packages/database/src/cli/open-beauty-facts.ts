import { dataSourcePolicyRecords } from "@cosmetic-lens/shared";
import { MemoryImportStore, OpenBeautyFactsImporter } from "@cosmetic-lens/importers";

const args = new Set(process.argv.slice(2));
const valueAfter = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
};

const limit = Number(valueAfter("--limit") ?? 250);
const batchSize = Number(valueAfter("--batch-size") ?? 100);
const dryRun = args.has("--dry-run") || !args.has("--commit");
const policy = dataSourcePolicyRecords.find((record) => record.sourceId === "open-beauty-facts");

const fetchJson = async (
  url: string,
  init: { headers: Record<string, string> },
): Promise<unknown> => {
  const response = await fetch(url, { headers: init.headers });
  if (!response.ok) throw new Error(`Open Beauty Facts request failed: ${response.status}`);
  return response.json();
};

const importer = new OpenBeautyFactsImporter(fetchJson, new MemoryImportStore());
const result = await importer.import({
  ...(policy ? { sourcePolicy: policy } : {}),
  limit,
  batchSize,
  dryRun,
  requireIngredients: true,
});

console.log(
  JSON.stringify(
    {
      sourceKey: result.sourceKey,
      dryRun: result.dryRun,
      stagedCount: result.stagedCount,
      importedCount: result.importedCount,
      rejectedCount: result.rejectedCount,
      warningCount: result.warningCount,
      errorCount: result.errorCount,
      checkpoint: result.checkpoint,
      manifest: result.manifest,
      attributionFile: result.attributionFile,
    },
    null,
    2,
  ),
);

if (result.errorCount > 0) process.exitCode = 1;
