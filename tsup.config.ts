import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/icon-morph/index.ts",
    "src/glyph-morph/index.ts",
    "src/react/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  minify: true,
  // React is a peer dependency, fontkit a runtime dependency — never bundle them
  // (fontkit is loaded via a dynamic import inside glyph-morph only).
  external: ["react", "react-dom", "fontkit"],
});
