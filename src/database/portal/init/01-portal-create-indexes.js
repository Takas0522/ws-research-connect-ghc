// Portal MongoDB initialization script
// Creates portal_* collections and indexes for the SaaS Portal mobile app
//
// Usage:
//   mongosh mongodb://localhost:27017/saas_management 01-portal-create-indexes.js

db = db.getSiblingDB('saas_management');

// portal_tenants collection
db.portal_tenants.createIndex({ tenant_code: 1 }, { unique: true });

// portal_users collection
db.portal_users.createIndex({ email: 1 }, { unique: true });
db.portal_users.createIndex({ tenant_id: 1 });

// portal_subscriptions collection
db.portal_subscriptions.createIndex({ tenant_id: 1 });
db.portal_subscriptions.createIndex({ tenant_id: 1, service_code: 1 });

// portal_usage_metrics collection
db.portal_usage_metrics.createIndex({ tenant_id: 1, year_month: -1 });
db.portal_usage_metrics.createIndex({ tenant_id: 1, service_code: 1, year_month: -1 });
db.portal_usage_metrics.createIndex({ subscription_id: 1, year_month: -1 });

print('All portal indexes created successfully.');
