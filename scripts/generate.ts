import { BloomFilter } from "bloomfilter";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load domains
const domainsPath = join(root, "node_modules/free-email-domains/domains.json");
const domains: string[] = JSON.parse(readFileSync(domainsPath, "utf-8"));

// Get source package version
const pkgPath = join(root, "node_modules/free-email-domains/package.json");
const sourceVersion = JSON.parse(readFileSync(pkgPath, "utf-8")).version;

const tiers: Record<string, number> = {
  micro: 0.05,
  compact: 0.01,
  balanced: 0.001,
  precise: 0.0001,
};

console.log(`Generating bloom filters for ${domains.length} domains (free-email-domains@${sourceVersion})`);

for (const [tier, fpRate] of Object.entries(tiers)) {
  const filter = BloomFilter.withTargetError(domains.length, fpRate);
  const m = filter.m;
  const k = filter.k;

  // Add all domains
  for (const domain of domains) {
    filter.add(domain);
  }

  // Verify zero false negatives
  let falseNegatives = 0;
  for (const domain of domains) {
    if (!filter.test(domain)) {
      falseNegatives++;
      console.error(`  FALSE NEGATIVE: ${domain}`);
    }
  }
  if (falseNegatives > 0) {
    throw new Error(`${tier}: ${falseNegatives} false negatives detected!`);
  }

  // Serialize buckets to base64
  const buffer = Buffer.from(filter.buckets.buffer);
  const base64 = buffer.toString("base64");

  const output = `// Auto-generated — DO NOT EDIT
// Source: free-email-domains@${sourceVersion} (${domains.length} domains)
// Tier: ${tier} | FP rate: ~${fpRate * 100}% | m=${m} | k=${k}
export const m = ${m};
export const k = ${k};
export const data = "${base64}";
`;

  const outPath = join(root, "generated", `${tier}.ts`);
  writeFileSync(outPath, output);

  const sizeKB = (base64.length / 1024).toFixed(1);
  console.log(`  ${tier}: m=${m}, k=${k}, data=${sizeKB}KB`);
}

console.log("Done!");
