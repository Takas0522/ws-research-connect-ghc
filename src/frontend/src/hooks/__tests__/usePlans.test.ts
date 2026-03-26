import { renderHook, waitFor } from '@testing-library/react'
import { usePlans } from '../usePlans'

vi.mock('../../api/plans', () => ({
  fetchPlans: vi.fn(),
}))

import { fetchPlans } from '../../api/plans'

const mockedFetchPlans = vi.mocked(fetchPlans)

beforeEach(() => {
  vi.clearAllMocks()
})

const mockPlan = {
  id: '1',
  product_id: 'p1',
  plan_code: 'PL001',
  plan_name: 'Basic Plan',
  monthly_base_fee: 10000,
  alert_threshold_pct: 80,
  metric_limits: [
    { metric_code: 'users', limit_value: 100, overage_unit_price: 500 },
  ],
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('usePlans', () => {
  test('returns empty plans when productId is null', async () => {
    const { result } = renderHook(() => usePlans(null))

    // loading starts as false when productId is null
    expect(result.current.loading).toBe(false)
    expect(result.current.plans).toEqual([])
    expect(mockedFetchPlans).not.toHaveBeenCalled()
  })

  test('fetches plans when productId is provided', async () => {
    mockedFetchPlans.mockResolvedValueOnce([mockPlan])

    const { result } = renderHook(() => usePlans('p1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockedFetchPlans).toHaveBeenCalledWith('p1')
    expect(result.current.plans).toEqual([mockPlan])
    expect(result.current.error).toBeNull()
  })

  test('handles fetch error', async () => {
    mockedFetchPlans.mockRejectedValueOnce(new Error('Plan fetch failed'))

    const { result } = renderHook(() => usePlans('p1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Plan fetch failed')
    expect(result.current.plans).toEqual([])
  })

  test('refetches when productId changes', async () => {
    mockedFetchPlans.mockResolvedValueOnce([mockPlan])

    const { result, rerender } = renderHook(
      ({ productId }: { productId: string | null }) => usePlans(productId),
      { initialProps: { productId: 'p1' } },
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.plans).toEqual([mockPlan])

    const newPlan = { ...mockPlan, id: '2', plan_code: 'PL002', product_id: 'p2' }
    mockedFetchPlans.mockResolvedValueOnce([newPlan])

    rerender({ productId: 'p2' })

    await waitFor(() => {
      expect(result.current.plans).toEqual([newPlan])
    })

    expect(mockedFetchPlans).toHaveBeenCalledWith('p2')
  })

  test('refetch works', async () => {
    mockedFetchPlans.mockResolvedValueOnce([])

    const { result } = renderHook(() => usePlans('p1'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    mockedFetchPlans.mockResolvedValueOnce([mockPlan])

    await waitFor(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.plans).toEqual([mockPlan])
    })
  })
})
