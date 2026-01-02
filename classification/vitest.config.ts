import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: __dirname, // 🔥 DAS ist der entscheidende Fix
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"]
  },
  resolve: {
    alias: {
      "@resolver": path.resolve(__dirname, "src/resolver")
    }
  }
});
