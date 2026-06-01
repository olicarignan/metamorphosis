import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The demo imports the library straight from ../src (TS/TSX), so allow Vite to
  // read one level up, and dedupe React to a single copy (the library lists it
  // as a peer dep and would otherwise resolve its own).
  resolve: { dedupe: ["react", "react-dom"] },
  server: { fs: { allow: [".."] } },
});
