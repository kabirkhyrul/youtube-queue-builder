import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidebar: resolve(__dirname, "index.html"),
        content: resolve(__dirname, "src/content.ts"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep content and background scripts at root level for manifest
          if (chunkInfo.name === "content" || chunkInfo.name === "background") {
            return "[name].js";
          }
          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        // Ensure jQuery is bundled inline with content script
        manualChunks: undefined,
      },
      // Don't treat jQuery as external for content script
      external: (id) => {
        // Only externalize for non-content script builds
        return false;
      },
    },
    outDir: "dist",
  },
});
