const BACKEND_URL = 'http://localhost:8000'

export async function getAuthToken(email: string, password: string): Promise<string> {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)

  const res = await fetch(`${BACKEND_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`)
  const data = await res.json() as { access_token: string }
  return data.access_token
}

async function apiRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  }
  const options: RequestInit = { method, headers }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`${BACKEND_URL}${path}`, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${method} ${path} failed: ${res.status} ${text}`)
  }
  return res.json()
}

export async function createProduct(
  token: string,
  data: { product_code: string; product_name: string; category: string; vendor: string }
): Promise<{ id: string }> {
  return apiRequest('POST', '/api/products/', token, data) as Promise<{ id: string }>
}

export async function createMetric(
  token: string,
  productId: string,
  data: { metric_code: string; metric_name: string; unit: string; description?: string }
): Promise<{ id: string }> {
  return apiRequest('POST', `/api/products/${productId}/metrics`, token, data) as Promise<{ id: string }>
}

export async function createPlan(
  token: string,
  productId: string,
  data: {
    plan_code: string
    plan_name: string
    monthly_base_fee: number
    alert_threshold_percent: number
    metric_limits?: Array<{ metric_code: string; limit_value: number; overage_unit_price: number }>
  }
): Promise<{ id: string }> {
  return apiRequest('POST', `/api/products/${productId}/plans`, token, data) as Promise<{ id: string }>
}

export async function createCustomer(
  token: string,
  data: {
    customer_code: string
    customer_name: string
    assigned_sales_user_id?: string
    contact_person?: string
    notes?: string
  }
): Promise<{ id: string }> {
  return apiRequest('POST', '/api/customers/', token, data) as Promise<{ id: string }>
}

export async function createContract(
  token: string,
  data: {
    customer_id: string
    product_id: string
    current_plan_id: string
    license_count: number
    contract_start_date: string
    contract_renewal_date: string
    status?: string
    primary_use_case?: string
    contract_end_date?: string
  }
): Promise<{ id: string }> {
  return apiRequest('POST', '/api/contracts/', token, data) as Promise<{ id: string }>
}

export async function createUser(
  token: string,
  data: { email: string; display_name: string; role: string; password: string }
): Promise<{ id: string }> {
  return apiRequest('POST', '/api/admin/users/', token, data) as Promise<{ id: string }>
}
