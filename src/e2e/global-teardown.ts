import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';

async function globalTeardown(): Promise<void> {
  const container = (globalThis as Record<string, unknown>)[
    '__E2E_PG_CONTAINER__'
  ] as StartedPostgreSqlContainer | undefined;

  if (container) {
    await container.stop();
  }
}

export default globalTeardown;
