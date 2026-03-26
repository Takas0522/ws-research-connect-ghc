import { MongoClient, type Db, type Collection, ObjectId } from 'mongodb'

const MONGO_URI = 'mongodb://localhost:27017'
const TEST_DB_NAME = 'saas_management_e2e_test'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectToTestDb(): Promise<Db> {
  if (db) return db
  client = new MongoClient(MONGO_URI)
  await client.connect()
  db = client.db(TEST_DB_NAME)
  return db
}

export function getDb(): Db {
  if (!db) throw new Error('Test DB not connected. Call connectToTestDb() first.')
  return db
}

export async function disconnectTestDb(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}

export async function dropTestDatabase(): Promise<void> {
  if (db) {
    await db.dropDatabase()
  }
}

export async function clearAllCollections(): Promise<void> {
  if (!db) throw new Error('Test DB not connected.')
  const collections = await db.listCollections().toArray()
  for (const col of collections) {
    await db.collection(col.name).deleteMany({})
  }
}

export async function clearCollection(name: string): Promise<void> {
  if (!db) throw new Error('Test DB not connected.')
  await db.collection(name).deleteMany({})
}

export async function seedCollection(
  collectionName: string,
  documents: Record<string, unknown>[]
): Promise<void> {
  if (!db) throw new Error('Test DB not connected.')
  if (documents.length === 0) return
  const col = db.collection(collectionName)
  await col.insertMany(documents)
}

export async function createIndexes(): Promise<void> {
  if (!db) throw new Error('Test DB not connected.')

  await db.collection('users').createIndex({ email: 1 }, { unique: true })
  await db.collection('products').createIndex({ product_code: 1 }, { unique: true })
  await db.collection('metrics_definitions').createIndex(
    { product_id: 1, metric_code: 1 },
    { unique: true }
  )
  await db.collection('plans').createIndex(
    { product_id: 1, plan_code: 1 },
    { unique: true }
  )
  await db.collection('customers').createIndex({ customer_code: 1 }, { unique: true })
  await db.collection('customers').createIndex({ assigned_sales_user_id: 1 })
  await db.collection('contracts').createIndex({ customer_id: 1, product_id: 1, status: 1 })
  await db.collection('contract_plan_history').createIndex({ contract_id: 1 })
  await db.collection('monthly_usage').createIndex(
    { contract_id: 1, billing_month: 1, metric_code: 1 },
    { unique: true }
  )
  await db.collection('usage_imports').createIndex({ billing_month: 1, status: 1 })
  await db.collection('audit_logs').createIndex({ created_at: -1 })
  await db.collection('audit_logs').createIndex({ resource_type: 1, resource_id: 1 })
}

export { ObjectId }
