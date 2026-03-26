import { useState } from 'react'
import type { Contract } from '../types/api'
import type { ContractCreateInput, ContractUpdateInput } from '../api/contracts'
import { useContracts } from '../hooks/useContracts'
import { ContractList } from '../components/Contract/ContractList'
import { ContractForm } from '../components/Contract/ContractForm'
import { ContractDetail } from '../components/Contract/ContractDetail'

type ViewMode = 'list' | 'detail'

export function ContractsPage() {
  const { contracts, loading, error, refetch, addContract, editContract } = useContracts()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<Contract | null>(null)

  const handleSelect = (contract: Contract) => {
    setSelectedContract(contract)
    setViewMode('detail')
  }

  const handleBack = () => {
    setSelectedContract(null)
    setViewMode('list')
  }

  const handleCreate = () => {
    setEditingContract(null)
    setIsFormOpen(true)
  }

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingContract(null)
  }

  const handleFormSubmit = async (data: ContractCreateInput | ContractUpdateInput) => {
    if (editingContract) {
      await editContract(editingContract.id, data as ContractUpdateInput)
      if (selectedContract && selectedContract.id === editingContract.id) {
        const updated = contracts.find((c) => c.id === editingContract.id)
        if (updated) setSelectedContract(updated)
      }
    } else {
      await addContract(data as ContractCreateInput)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">契約管理</h1>
        <div className="mt-4 flex items-center justify-center py-12">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">契約管理</h1>
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
          >
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">契約管理</h1>

      {viewMode === 'list' && (
        <ContractList
          contracts={contracts}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
      )}

      {viewMode === 'detail' && selectedContract && (
        <ContractDetail
          contract={selectedContract}
          onBack={handleBack}
          onEdit={handleEdit}
        />
      )}

      {isFormOpen && (
        <ContractForm
          contract={editingContract}
          onSubmit={handleFormSubmit}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
