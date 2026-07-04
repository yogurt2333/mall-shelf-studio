import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const systemChromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    launchOptions: existsSync(systemChromePath)
      ? {
          executablePath: systemChromePath,
        }
      : undefined,
  },
});
