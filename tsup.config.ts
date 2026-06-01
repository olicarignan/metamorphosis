import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/react/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  minify: true,
  // React is a peer dependency — never bundle it.
  external: ["react", "react-dom"],
});
