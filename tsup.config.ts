import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    micro: "src/micro.ts",
    compact: "src/compact.ts",
    balanced: "src/balanced.ts",
    precise: "src/precise.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
});
