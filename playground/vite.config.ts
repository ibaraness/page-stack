import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Develop against the library source for instant HMR (no build needed).
      "@ibaraness/page-stack": fileURLToPath(
        new URL("../src/index.ts", import.meta.url)
      ),
    },
  },
});
