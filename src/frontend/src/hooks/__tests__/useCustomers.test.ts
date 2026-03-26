import { renderHook, waitFor } from '@testing-library/react'
import { useCustomers } from '../useCustomers'

vi.mock('../../api/customers', () => ({
  fetchCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}))

import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/customers'

const mockedFetchCustomers = vi.mocked(fetchCustomers)
const mockedCreateCustomer = vi.mocked(createCustomer)
const mockedUpdateCustomer = vi.mocked(updateCustomer)
const mockedDeleteCustomer = vi.mocked(deleteCustomer)

beforeEach(() => {
  vi.clearAllMocks()
})

const mockCustomer = {
  id: '1',
  customer_code: 'C001',
  customer_name: 'Test Customer',
  assigned_sales_user_id: null,
  contact_person: null,
  notes: null,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('useCustomers', () => {
  test('fetches customers on mount', async () => {
    mockedFetchCustomers.mockResolvedValueOnce([mockCustomer])

    const { result } = renderHook(() => useCustomers())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.customers).toEqual([mockCustomer])
    expect(result.current.error).toBeNull()
  })

  test('handles fetch error', async () => {
    mockedFetchCustomers.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useCustomers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('API Error')
    expect(result.current.customers).toEqual([])
  })

  test('handles non-Error rejection', async () => {
    mockedFetchCustomers.mockRejectedValueOnce('unknown')

    const { result } = renderHook(() => useCustomers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('顧客の取得に失敗しました')
  })

  test('addCustomer creates and refetches', async () => {
    mockedFetchCustomers.mockResolvedValueOnce([])
    mockedCreateCustomer.mockResolvedValueOnce(mockCustomer)
    mockedFetchCustomers.mockResolvedValueOnce([mockCustomer])

    const { result } = renderHook(() => useCustomers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await waitFor(async () => {
      await result.current.addCustomer({
        customer_code: 'C001',
        customer_name: 'Test Customer',
      })
    })

    expect(mockedCreateCustomer).toHaveBeenCalled()
    await waitFor(() => {
      expect(result.current.customers).toEqual([mockCustomer])
    })
  })

  test('editCustomer updates and refetches', async () => {
    mockedFetchCustomers.mockResolvedValueOnce([mockCustomer])
    const updated = { ...mockCustomer, customer_name: 'Updated' }
    mockedUpdateCustomer.mockResolvedValueOnce(updated)
    mockedFetchCustomers.mockResolvedValueOnce([updated])

    const { result } = renderHook(() => useCustomers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await waitFor(async () => {
      await result.current.editCustomer('1', { customer_name: 'Updated' })
    })

    expect(mockedUpdateCustomer).toHaveBeenCalledWith('1', { customer_name: 'Updated' })
  })

  test('removeCustomer deletes and refetches', async () => {
    mockedFetchCustomers.mockResolvedValueOnce([mockCustomer])
    mockedDeleteCustomer.mockResolvedValueOnce()
    mockedFetchCustomers.mockResolvedValueOnce([])

    const { result } = renderHook(() => useCustomers())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await waitFor(async () => {
      await result.current.removeCustomer('1')
    })

    expect(mockedDeleteCustomer).toHaveBeenCalledWith('1')
  })
})
