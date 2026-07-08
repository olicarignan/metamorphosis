import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

// The demo imports the library straight from ../src (TS/TSX), where glyph-morph
// lazy-loads `fontkit` via a dynamic import. Vercel builds this app from /demo and
// only installs demo/node_modules, but that import lives in the repo-root src/ —
// Rollup resolves it by walking up from there and never reaches demo/node_modules,
// so the bare "fontkit" specifier fails to resolve on Vercel. Pin it to the copy
// installed for this app. We alias to the package directory (not a file) so Vite
// still applies fontkit's own `exports` and picks its browser build.
const require = createRequire(import.meta.url);
let fontkitDir = dirname(require.resolve("fontkit"));
while (
  !existsSync(join(fontkitDir, "package.json")) &&
  fontkitDir !== dirname(fontkitDir)
) {
  fontkitDir = dirname(fontkitDir);
}

export default defineConfig({
  plugins: [react()],
  // The demo imports the library straight from ../src (TS/TSX), so allow Vite to
  // read one level up, and dedupe React to a single copy (the library lists it
  // as a peer dep and would otherwise resolve its own).
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: { fontkit: fontkitDir },
  },
  server: { fs: { allow: [".."] } },
});
