// Product types
export interface Product {
  id: string;
  name: string;
  category: string;
  summary: string | null;
  status: 'active' | 'beta' | 'discontinued';
  launchedAt: string | null;
  planCount: number;
  activeContractCount: number;
}

export interface ProductDetail extends Omit<Product, 'planCount' | 'activeContractCount'> {
  plans: Plan[];
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  monthlyFee: number;
  unitPrice: number | null;
  freeTierQuantity: number | null;
  freeTierUnit: string | null;
  billingCycleDiscount: number | null;
  note: string | null;
}

// Customer types
export interface Customer {
  id: string;
  code: string;
  name: string;
  activeContractCount: number;
  monthlyTotal: number;
}

export interface CustomerDetail {
  id: string;
  code: string;
  name: string;
  contact: string | null;
  note: string | null;
  contracts: CustomerContract[];
}

export interface CustomerContract {
  id: string;
  productName: string;
  planName: string;
  contractType: 'monthly' | 'yearly';
  startDate: string;
  status: 'active' | 'cancelled';
  latestUsage: { yearMonth: string; usageQuantity: number; billingAmount: number } | null;
}

// Contract types
export interface Contract {
  id: string;
  customerName: string;
  productName: string;
  planName: string;
  contractType: 'monthly' | 'yearly';
  startDate: string;
  endDate: string | null;
  status: 'active' | 'cancelled';
}

export interface ContractHistory {
  id: string;
  changeType: 'plan_change' | 'cancellation' | 'type_change';
  oldPlanName: string | null;
  newPlanName: string | null;
  reason: string | null;
  changedAt: string;
}

// Usage types
export interface Usage {
  id: string;
  contractId: string;
  customerName: string;
  productName: string;
  planName: string;
  yearMonth: string;
  usageQuantity: number;
  billingAmount: number;
}

// Trial types
export interface Trial {
  id: string;
  customerName: string;
  productName: string;
  startDate: string;
  endDate: string;
  remainingDays: number;
  restrictionLevel: 'full' | 'feature_limited' | 'capacity_limited';
  status: 'active' | 'converted' | 'expired' | 'cancelled';
}

// Dashboard types
export interface RevenueData {
  months: {
    yearMonth: string;
    totalRevenue: number;
    byProduct: { productName: string; revenue: number }[];
  }[];
}

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  contractCount: number;
  latestMonthlyTotal: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TrialKPI {
  activeTrials: number;
  convertedThisMonth: number;
  expiredThisMonth: number;
  conversionRate: number;
  expiringWithin7Days: {
    customerName: string;
    productName: string;
    remainingDays: number;
    usageLevel: 'high' | 'medium' | 'low';
  }[];
}
