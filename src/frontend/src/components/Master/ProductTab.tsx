import { useState } from 'react'
import { useProducts, type Product } from '../../hooks/useProducts'
import { deleteProduct } from '../../api/products'
import { ProductForm } from './ProductForm'

interface ProductTabProps {
  onSelectProduct?: (product: Product) => void
  selectedProductId?: string | null
}

export function ProductTab({ onSelectProduct, selectedProductId }: ProductTabProps) {
  const { products, loading, error, refetch } = useProducts()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      await refetch()
    } catch (err) {
      alert(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingProduct(undefined)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingProduct(undefined)
  }

  const handleFormSuccess = async () => {
    setIsFormOpen(false)
    setEditingProduct(undefined)
    await refetch()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
        >
          再試行
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">製品一覧</h2>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規登録
        </button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-md bg-gray-50 py-12 text-center">
          <p className="text-gray-500">製品が登録されていません</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  製品コード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  製品名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ベンダー
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={`cursor-pointer hover:bg-gray-50 ${
                    selectedProductId === product.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => onSelectProduct?.(product)}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {product.product_code}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {product.product_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {product.category}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                    {product.vendor}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(product)
                      }}
                      className="mr-2 text-blue-600 hover:text-blue-800"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDelete(product.id)
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={() => void handleFormSuccess()}
        product={editingProduct}
      />
    </div>
  )
}
