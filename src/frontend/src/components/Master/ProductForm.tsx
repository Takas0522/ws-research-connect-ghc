import { useState, useEffect } from 'react'
import type { Product } from '../../hooks/useProducts'
import { createProduct, updateProduct } from '../../api/products'

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product?: Product
}

export function ProductForm({ isOpen, onClose, onSuccess, product }: ProductFormProps) {
  const [productCode, setProductCode] = useState('')
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [vendor, setVendor] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditing = !!product

  useEffect(() => {
    if (product) {
      setProductCode(product.product_code)
      setProductName(product.product_name)
      setCategory(product.category)
      setVendor(product.vendor)
    } else {
      setProductCode('')
      setProductName('')
      setCategory('')
      setVendor('')
    }
    setError(null)
  }, [product, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      if (isEditing) {
        await updateProduct(product.id, {
          product_name: productName,
          category,
          vendor,
        })
      } else {
        await createProduct({
          product_code: productCode,
          product_name: productName,
          category,
          vendor,
        })
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {isEditing ? '製品を編集' : '製品を新規登録'}
        </h3>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="product-code"
              className="block text-sm font-medium text-gray-700"
            >
              製品コード
            </label>
            <input
              id="product-code"
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              disabled={isEditing}
              required
              maxLength={50}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="product-name"
              className="block text-sm font-medium text-gray-700"
            >
              製品名
            </label>
            <input
              id="product-name"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              maxLength={200}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="product-category"
              className="block text-sm font-medium text-gray-700"
            >
              カテゴリ
            </label>
            <input
              id="product-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="product-vendor"
              className="block text-sm font-medium text-gray-700"
            >
              ベンダー
            </label>
            <input
              id="product-vendor"
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
