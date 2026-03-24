import { defineConfig, devices } from "@playwright/test";

// Fixed port for the Testcontainers PostgreSQL database.
// globalSetup starts a PostgreSQL container bound to this host port so that
// the backend web server (which starts before globalSetup) can establish its
// connection string at config-parse time rather than at runtime.
const E2E_DB_PORT = 54320;
const E2E_DB_CONN =
  `Host=localhost;Port=${E2E_DB_PORT};Database=appdb;Username=postgres;Password=postgres`;

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
      // Pass the Testcontainers connection string directly to the backend process.
      // The backend web server starts before globalSetup, but the .NET app only
      // establishes the DB connection lazily (on first query), so the server
      // health check succeeds even before the container is ready.
      command: "cd ../backend && dotnet run",
      url: "http://localhost:5010/healthz",
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ConnectionStrings__DefaultConnection: E2E_DB_CONN,
        // Expose DB details for the resetDatabase() helper in test workers
        TEST_DB_PORT: String(E2E_DB_PORT),
        TEST_DB_HOST: "localhost",
        TEST_DB_NAME: "appdb",
        TEST_DB_USER: "postgres",
        TEST_DB_PASSWORD: "postgres",
      },
    },
    {
      command: "cd ../frontend && npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
