import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from '../useAuth'

// Mock the API modules
vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
}))

vi.mock('../../api/client', () => ({
  setToken: vi.fn(),
  removeToken: vi.fn(),
  getToken: vi.fn(() => null),
}))

import { login as apiLogin, fetchCurrentUser } from '../../api/auth'
import { setToken, removeToken, getToken } from '../../api/client'

const mockedApiLogin = vi.mocked(apiLogin)
const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser)
const mockedGetToken = vi.mocked(getToken)
const mockedSetToken = vi.mocked(setToken)
const mockedRemoveToken = vi.mocked(removeToken)

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetToken.mockReturnValue(null)
})

describe('useAuth', () => {
  test('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    )
    spy.mockRestore()
  })

  test('initial state has no user and loading becomes false', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('restores session when token exists', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      display_name: 'Admin',
      role: 'admin' as const,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
    mockedGetToken.mockReturnValue('existing-token')
    mockedFetchCurrentUser.mockResolvedValueOnce(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  test('removes token when session restore fails', async () => {
    mockedGetToken.mockReturnValue('expired-token')
    mockedFetchCurrentUser.mockRejectedValueOnce(new Error('Unauthorized'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockedRemoveToken).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('login sets user and token', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      display_name: 'Admin',
      role: 'admin' as const,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
    mockedApiLogin.mockResolvedValueOnce({
      access_token: 'new-token',
      token_type: 'bearer',
    })
    mockedFetchCurrentUser.mockResolvedValueOnce(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.login('admin@test.com', 'password')
    })

    expect(mockedApiLogin).toHaveBeenCalledWith('admin@test.com', 'password')
    expect(mockedSetToken).toHaveBeenCalledWith('new-token')
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  test('logout clears user and token', async () => {
    const mockUser = {
      id: '1',
      email: 'admin@test.com',
      display_name: 'Admin',
      role: 'admin' as const,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
    mockedGetToken.mockReturnValue('existing-token')
    mockedFetchCurrentUser.mockResolvedValueOnce(mockUser)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    act(() => {
      result.current.logout()
    })

    expect(mockedRemoveToken).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })
})
