import { fileURLToPath, URL } from "node:url";

import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["@lingui/babel-plugin-lingui-macro", "babel-plugin-react-compiler"],
      },
    }),
    lingui(),
  ],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173 },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        // vendor libraries in their own long-cached files; KaTeX only ships with the table chunk
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (id.includes("node_modules/katex/")) return "katex";
          if (id.includes("node_modules/@supabase/")) return "supabase";
          if (/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(id)) return "motion";
          return "vendor";
        },
      },
    },
  },
});
