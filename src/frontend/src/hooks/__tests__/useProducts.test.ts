import { renderHook, waitFor } from '@testing-library/react'
import { useProducts } from '../useProducts'

vi.mock('../../api/products', () => ({
  fetchProducts: vi.fn(),
}))

import { fetchProducts } from '../../api/products'

const mockedFetchProducts = vi.mocked(fetchProducts)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useProducts', () => {
  test('fetches products on mount', async () => {
    const mockProducts = [
      {
        id: '1',
        product_code: 'P001',
        product_name: 'Test Product',
        category: 'CRM',
        vendor: 'Vendor A',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]
    mockedFetchProducts.mockResolvedValueOnce(mockProducts)

    const { result } = renderHook(() => useProducts())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.products).toEqual(mockProducts)
    expect(result.current.error).toBeNull()
  })

  test('sets loading state correctly', async () => {
    mockedFetchProducts.mockResolvedValueOnce([])

    const { result } = renderHook(() => useProducts())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.products).toEqual([])
  })

  test('handles fetch error', async () => {
    mockedFetchProducts.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.products).toEqual([])
  })

  test('handles non-Error rejection', async () => {
    mockedFetchProducts.mockRejectedValueOnce('string error')

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('取得に失敗しました')
  })

  test('refetch works', async () => {
    mockedFetchProducts.mockResolvedValueOnce([])

    const { result } = renderHook(() => useProducts())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const updatedProducts = [
      {
        id: '2',
        product_code: 'P002',
        product_name: 'New Product',
        category: 'Analytics',
        vendor: 'Vendor B',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]
    mockedFetchProducts.mockResolvedValueOnce(updatedProducts)

    await waitFor(async () => {
      await result.current.refetch()
    })

    await waitFor(() => {
      expect(result.current.products).toEqual(updatedProducts)
    })
  })
})
