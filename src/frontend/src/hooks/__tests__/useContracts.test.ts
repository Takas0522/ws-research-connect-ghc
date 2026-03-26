import { renderHook, waitFor } from '@testing-library/react'
import { useContracts } from '../useContracts'

vi.mock('../../api/contracts', () => ({
  fetchContracts: vi.fn(),
  createContract: vi.fn(),
  updateContract: vi.fn(),
}))

import { fetchContracts, createContract, updateContract } from '../../api/contracts'

const mockedFetchContracts = vi.mocked(fetchContracts)
const mockedCreateContract = vi.mocked(createContract)
const mockedUpdateContract = vi.mocked(updateContract)

beforeEach(() => {
  vi.clearAllMocks()
})

const mockContract = {
  id: '1',
  customer_id: 'c1',
  product_id: 'p1',
  current_plan_id: 'pl1',
  contract_start_date: '2024-01-01',
  contract_end_date: null,
  contract_renewal_date: '2025-01-01',
  license_count: 10,
  status: 'active' as const,
  primary_use_case: 'sales_ops' as const,
  customer_name: 'Test Customer',
  product_name: 'Test Product',
  plan_name: 'Basic',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('useContracts', () => {
  test('fetches contracts on mount', async () => {
    mockedFetchContracts.mockResolvedValueOnce([mockContract])

    const { result } = renderHook(() => useContracts())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.contracts).toEqual([mockContract])
    expect(result.current.error).toBeNull()
  })

  test('handles fetch error', async () => {
    mockedFetchContracts.mockRejectedValueOnce(new Error('Fetch failed'))

    const { result } = renderHook(() => useContracts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Fetch failed')
    expect(result.current.contracts).toEqual([])
  })

  test('handles non-Error rejection', async () => {
    mockedFetchContracts.mockRejectedValueOnce(42)

    const { result } = renderHook(() => useContracts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('契約の取得に失敗しました')
  })

  test('addContract creates and refetches', async () => {
    mockedFetchContracts.mockResolvedValueOnce([])
    mockedCreateContract.mockResolvedValueOnce(mockContract)
    mockedFetchContracts.mockResolvedValueOnce([mockContract])

    const { result } = renderHook(() => useContracts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const input = {
      customer_id: 'c1',
      product_id: 'p1',
      current_plan_id: 'pl1',
      contract_start_date: '2024-01-01',
      contract_renewal_date: '2025-01-01',
      license_count: 10,
      primary_use_case: 'sales_ops' as const,
    }

    await waitFor(async () => {
      await result.current.addContract(input)
    })

    expect(mockedCreateContract).toHaveBeenCalledWith(input)
  })

  test('editContract updates and refetches', async () => {
    mockedFetchContracts.mockResolvedValueOnce([mockContract])
    mockedUpdateContract.mockResolvedValueOnce({ ...mockContract, license_count: 20 })
    mockedFetchContracts.mockResolvedValueOnce([{ ...mockContract, license_count: 20 }])

    const { result } = renderHook(() => useContracts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await waitFor(async () => {
      await result.current.editContract('1', { license_count: 20 })
    })

    expect(mockedUpdateContract).toHaveBeenCalledWith('1', { license_count: 20 })
  })

  test('refetch works', async () => {
    mockedFetchContracts.mockResolvedValueOnce([])

    const { result } = renderHook(() => useContracts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    mockedFetchContracts.mockResolvedValueOnce([mockContract])

    await waitFor(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.contracts).toEqual([mockContract])
    })
  })
})
