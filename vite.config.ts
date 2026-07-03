import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["react-markdown", "@tanstack/react-query"],
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip",
            "framer-motion",
            "lucide-react",
            "tailwind-merge",
            "class-variance-authority",
            "clsx",
          ],
          "editor": [
            "@monaco-editor/react",
            "react-markdown",
            "react-syntax-highlighter",
          ],
          "pdf": ["jspdf", "html2canvas"],
          charts: ["recharts"],
        },
      },
    },
  },
}));
