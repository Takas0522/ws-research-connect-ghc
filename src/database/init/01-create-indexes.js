// MongoDB initialization script
// Runs automatically on first container startup via docker-entrypoint-initdb.d

db = db.getSiblingDB('saas_management');

// users collection
db.users.createIndex({ email: 1 }, { unique: true });

// products collection
db.products.createIndex({ product_code: 1 }, { unique: true });

// metrics_definitions collection
db.metrics_definitions.createIndex(
  { product_id: 1, metric_code: 1 },
  { unique: true }
);

// plans collection
db.plans.createIndex(
  { product_id: 1, plan_code: 1 },
  { unique: true }
);

// customers collection
db.customers.createIndex({ customer_code: 1 }, { unique: true });
db.customers.createIndex({ assigned_sales_user_id: 1 });

// contracts collection
db.contracts.createIndex({ customer_id: 1, product_id: 1, status: 1 });

// contract_plan_history collection
db.contract_plan_history.createIndex({ contract_id: 1 });

// monthly_usage collection
db.monthly_usage.createIndex(
  { contract_id: 1, billing_month: 1, metric_code: 1 },
  { unique: true }
);

// usage_imports collection
db.usage_imports.createIndex({ billing_month: 1, status: 1 });

// audit_logs collection
db.audit_logs.createIndex({ created_at: -1 });
db.audit_logs.createIndex({ resource_type: 1, resource_id: 1 });

print('All indexes created successfully for saas_management database.');
