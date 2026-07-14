const args = new Set(process.argv.slice(2));

if (!args.has("--stage-only")) {
  console.error("EPA CompTox enrichment is stage-only. Pass --stage-only.");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      status: "ready",
      mode: "stage-only",
      note: "CompTox endpoint records must enter staging and reviewer queues before any EvidenceClaim is published.",
    },
    null,
    2,
  ),
);
