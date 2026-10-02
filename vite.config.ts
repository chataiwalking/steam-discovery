import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server:{watch:{ignored:["**/public/audio/**","**/public/previews/**","**/artifacts/**","**/test-results/**","**/playwright-report/**"]}},
  base: process.env.VITE_BASE_PATH || "/",
  build: { chunkSizeWarningLimit: 1100 },
});
