import type { FullConfig } from '@playwright/test';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(_config: FullConfig): Promise<void> {
  const container = await new PostgreSqlContainer('postgres:17')
    .withDatabase('appdb')
    .withUsername('postgres')
    .withPassword('postgres')
    .start();

  const port = container.getMappedPort(5432);
  const host = container.getHost();

  // Store the container reference for global teardown (same process)
  (globalThis as Record<string, unknown>)['__E2E_PG_CONTAINER__'] = container;

  // Expose DB connection details for test workers and the backend web server
  process.env['TEST_DB_HOST'] = host;
  process.env['TEST_DB_PORT'] = String(port);
  process.env['TEST_DB_NAME'] = 'appdb';
  process.env['TEST_DB_USER'] = 'postgres';
  process.env['TEST_DB_PASSWORD'] = 'postgres';

  // Override the .NET backend connection string so the backend web server
  // (started after globalSetup) connects to the Testcontainers database.
  process.env['ConnectionStrings__DefaultConnection'] =
    `Host=${host};Port=${port};Database=appdb;Username=postgres;Password=postgres`;

  // Apply schema and seed data
  const client = new Client({
    host,
    port,
    database: 'appdb',
    user: 'postgres',
    password: 'postgres',
  });

  await client.connect();

  const schemaSQL = fs.readFileSync(
    path.join(__dirname, '../../database/init/001_init.sql'),
    'utf-8',
  );
  await client.query(schemaSQL);

  const seedSQL = fs.readFileSync(
    path.join(__dirname, '../fixtures/seed.sql'),
    'utf-8',
  );
  await client.query(seedSQL);

  await client.end();

  // Persist the seed SQL path so test workers can reset the database
  process.env['TEST_SEED_SQL_PATH'] = path.join(__dirname, '../fixtures/seed.sql');
  process.env['TEST_SCHEMA_SQL_PATH'] = path.join(
    __dirname,
    '../../database/init/001_init.sql',
  );
}

export default globalSetup;
