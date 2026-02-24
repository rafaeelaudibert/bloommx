import { describe, test, expect } from "bun:test";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Import all tiers
import { isFreeEmail as isFreeEmailMicro, isFreeDomain as isFreeDomainMicro } from "../src/micro";
import { isFreeEmail as isFreeEmailCompact, isFreeDomain as isFreeDomainCompact } from "../src/compact";
import { isFreeEmail as isFreeEmailBalanced, isFreeDomain as isFreeDomainBalanced } from "../src/balanced";
import { isFreeEmail as isFreeEmailPrecise, isFreeDomain as isFreeDomainPrecise } from "../src/precise";

// Default export
import { isFreeEmail, isFreeDomain } from "../src/index";

const tiers = [
  { name: "micro", isFreeEmail: isFreeEmailMicro, isFreeDomain: isFreeDomainMicro, fpRate: 0.05 },
  { name: "compact", isFreeEmail: isFreeEmailCompact, isFreeDomain: isFreeDomainCompact, fpRate: 0.01 },
  { name: "balanced", isFreeEmail: isFreeEmailBalanced, isFreeDomain: isFreeDomainBalanced, fpRate: 0.001 },
  { name: "precise", isFreeEmail: isFreeEmailPrecise, isFreeDomain: isFreeDomainPrecise, fpRate: 0.0001 },
] as const;

const knownFreeDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "protonmail.com",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "icloud.com",
  "aol.com",
];

const knownCorporateDomains = [
  "posthog.com",
  "google.com",
  "microsoft.com",
  "apple.com",
  "stripe.com",
  "vercel.com",
  "github.com",
  "linear.app",
];

// Load all source domains for false negative test
const allDomains: string[] = JSON.parse(
  readFileSync(join(root, "node_modules/free-email-domains/domains.json"), "utf-8")
);

describe("bloommx", () => {
  for (const tier of tiers) {
    describe(`${tier.name} tier`, () => {
      test("known free domains return true", () => {
        for (const domain of knownFreeDomains) {
          expect(tier.isFreeDomain(domain)).toBe(true);
        }
      });

      test("known corporate domains mostly return false", () => {
        let falsePositives = 0;
        for (const domain of knownCorporateDomains) {
          if (tier.isFreeDomain(domain)) falsePositives++;
        }
        // Micro tier (5% FP) may have a few false positives; stricter tiers should have none
        const maxAllowed = tier.fpRate >= 0.05 ? 2 : 0;
        expect(falsePositives).toBeLessThanOrEqual(maxAllowed);
      });

      test("email parsing works", () => {
        expect(tier.isFreeEmail("user@gmail.com")).toBe(true);
        expect(tier.isFreeEmail("test.user+tag@yahoo.com")).toBe(true);
        expect(tier.isFreeEmail("admin@posthog.com")).toBe(false);
      });

      test("case insensitive", () => {
        expect(tier.isFreeEmail("USER@GMAIL.COM")).toBe(true);
        expect(tier.isFreeDomain("GMAIL.COM")).toBe(true);
        expect(tier.isFreeDomain("Gmail.Com")).toBe(true);
      });

      test("invalid inputs return false", () => {
        expect(tier.isFreeEmail("")).toBe(false);
        expect(tier.isFreeEmail("nodomain")).toBe(false);
        expect(tier.isFreeEmail("@")).toBe(false);
        expect(tier.isFreeEmail("@domain.com")).toBe(false);
      });

      test("zero false negatives — every source domain passes", () => {
        let falseNegatives = 0;
        for (const domain of allDomains) {
          if (!tier.isFreeDomain(domain)) {
            falseNegatives++;
          }
        }
        expect(falseNegatives).toBe(0);
      });

      test(`false positive rate within 2x of target (${tier.fpRate * 100}%)`, () => {
        const testCount = 10000;
        let falsePositives = 0;

        for (let i = 0; i < testCount; i++) {
          // Generate random domain-like strings unlikely to be real free email domains
          const random = `test-${i}-${Math.random().toString(36).slice(2, 10)}.randomcorp.xyz`;
          if (tier.isFreeDomain(random)) {
            falsePositives++;
          }
        }

        const observedRate = falsePositives / testCount;
        const maxAllowed = tier.fpRate * 2;
        expect(observedRate).toBeLessThanOrEqual(maxAllowed);
      });
    });
  }

  describe("default export (balanced)", () => {
    test("isFreeEmail works", () => {
      expect(isFreeEmail("user@gmail.com")).toBe(true);
      expect(isFreeEmail("user@posthog.com")).toBe(false);
    });

    test("isFreeDomain works", () => {
      expect(isFreeDomain("gmail.com")).toBe(true);
      expect(isFreeDomain("posthog.com")).toBe(false);
    });
  });
});
