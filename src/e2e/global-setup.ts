import { spawn, execSync, type ChildProcess } from 'child_process'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import * as bcryptjs from 'bcryptjs'
import { connectToTestDb, createIndexes, seedCollection, disconnectTestDb } from './helpers/mongodb-helper'

const STATE_FILE = resolve(__dirname, '.e2e-state.json')
const BACKEND_PORT = 8000
const FRONTEND_PORT = 5174
const BACKEND_DIR = resolve(__dirname, '../backend')
const FRONTEND_DIR = resolve(__dirname, '../frontend')

function killProcessOnPort(port: number): void {
  try {
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || true`, { encoding: 'utf-8' }).trim()
    if (result) {
      const pids = result.split('\n').filter(Boolean)
      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid} 2>/dev/null || true`)
        } catch { /* ignore */ }
      }
      // Wait briefly for port to be released
      execSync('sleep 1')
    }
  } catch { /* ignore */ }
}

async function waitForServer(url: string, timeoutMs: number = 60_000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch { /* server not ready yet */ }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`)
}

async function globalSetup(): Promise<void> {
  console.log('[E2E Setup] Starting...')

  // 1. Connect to test DB and set up indexes
  console.log('[E2E Setup] Connecting to MongoDB test database...')
  const db = await connectToTestDb()

  // Drop existing test data
  await db.dropDatabase()
  const freshDb = await connectToTestDb()
  await createIndexes()

  // 2. Seed users with bcrypt-hashed passwords
  console.log('[E2E Setup] Seeding test users...')
  const adminHash = bcryptjs.hashSync('admin123', 10)
  const salesHash = bcryptjs.hashSync('sales123', 10)
  const now = new Date()

  await seedCollection('users', [
    {
      email: 'admin@example.com',
      password_hash: adminHash,
      display_name: '管理者',
      role: 'admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      email: 'sales@example.com',
      password_hash: salesHash,
      display_name: '営業担当',
      role: 'sales',
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ])

  await disconnectTestDb()

  // 3. Kill any processes on target ports
  console.log('[E2E Setup] Clearing ports...')
  killProcessOnPort(BACKEND_PORT)
  killProcessOnPort(FRONTEND_PORT)

  // 4. Start backend
  console.log('[E2E Setup] Starting backend on port', BACKEND_PORT)
  const backendProc = spawn(
    'uv',
    ['run', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', String(BACKEND_PORT)],
    {
      cwd: BACKEND_DIR,
      env: {
        ...process.env,
        MONGO_URI: 'mongodb://localhost:27017',
        DATABASE_NAME: 'saas_management_e2e_test',
        SECRET_KEY: 'dev-secret-key-change-in-production-must-be-at-least-32-chars-long',
        CORS_ORIGINS: '["http://localhost:5174","http://localhost:5173"]',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    }
  )

  backendProc.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) console.log(`[Backend] ${msg}`)
  })
  backendProc.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) console.log(`[Backend] ${msg}`)
  })

  // 5. Start frontend
  console.log('[E2E Setup] Starting frontend on port', FRONTEND_PORT)
  const frontendProc = spawn(
    'npx',
    ['vite', '--port', String(FRONTEND_PORT), '--strictPort'],
    {
      cwd: FRONTEND_DIR,
      env: {
        ...process.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    }
  )

  frontendProc.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) console.log(`[Frontend] ${msg}`)
  })
  frontendProc.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) console.log(`[Frontend] ${msg}`)
  })

  // 6. Save state for teardown
  const state = {
    backendPid: backendProc.pid,
    frontendPid: frontendProc.pid,
  }
  writeFileSync(STATE_FILE, JSON.stringify(state))

  // 7. Wait for servers to be ready
  console.log('[E2E Setup] Waiting for backend to be ready...')
  await waitForServer(`http://localhost:${BACKEND_PORT}/health`, 60_000)
  console.log('[E2E Setup] Backend is ready.')

  console.log('[E2E Setup] Waiting for frontend to be ready...')
  await waitForServer(`http://localhost:${FRONTEND_PORT}`, 60_000)
  console.log('[E2E Setup] Frontend is ready.')

  console.log('[E2E Setup] All servers started successfully.')
}

export default globalSetup
