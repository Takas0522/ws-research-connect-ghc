import { useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: '製品' },
  { to: '/customers', label: '顧客' },
  { to: '/contracts', label: '契約' },
  { to: '/usages', label: '利用実績' },
  { to: '/trials', label: 'トライアル' },
];

function NavItem({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-700 text-white'
            : 'text-blue-100 hover:bg-blue-500 hover:text-white'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function MobileMenuButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md p-2 text-blue-200 hover:bg-blue-500 hover:text-white focus:outline-none md:hidden"
      aria-label="メニュー"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {isOpen ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
  );
}

export default function Layout(): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">SaaS Manager</span>
              <div className="hidden gap-1 md:flex">
                {navItems.map((item) => (
                  <NavItem key={item.to} to={item.to} label={item.label} />
                ))}
              </div>
            </div>
            <MobileMenuButton isOpen={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} />
          </div>
        </div>
        {mobileOpen && (
          <div className="flex flex-col gap-1 px-4 pb-3 md:hidden">
            {navItems.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} onClick={() => setMobileOpen(false)} />
            ))}
          </div>
        )}
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
