import { Client } from 'pg';
import * as fs from 'fs';

/**
 * Restores the database to the seeded snapshot state.
 * Truncates all tables and re-inserts seed data.
 * Call this inside each test's beforeEach for full isolation.
 */
export async function resetDatabase(): Promise<void> {
  const host = process.env['TEST_DB_HOST'] ?? 'localhost';
  const port = parseInt(process.env['TEST_DB_PORT'] ?? '5432', 10);
  const database = process.env['TEST_DB_NAME'] ?? 'appdb';
  const user = process.env['TEST_DB_USER'] ?? 'postgres';
  const password = process.env['TEST_DB_PASSWORD'] ?? 'postgres';

  const client = new Client({ host, port, database, user, password });
  await client.connect();

  // Truncate in dependency order (children first, parents last)
  await client.query(
    'TRUNCATE TABLE monthly_usages, contract_histories, trials, contracts, plans, customers, products CASCADE',
  );

  // Re-insert seed data
  const seedPath = process.env['TEST_SEED_SQL_PATH'];
  if (!seedPath) throw new Error('TEST_SEED_SQL_PATH is not set');

  const seedSQL = fs.readFileSync(seedPath, 'utf-8');
  await client.query(seedSQL);

  await client.end();
}
