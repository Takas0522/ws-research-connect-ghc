import type { FullConfig } from '@playwright/test';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Must match the fixed port configured in playwright.config.ts webServer.env
const E2E_DB_PORT = 54320;

async function globalSetup(_config: FullConfig): Promise<void> {
  // Start PostgreSQL on a fixed host port so that the backend web server
  // (which starts before globalSetup) can use a static connection string.
  const container = await new PostgreSqlContainer('postgres:17')
    .withDatabase('appdb')
    .withUsername('postgres')
    .withPassword('postgres')
    .withExposedPorts({ container: 5432, host: E2E_DB_PORT })
    .start();

  // Store the container reference for global teardown (same process)
  (globalThis as Record<string, unknown>)['__E2E_PG_CONTAINER__'] = container;

  // Expose DB connection details for test workers (resetDatabase helper)
  // Note: these are distinct from the backend webServer env vars set in playwright.config.ts
  process.env['TEST_DB_HOST'] = 'localhost';
  process.env['TEST_DB_PORT'] = String(E2E_DB_PORT);
  process.env['TEST_DB_NAME'] = 'appdb';
  process.env['TEST_DB_USER'] = 'postgres';
  process.env['TEST_DB_PASSWORD'] = 'postgres';
  process.env['TEST_SEED_SQL_PATH'] = path.join(__dirname, 'fixtures/seed.sql');

  // Apply schema and seed data to the Testcontainers database
  const client = new Client({
    host: 'localhost',
    port: E2E_DB_PORT,
    database: 'appdb',
    user: 'postgres',
    password: 'postgres',
  });

  await client.connect();

  const schemaSQL = fs.readFileSync(
    path.join(__dirname, '../database/init/001_init.sql'),
    'utf-8',
  );
  await client.query(schemaSQL);

  const seedSQL = fs.readFileSync(
    path.join(__dirname, 'fixtures/seed.sql'),
    'utf-8',
  );
  await client.query(seedSQL);

  await client.end();
}

export default globalSetup;
