import { render, screen } from '@testing-library/react'
import { AlertList } from '../AlertList'
import type { UsageAlert } from '../../../types/api'

describe('AlertList', () => {
  const mockAlerts: UsageAlert[] = [
    {
      customer_name: 'Customer A',
      product_name: 'Product X',
      metric_code: 'api_calls',
      billing_month: '2024-01',
      usage_rate: 95.5,
      limit_value: 10000,
      actual_value: 9550,
      alert_threshold_pct: 80,
    },
    {
      customer_name: 'Customer B',
      product_name: 'Product Y',
      metric_code: 'storage',
      billing_month: '2024-01',
      usage_rate: 110.0,
      limit_value: 500,
      actual_value: 550,
      alert_threshold_pct: 80,
    },
  ]

  test('renders nothing when alerts array is empty', () => {
    const { container } = render(<AlertList alerts={[]} />)

    expect(container.firstChild).toBeNull()
  })

  test('renders alert count in header', () => {
    render(<AlertList alerts={mockAlerts} />)

    expect(screen.getByText(/アラート \(2件\)/)).toBeInTheDocument()
  })

  test('renders alert items with customer and product names', () => {
    render(<AlertList alerts={mockAlerts} />)

    expect(screen.getByText('Customer A')).toBeInTheDocument()
    expect(screen.getByText('Product X')).toBeInTheDocument()
    expect(screen.getByText('Customer B')).toBeInTheDocument()
    expect(screen.getByText('Product Y')).toBeInTheDocument()
  })

  test('renders metric codes', () => {
    render(<AlertList alerts={mockAlerts} />)

    expect(screen.getByText('api_calls')).toBeInTheDocument()
    expect(screen.getByText('storage')).toBeInTheDocument()
  })

  test('renders billing months', () => {
    render(<AlertList alerts={mockAlerts} />)

    const months = screen.getAllByText('2024-01')
    expect(months).toHaveLength(2)
  })

  test('renders usage rates', () => {
    render(<AlertList alerts={mockAlerts} />)

    expect(screen.getByText('95.5%')).toBeInTheDocument()
    expect(screen.getByText('110.0%')).toBeInTheDocument()
  })

  test('renders table headers', () => {
    render(<AlertList alerts={mockAlerts} />)

    expect(screen.getByText('顧客')).toBeInTheDocument()
    expect(screen.getByText('製品')).toBeInTheDocument()
    expect(screen.getByText('メトリクス')).toBeInTheDocument()
    expect(screen.getByText('対象月')).toBeInTheDocument()
    expect(screen.getByText('実績 / 上限')).toBeInTheDocument()
    expect(screen.getByText('使用率')).toBeInTheDocument()
  })

  test('renders formatted actual and limit values', () => {
    render(<AlertList alerts={mockAlerts} />)

    // "9,550 / 10,000" and "550 / 500"
    expect(screen.getByText(/9,550/)).toBeInTheDocument()
    expect(screen.getByText(/10,000/)).toBeInTheDocument()
  })
})
