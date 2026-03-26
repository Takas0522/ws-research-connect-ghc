import { connectToTestDb, getDb, disconnectTestDb } from './mongodb-helper'

export async function setupTestDb(): Promise<void> {
  await connectToTestDb()
}

export async function cleanupTestData(): Promise<void> {
  const db = getDb()
  const collections = await db.listCollections().toArray()
  for (const col of collections) {
    if (col.name !== 'users') {
      await db.collection(col.name).deleteMany({})
    }
  }
}

export async function teardownTestDb(): Promise<void> {
  await disconnectTestDb()
}
