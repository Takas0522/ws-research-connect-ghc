import { renderHook, waitFor } from '@testing-library/react'
import { useDashboard } from '../useDashboard'

vi.mock('../../api/dashboard', () => ({
  fetchUsageSummary: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchUseCaseSummary: vi.fn(),
  fetchLastUpdated: vi.fn(),
}))

import {
  fetchUsageSummary,
  fetchAlerts,
  fetchUseCaseSummary,
  fetchLastUpdated,
} from '../../api/dashboard'

const mockedFetchUsageSummary = vi.mocked(fetchUsageSummary)
const mockedFetchAlerts = vi.mocked(fetchAlerts)
const mockedFetchUseCaseSummary = vi.mocked(fetchUseCaseSummary)
const mockedFetchLastUpdated = vi.mocked(fetchLastUpdated)

beforeEach(() => {
  vi.clearAllMocks()
})

const mockSummary = [
  {
    customer_id: 'c1',
    customer_name: 'Customer A',
    product_id: 'p1',
    product_name: 'Product A',
    plan_name: 'Basic',
    billing_month: '2024-01',
    metrics: [
      { metric_code: 'users', actual_value: 80, limit_value: 100, usage_rate: 80, overage_fee: 0 },
    ],
    alert_threshold_pct: 80,
    has_alert: true,
  },
]

const mockAlerts = [
  {
    customer_name: 'Customer A',
    product_name: 'Product A',
    metric_code: 'users',
    billing_month: '2024-01',
    usage_rate: 85,
    limit_value: 100,
    actual_value: 85,
    alert_threshold_pct: 80,
  },
]

const mockUseCaseSummary = [
  { use_case: 'sales_ops', count: 5, label: '営業支援' },
]

describe('useDashboard', () => {
  test('fetches all dashboard data on mount', async () => {
    mockedFetchUsageSummary.mockResolvedValueOnce(mockSummary)
    mockedFetchAlerts.mockResolvedValueOnce(mockAlerts)
    mockedFetchUseCaseSummary.mockResolvedValueOnce(mockUseCaseSummary)
    mockedFetchLastUpdated.mockResolvedValueOnce({ last_updated: '2024-01-15T10:00:00Z' })

    const { result } = renderHook(() => useDashboard())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.summary).toEqual(mockSummary)
    expect(result.current.alerts).toEqual(mockAlerts)
    expect(result.current.useCaseSummary).toEqual(mockUseCaseSummary)
    expect(result.current.lastUpdated).toBe('2024-01-15T10:00:00Z')
    expect(result.current.error).toBeNull()
  })

  test('handles fetch error', async () => {
    mockedFetchUsageSummary.mockRejectedValueOnce(new Error('Dashboard error'))
    mockedFetchAlerts.mockResolvedValueOnce([])
    mockedFetchUseCaseSummary.mockResolvedValueOnce([])
    mockedFetchLastUpdated.mockResolvedValueOnce({ last_updated: null })

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Dashboard error')
  })

  test('handles non-Error rejection', async () => {
    mockedFetchUsageSummary.mockRejectedValueOnce('fail')
    mockedFetchAlerts.mockResolvedValueOnce([])
    mockedFetchUseCaseSummary.mockResolvedValueOnce([])
    mockedFetchLastUpdated.mockResolvedValueOnce({ last_updated: null })

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('データの取得に失敗しました')
  })

  test('refetch works', async () => {
    mockedFetchUsageSummary.mockResolvedValueOnce([])
    mockedFetchAlerts.mockResolvedValueOnce([])
    mockedFetchUseCaseSummary.mockResolvedValueOnce([])
    mockedFetchLastUpdated.mockResolvedValueOnce({ last_updated: null })

    const { result } = renderHook(() => useDashboard())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.summary).toEqual([])

    mockedFetchUsageSummary.mockResolvedValueOnce(mockSummary)
    mockedFetchAlerts.mockResolvedValueOnce(mockAlerts)
    mockedFetchUseCaseSummary.mockResolvedValueOnce(mockUseCaseSummary)
    mockedFetchLastUpdated.mockResolvedValueOnce({ last_updated: '2024-02-01T00:00:00Z' })

    await waitFor(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.summary).toEqual(mockSummary)
    })
  })
})
