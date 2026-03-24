import { render, screen } from '@testing-library/react';
import { Layout } from '../Layout';

describe('Layout', () => {
  it('Layout_RendersNavigation: renders the navigation bar', () => {
    render(<Layout>content</Layout>);

    expect(screen.getByTestId('nav')).toBeInTheDocument();
  });

  it('Layout_RendersNavigation: renders all navigation links', () => {
    render(<Layout>content</Layout>);

    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('製品管理')).toBeInTheDocument();
    expect(screen.getByText('顧客管理')).toBeInTheDocument();
    expect(screen.getByText('契約管理')).toBeInTheDocument();
    expect(screen.getByText('利用実績')).toBeInTheDocument();
    expect(screen.getByText('トライアル')).toBeInTheDocument();
  });

  it('Layout_RendersNavigation: renders the application title', () => {
    render(<Layout>content</Layout>);
    expect(screen.getByText('SaaS管理')).toBeInTheDocument();
  });

  it('highlights the current page link with aria-current="page"', () => {
    render(<Layout currentPath="/products">content</Layout>);

    const productsLink = screen.getByText('製品管理');
    expect(productsLink).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark other links as current page', () => {
    render(<Layout currentPath="/products">content</Layout>);

    const dashboardLink = screen.getByText('ダッシュボード');
    expect(dashboardLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('defaults to "/" as current path when not specified', () => {
    render(<Layout>content</Layout>);

    const dashboardLink = screen.getByText('ダッシュボード');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  it('renders children inside the main content area', () => {
    render(<Layout><p>Test child content</p></Layout>);

    const mainContent = screen.getByTestId('main-content');
    expect(mainContent).toBeInTheDocument();
    expect(screen.getByText('Test child content')).toBeInTheDocument();
  });

  it('navigation links have correct href attributes', () => {
    render(<Layout>content</Layout>);

    expect(screen.getByText('製品管理')).toHaveAttribute('href', '/products');
    expect(screen.getByText('顧客管理')).toHaveAttribute('href', '/customers');
    expect(screen.getByText('契約管理')).toHaveAttribute('href', '/contracts');
    expect(screen.getByText('利用実績')).toHaveAttribute('href', '/usages');
    expect(screen.getByText('トライアル')).toHaveAttribute('href', '/trials');
  });
});
