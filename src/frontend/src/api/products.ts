import { apiClient } from './client'

export interface Product {
  id: string
  product_code: string
  product_name: string
  category: string
  vendor: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProductCreateData {
  product_code: string
  product_name: string
  category: string
  vendor: string
}

interface ProductUpdateData {
  product_name?: string
  category?: string
  vendor?: string
}

export async function fetchProducts(): Promise<Product[]> {
  return apiClient<Product[]>('/products/')
}

export async function createProduct(data: ProductCreateData): Promise<Product> {
  return apiClient<Product>('/products/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProduct(
  id: string,
  data: ProductUpdateData,
): Promise<Product> {
  return apiClient<Product>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient<void>(`/products/${id}`, { method: 'DELETE' })
}
