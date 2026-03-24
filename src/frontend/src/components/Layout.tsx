import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'ダッシュボード', path: '/' },
  { label: '製品管理', path: '/products' },
  { label: '顧客管理', path: '/customers' },
  { label: '契約管理', path: '/contracts' },
  { label: '利用実績', path: '/usages' },
  { label: 'トライアル', path: '/trials' },
];

interface LayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export function Layout({ children, currentPath = '/' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm" data-testid="nav">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <span className="text-xl font-bold text-gray-900">SaaS管理</span>
            <div className="hidden sm:flex sm:space-x-4" data-testid="nav-links">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  aria-current={currentPath === item.path ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    currentPath === item.path
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
