import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('StatusBadge_RendersCorrectColor: renders active status with green styling', () => {
    render(<StatusBadge status="active" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-status', 'active');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('StatusBadge_RendersCorrectColor: renders inactive status with gray styling', () => {
    render(<StatusBadge status="inactive" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveAttribute('data-status', 'inactive');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('StatusBadge_RendersCorrectColor: renders cancelled status with red styling', () => {
    render(<StatusBadge status="cancelled" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveAttribute('data-status', 'cancelled');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('StatusBadge_RendersCorrectColor: renders converted status with blue styling', () => {
    render(<StatusBadge status="converted" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveAttribute('data-status', 'converted');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('StatusBadge_RendersCorrectColor: renders expired status with yellow styling', () => {
    render(<StatusBadge status="expired" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveAttribute('data-status', 'expired');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('renders the correct Japanese label for active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('アクティブ')).toBeInTheDocument();
  });

  it('renders the correct Japanese label for cancelled status', () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText('キャンセル済')).toBeInTheDocument();
  });

  it('renders the correct Japanese label for converted status', () => {
    render(<StatusBadge status="converted" />);
    expect(screen.getByText('本契約転換')).toBeInTheDocument();
  });

  it('renders the correct Japanese label for expired status', () => {
    render(<StatusBadge status="expired" />);
    expect(screen.getByText('期限切れ')).toBeInTheDocument();
  });

  it('applies additional className when provided', () => {
    render(<StatusBadge status="active" className="my-custom-class" />);

    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('my-custom-class');
  });

  it('renders as a span element', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByTestId('status-badge').tagName).toBe('SPAN');
  });
});
