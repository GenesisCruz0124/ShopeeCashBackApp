import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@shopee-cashback/shared": path.resolve(__dirname, "../packages/shared/src/index.ts"),
    },
  },
});
