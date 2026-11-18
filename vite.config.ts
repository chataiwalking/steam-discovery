import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const covers = fileURLToPath(new URL("./public/previews/", import.meta.url));
const previewRevisions = Object.fromEntries(
  readdirSync(covers).filter(name => name.endsWith(".png")).map(name => [
    path.basename(name, ".png"),
    createHash("sha256").update(readFileSync(path.join(covers, name))).digest("hex").slice(0, 12),
  ]),
);

export default defineConfig({
  define: { __PREVIEW_REVISIONS__: JSON.stringify(previewRevisions) },
  plugins: [react()],
  server:{watch:{ignored:["**/public/audio/**","**/public/previews/**","**/artifacts/**","**/test-results/**","**/playwright-report/**"]}},
  base: process.env.VITE_BASE_PATH || "/",
  build: { chunkSizeWarningLimit: 1100 },
});
