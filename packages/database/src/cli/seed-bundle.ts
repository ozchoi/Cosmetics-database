import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createImportReport,
  defaultBundlePath,
  importSeedBundleToDatabase,
  writeReport,
  writeSharedSnapshot,
} from "../seed-bundle";

const args = process.argv.slice(2);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const getArg = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const command = args.find((arg) => !arg.startsWith("--")) ?? "import";
const bundlePath = getArg("--path") ?? process.env["SEED_BUNDLE_PATH"] ?? defaultBundlePath;
const dryRun = args.includes("--dry-run") || command === "validate";
const shouldWriteSnapshot = args.includes("--write-snapshot");
const reportPath =
  getArg("--report") ??
  resolve(repoRoot, "data/import-reports/cosmetics_evidence_seed_v0.1.report.json");
const snapshotPath =
  getArg("--snapshot") ?? resolve(repoRoot, "packages/shared/src/imported-seed-data.ts");

if (command === "report") {
  const report = createImportReport(bundlePath, true, false);
  writeReport(report, reportPath);
  printReport(report);
  process.exit(report.rejectCount > 0 ? 1 : 0);
}

if (command === "validate") {
  const report = createImportReport(bundlePath, true, false);
  writeReport(report, reportPath);
  printReport(report);
  process.exit(report.rejectCount > 0 ? 1 : 0);
}

if (
  command === "sources" ||
  command === "ingredients" ||
  command === "evidence" ||
  command === "products"
) {
  const report = createImportReport(bundlePath, true, false);
  const sectionCount = sectionCounts(command, report.counts);
  console.log(JSON.stringify({ section: command, dryRun: true, count: sectionCount }, null, 2));
  process.exit(report.rejectCount > 0 ? 1 : 0);
}

const report =
  shouldWriteSnapshot && !dryRun
    ? writeSharedSnapshot(bundlePath, snapshotPath)
    : await importSeedBundleToDatabase(bundlePath, { dryRun });

writeReport(report, reportPath);
printReport(report);

process.exit(report.rejectCount > 0 ? 1 : 0);

function printReport(report: Awaited<ReturnType<typeof importSeedBundleToDatabase>>) {
  console.log(JSON.stringify(report, null, 2));
}

function sectionCounts(section: string, counts: Record<string, number>) {
  if (section === "sources") return counts["sources"] ?? 0;
  if (section === "ingredients")
    return (counts["ingredients"] ?? 0) + (counts["aliasesAndSubstanceMappings"] ?? 0);
  if (section === "evidence")
    return (counts["evidenceClaims"] ?? 0) + (counts["regulatoryRules"] ?? 0);
  if (section === "products")
    return (counts["productVersions"] ?? 0) + (counts["productIngredientTokens"] ?? 0);
  return 0;
}
