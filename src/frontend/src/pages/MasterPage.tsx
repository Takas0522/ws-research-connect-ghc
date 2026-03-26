import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ProductTab } from '../components/Master/ProductTab'
import { MetricsTab } from '../components/Master/MetricsTab'
import { PlanTab } from '../components/Master/PlanTab'
import { CustomerTab } from '../components/Master/CustomerTab'
import { UserTab } from '../components/Master/UserTab'
import { AuditLogTab } from '../components/Master/AuditLogTab'

const TABS = [
  { id: 'products', label: '製品', adminOnly: false },
  { id: 'metrics', label: 'メトリクス定義', adminOnly: false },
  { id: 'plans', label: 'プラン', adminOnly: false },
  { id: 'customers', label: '顧客', adminOnly: false },
  { id: 'users', label: 'ユーザー管理', adminOnly: true },
  { id: 'audit-logs', label: '監査ログ', adminOnly: true },
] as const

type TabId = (typeof TABS)[number]['id']

export function MasterPage() {
  const [activeTab, setActiveTab] = useState<TabId>('products')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">マスタ管理</h1>

      <div className="mt-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="マスタ管理タブ">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'products' && (
          <ProductTab onSelectProduct={(product) => setSelectedProductId(product.id)} />
        )}
        {activeTab === 'metrics' && (
          <MetricsTab productId={selectedProductId} />
        )}
        {activeTab === 'plans' && (
          <PlanTab productId={selectedProductId} />
        )}
        {activeTab === 'customers' && <CustomerTab />}
        {activeTab === 'users' && isAdmin && <UserTab />}
        {activeTab === 'audit-logs' && isAdmin && <AuditLogTab />}
      </div>
    </div>
  )
}
