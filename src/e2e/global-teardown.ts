import { readFileSync, unlinkSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { resolve } from 'path'
import { connectToTestDb, dropTestDatabase, disconnectTestDb } from './helpers/mongodb-helper'

const STATE_FILE = resolve(__dirname, '.e2e-state.json')

function killProcessTree(pid: number): void {
  try {
    // Kill the process group (negative PID kills the group)
    process.kill(-pid, 'SIGTERM')
  } catch {
    try {
      process.kill(pid, 'SIGTERM')
    } catch { /* process already dead */ }
  }
  // Give it a moment then force kill
  try {
    execSync('sleep 1')
    process.kill(-pid, 'SIGKILL')
  } catch { /* already dead */ }
}

async function globalTeardown(): Promise<void> {
  console.log('[E2E Teardown] Starting...')

  // 1. Read state file
  if (existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))

      if (state.backendPid) {
        console.log('[E2E Teardown] Stopping backend (PID:', state.backendPid, ')')
        killProcessTree(state.backendPid)
      }

      if (state.frontendPid) {
        console.log('[E2E Teardown] Stopping frontend (PID:', state.frontendPid, ')')
        killProcessTree(state.frontendPid)
      }
    } catch (err) {
      console.error('[E2E Teardown] Error reading state file:', err)
    }

    // Remove state file
    try {
      unlinkSync(STATE_FILE)
    } catch { /* ignore */ }
  }

  // 2. Drop test database
  try {
    console.log('[E2E Teardown] Dropping test database...')
    await connectToTestDb()
    await dropTestDatabase()
    await disconnectTestDb()
    console.log('[E2E Teardown] Test database dropped.')
  } catch (err) {
    console.error('[E2E Teardown] Error dropping test database:', err)
  }

  console.log('[E2E Teardown] Complete.')
}

export default globalTeardown
