// Determine API host based on platform
// Android emulator uses 10.0.2.2 to reach host localhost
// iOS simulator uses localhost directly
// Default to Android (most common test target)
var BASE_URL = 'http://10.0.2.2:8000'

// Step 1: Reset existing data
var resetResponse = http.post(BASE_URL + '/api/test/reset', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})

if (resetResponse.status !== 200) {
  throw new Error('Reset failed: ' + resetResponse.status)
}

// Step 2: Seed test data
var seedResponse = http.post(BASE_URL + '/api/test/seed', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant: {
      tenant_code: 'E2E_TEST_TENANT',
      tenant_name: 'E2Eテスト企業',
      plan_tier: 'enterprise',
      status: 'active'
    },
    users: [
      {
        email: 'e2e-admin@test.example.com',
        password: 'TestPassword123!',
        display_name: 'E2E管理者',
        role: 'admin'
      },
      {
        email: 'e2e-member@test.example.com',
        password: 'TestPassword123!',
        display_name: 'E2Eメンバー',
        role: 'member'
      }
    ],
    subscriptions: [
      {
        service_code: 'CONNECT_CHAT',
        service_name: 'ConnectChat',
        plan_name: 'Business',
        status: 'active',
        base_price: 50000,
        metric_name: 'messages',
        free_tier_limit: 10000,
        overage_unit_price: 5
      },
      {
        service_code: 'CONNECT_MEET',
        service_name: 'ConnectMeet',
        plan_name: 'Enterprise',
        status: 'active',
        base_price: 80000,
        metric_name: 'minutes',
        free_tier_limit: 5000,
        overage_unit_price: 10
      },
      {
        service_code: 'CONNECT_STORE',
        service_name: 'ConnectStore',
        plan_name: 'Starter',
        status: 'suspended',
        base_price: 30000,
        metric_name: 'storage_gb',
        free_tier_limit: 100,
        overage_unit_price: 50
      }
    ],
    usage_months: 3
  })
})

if (seedResponse.status !== 200) {
  throw new Error('Seed failed: ' + seedResponse.status + ' - ' + seedResponse.body)
}

var data = json(seedResponse.body)
output.testTenantId = data.tenant_id
output.testAdminUserId = data.user_ids[0]
output.testMemberUserId = data.user_ids[1]
