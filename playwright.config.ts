import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "off",
  },
  webServer: {
    command: "pnpm build && pnpm exec next start -p 3100",
    url: "http://127.0.0.1:3100/",
    reuseExistingServer: false,
    timeout: 300000,
  },
});
