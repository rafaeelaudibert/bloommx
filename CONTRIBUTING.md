# Contributing to bloommx

## Setup

```bash
git clone https://github.com/posthog/bloommx.git
cd bloommx
bun install
```

## Development

### Regenerate bloom filter data

```bash
bun run generate
```

This reads `free-email-domains` and produces the `generated/*.ts` files for all 4 tiers.

### Build

```bash
bun run build
```

Runs `generate` then compiles TypeScript to `dist/`.

### Test

```bash
bun test
```

Tests cover:
- Known free domains return `true` across all tiers
- Known corporate domains return `false`
- Email parsing and case insensitivity
- Invalid input handling
- Zero false negatives (every domain in the source list)
- False positive rate within expected bounds per tier

## Project structure

```
src/bloom.ts          # Minimal bloom filter runtime (~60 lines)
src/index.ts          # Default export (re-exports balanced tier)
src/{micro,compact,balanced,precise}.ts  # Tier entry points
generated/*.ts        # Auto-generated filter data (committed)
scripts/generate.ts   # Build script that produces generated/*.ts
test/bloom.test.ts    # Tests
```

## How updates work

A weekly GitHub Actions cron job checks for new versions of `free-email-domains`. If a new version exists, it:

1. Updates the dependency
2. Regenerates all bloom filter data
3. Runs tests
4. Creates a changeset, bumps the version
5. Publishes to npm

## Adding a new tier

1. Add the tier config in `scripts/generate.ts` (name + FP rate)
2. Create `src/<tier>.ts` following the same pattern as existing tiers
3. Add the subpath export to `package.json`
4. Add tests

## Release

We use [changesets](https://github.com/changesets/changesets) for version management:

```bash
bun run changeset    # Create a changeset
bun run version      # Bump version + update CHANGELOG
bun run release      # Build + publish
```
