import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsageSummaryCard } from '../UsageSummaryCard'
import type { UsageSummary } from '../../../types/api'

describe('UsageSummaryCard', () => {
  const baseSummary: UsageSummary = {
    customer_id: 'c1',
    customer_name: 'Customer A',
    product_id: 'p1',
    product_name: 'Product X',
    plan_name: 'Enterprise',
    billing_month: '2024-01',
    metrics: [
      {
        metric_code: 'api_calls',
        actual_value: 8500,
        limit_value: 10000,
        usage_rate: 85.0,
        overage_fee: 0,
      },
    ],
    alert_threshold_pct: 80,
    has_alert: true,
  }

  test('renders customer name and product name', () => {
    render(<UsageSummaryCard summary={baseSummary} onClick={vi.fn()} />)

    expect(screen.getByText('Customer A')).toBeInTheDocument()
    expect(screen.getByText('Product X / Enterprise')).toBeInTheDocument()
  })

  test('renders billing month', () => {
    render(<UsageSummaryCard summary={baseSummary} onClick={vi.fn()} />)

    expect(screen.getByText('2024-01')).toBeInTheDocument()
  })

  test('renders metric code and values', () => {
    render(<UsageSummaryCard summary={baseSummary} onClick={vi.fn()} />)

    expect(screen.getByText('api_calls')).toBeInTheDocument()
    expect(screen.getByText('85.0%')).toBeInTheDocument()
    // Check formatted values: "8,500 / 10,000"
    expect(screen.getByText(/8,500/)).toBeInTheDocument()
    expect(screen.getByText(/10,000/)).toBeInTheDocument()
  })

  test('shows alert badge when has_alert is true', () => {
    render(<UsageSummaryCard summary={baseSummary} onClick={vi.fn()} />)

    expect(screen.getByText('アラート')).toBeInTheDocument()
  })

  test('does not show alert badge when has_alert is false', () => {
    const noAlertSummary = { ...baseSummary, has_alert: false }
    render(<UsageSummaryCard summary={noAlertSummary} onClick={vi.fn()} />)

    expect(screen.queryByText('アラート')).not.toBeInTheDocument()
  })

  test('shows overage fee when greater than 0', () => {
    const withOverage: UsageSummary = {
      ...baseSummary,
      metrics: [
        {
          metric_code: 'api_calls',
          actual_value: 12000,
          limit_value: 10000,
          usage_rate: 120.0,
          overage_fee: 50000,
        },
      ],
    }

    render(<UsageSummaryCard summary={withOverage} onClick={vi.fn()} />)

    expect(screen.getByText(/超過料金/)).toBeInTheDocument()
    expect(screen.getByText(/50,000/)).toBeInTheDocument()
  })

  test('does not show overage fee when 0', () => {
    render(<UsageSummaryCard summary={baseSummary} onClick={vi.fn()} />)

    expect(screen.queryByText(/超過料金/)).not.toBeInTheDocument()
  })

  test('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<UsageSummaryCard summary={baseSummary} onClick={handleClick} />)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('renders multiple metrics', () => {
    const multiMetric: UsageSummary = {
      ...baseSummary,
      metrics: [
        { metric_code: 'users', actual_value: 50, limit_value: 100, usage_rate: 50.0, overage_fee: 0 },
        { metric_code: 'storage', actual_value: 90, limit_value: 100, usage_rate: 90.0, overage_fee: 0 },
      ],
    }

    render(<UsageSummaryCard summary={multiMetric} onClick={vi.fn()} />)

    expect(screen.getByText('users')).toBeInTheDocument()
    expect(screen.getByText('storage')).toBeInTheDocument()
    expect(screen.getByText('50.0%')).toBeInTheDocument()
    expect(screen.getByText('90.0%')).toBeInTheDocument()
  })
})
