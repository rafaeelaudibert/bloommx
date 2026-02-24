# bloommx

Lightweight free email domain checker using a [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter). Check if an email address belongs to a free provider (Gmail, Yahoo, Outlook, etc.) with a tiny bundle — no full domain lists shipped to the client.

## Why?

Libraries like `free-email-domains` ship the entire domain list (~4,800 entries). That's fine on the server, but heavy for client-side bundles. A Bloom filter trades a small, configurable false positive rate for a dramatically smaller payload. Zero false negatives — if a domain is free, bloommx will always say so.

Inspired by [swot-bloom](https://www.npmjs.com/package/swot-bloom) (same concept for academic emails).

## Install

```bash
npm install bloommx
```

## Usage

```ts
import { isFreeEmail, isFreeDomain } from "bloommx";

isFreeEmail("user@gmail.com");    // true
isFreeEmail("ceo@posthog.com");   // false

isFreeDomain("yahoo.com");        // true
isFreeDomain("stripe.com");       // false
```

## Tiers

bloommx ships 4 tiers as separate subpath exports. Each tier is independently tree-shakeable — importing `bloommx/micro` won't pull in the data for other tiers.

| Import | FP Rate | Data Size | Best For |
|--------|---------|-----------|----------|
| `bloommx/micro` | ~5% | ~5 KB | Smallest possible, rough filtering |
| `bloommx/compact` | ~1% | ~8 KB | Most frontend apps |
| `bloommx` (default) | ~0.1% | ~11 KB | Balanced default |
| `bloommx/precise` | ~0.01% | ~15 KB | Near-exact matching |

**False positive** means a non-free domain is incorrectly identified as free. **False negative** never happens — every domain in the source list is guaranteed to match.

### Choosing a tier

- **`bloommx/micro`** (~5% FP, ~5 KB): Use when you just need a rough signal and bundle size is critical. About 1 in 20 corporate domains may be misclassified as free. Good for soft UI hints, not hard filtering.

- **`bloommx/compact`** (~1% FP, ~8 KB): Good balance for most frontend use cases. About 1 in 100 corporate domains may be misclassified. Suitable for form validation where the occasional false positive is acceptable.

- **`bloommx`** (~0.1% FP, ~11 KB): The default. About 1 in 1,000 corporate domains may be misclassified. Recommended when accuracy matters but you still want a small bundle.

- **`bloommx/precise`** (~0.01% FP, ~15 KB): Near-exact. About 1 in 10,000 corporate domains may be misclassified. Use when you need high confidence and the extra few KB are acceptable.

### Using a specific tier

```ts
import { isFreeEmail } from "bloommx/micro";
import { isFreeEmail } from "bloommx/compact";
import { isFreeEmail } from "bloommx";          // balanced (default)
import { isFreeEmail } from "bloommx/precise";
```

All tiers export the same API: `isFreeEmail(email)` and `isFreeDomain(domain)`.

## API

### `isFreeEmail(email: string): boolean`

Returns `true` if the email's domain is a known free email provider. Handles parsing, lowercasing, and trimming. Returns `false` for invalid inputs (no `@`, empty string).

### `isFreeDomain(domain: string): boolean`

Returns `true` if the domain is a known free email provider. Input is lowercased and trimmed.

## How it works

1. At build time, all ~4,800 domains from [`free-email-domains`](https://github.com/Kikobeats/free-email-domains) are inserted into a [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) using the [`bloomfilter`](https://www.npmjs.com/package/bloomfilter) package.

2. The filter's bit array is serialized as a base64 string and embedded in a JS module.

3. At runtime, a minimal ~60-line checker (FNV-1a hash + enhanced double hashing) tests membership against the decoded bit array. Only the read path ships — no write/add capability.

4. The domain list is updated weekly via GitHub Actions. When `free-email-domains` publishes a new version, filters are regenerated and a new patch is published automatically.

## Data source

Domain list: [`free-email-domains`](https://github.com/Kikobeats/free-email-domains) by Kikobeats — actively maintained, MIT licensed, ~4,800 free email domains.

## License

MIT
