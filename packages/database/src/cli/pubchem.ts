import { PubChemEnrichmentProvider } from "@cosmetic-lens/importers";

const args = new Set(process.argv.slice(2));
const valueAfter = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
};
const limit = Number(valueAfter("--limit") ?? 100);

if (!args.has("--reviewed-identities-only")) {
  console.error("PubChem enrichment requires --reviewed-identities-only.");
  process.exit(1);
}

const provider = new PubChemEnrichmentProvider(async (url, init) => {
  const response = await fetch(url, { headers: init.headers });
  if (!response.ok) throw new Error(`PubChem request failed: ${response.status}`);
  return response.json();
});

void provider;
console.log(
  JSON.stringify(
    {
      status: "ready",
      mode: "reviewed-identities-only",
      limit,
      note: "Database-backed PubChem queues should call PubChemEnrichmentProvider with reviewed CAS or InChIKey records only.",
    },
    null,
    2,
  ),
);
