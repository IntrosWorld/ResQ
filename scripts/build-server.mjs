/**
 * Pre-bundles src/server/index.ts into api/_server.js before Vercel deployment.
 *
 * Why: Vercel's @vercel/node with "type":"module" in package.json only transpiles
 * api/[...path].ts — it does NOT bundle relative imports outside api/. So
 * src/server/index never ends up at /var/task/src/server/index and the runtime
 * throws ERR_MODULE_NOT_FOUND.
 *
 * This script uses esbuild (already installed via Vite) to create a single
 * self-contained ESM bundle at api/_server.js. The underscore prefix tells
 * Vercel not to treat it as a separate serverless function.
 */

import { build } from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [resolve(root, "src/server/index.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  outfile: resolve(root, "api/_server.js"),
  // Keep npm packages external — Vercel installs node_modules from package.json.
  // Only src/ files (shared, cad, store, validation) are bundled inline.
  packages: "external",
  // Silence the import.meta.url warning — we've already replaced it with process.cwd()
  logLevel: "info",
});

console.log("✓ Server bundle written to api/_server.js");
