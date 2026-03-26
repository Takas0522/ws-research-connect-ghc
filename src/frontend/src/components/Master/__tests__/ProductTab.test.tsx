import { render, screen } from '@testing-library/react'
import { ProductTab } from '../ProductTab'

vi.mock('../../../hooks/useProducts', () => ({
  useProducts: vi.fn(),
}))

vi.mock('../../../api/products', () => ({
  deleteProduct: vi.fn(),
}))

// Mock ProductForm to avoid rendering complex modal
vi.mock('../ProductForm', () => ({
  ProductForm: () => null,
}))

import { useProducts } from '../../../hooks/useProducts'

const mockedUseProducts = vi.mocked(useProducts)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProductTab', () => {
  test('shows loading state', () => {
    mockedUseProducts.mockReturnValue({
      products: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<ProductTab />)

    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  test('shows error state', () => {
    mockedUseProducts.mockReturnValue({
      products: [],
      loading: false,
      error: '取得に失敗しました',
      refetch: vi.fn(),
    })

    render(<ProductTab />)

    expect(screen.getByText('取得に失敗しました')).toBeInTheDocument()
    expect(screen.getByText('再試行')).toBeInTheDocument()
  })

  test('shows empty state', () => {
    mockedUseProducts.mockReturnValue({
      products: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ProductTab />)

    expect(screen.getByText('製品が登録されていません')).toBeInTheDocument()
  })

  test('renders product list', () => {
    mockedUseProducts.mockReturnValue({
      products: [
        {
          id: '1',
          product_code: 'P001',
          product_name: 'Salesforce',
          category: 'CRM',
          vendor: 'Salesforce Inc.',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          product_code: 'P002',
          product_name: 'Slack',
          category: 'Communication',
          vendor: 'Salesforce Inc.',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ProductTab />)

    expect(screen.getByText('製品一覧')).toBeInTheDocument()
    expect(screen.getByText('P001')).toBeInTheDocument()
    expect(screen.getByText('Salesforce')).toBeInTheDocument()
    expect(screen.getByText('P002')).toBeInTheDocument()
    expect(screen.getByText('Slack')).toBeInTheDocument()
    expect(screen.getByText('新規登録')).toBeInTheDocument()
  })

  test('renders edit and delete buttons for each product', () => {
    mockedUseProducts.mockReturnValue({
      products: [
        {
          id: '1',
          product_code: 'P001',
          product_name: 'Test',
          category: 'CRM',
          vendor: 'Vendor',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ProductTab />)

    expect(screen.getByText('編集')).toBeInTheDocument()
    expect(screen.getByText('削除')).toBeInTheDocument()
  })
})
