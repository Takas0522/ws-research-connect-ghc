import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // Run tests serially to avoid database state conflicts between workers
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Always use a single worker so tests share the same Testcontainers database
  workers: 1,
  reporter: [["html", { open: "never", host: "0.0.0.0", port: 9323 }]],
  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // The backend must always restart so it picks up the Testcontainers
      // connection string set in globalSetup via ConnectionStrings__DefaultConnection
      command: "cd ../backend && dotnet run",
      url: "http://localhost:5010/healthz",
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "cd ../frontend && npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
