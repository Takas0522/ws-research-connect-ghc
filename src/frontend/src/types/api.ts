// API response TypeScript types for all entities

export type ProductStatus = 'active' | 'inactive';
export type ContractType = 'monthly' | 'yearly';
export type ContractStatus = 'active' | 'cancelled';
export type ContractChangeType = 'plan_change' | 'cancellation';
export type TrialRestriction = 'none' | 'limited';
export type TrialStatus = 'active' | 'converted' | 'cancelled' | 'expired';

export interface Product {
  id: number;
  name: string;
  description?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  plans?: Plan[];
  planCount?: number;
  activeContractCount?: number;
}

export interface Plan {
  id: number;
  productId: number;
  name: string;
  monthlyFee: number;
  usageUnitPrice?: number;
  freeUsageLimit?: number;
  yearlyDiscountRate?: number;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  activeContractCount?: number;
  monthlyTotal?: number;
  contracts?: Contract[];
}

export interface Contract {
  id: number;
  customerId: number;
  productId: number;
  planId: number;
  contractType: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  productName?: string;
  planName?: string;
  histories?: ContractHistory[];
}

export interface ContractHistory {
  id: number;
  contractId: number;
  changeType: ContractChangeType;
  previousPlanId?: number;
  newPlanId?: number;
  notes?: string;
  changedAt: string;
  previousPlanName?: string;
  newPlanName?: string;
}

export interface MonthlyUsage {
  id: number;
  contractId: number;
  year: number;
  month: number;
  usageQuantity: number;
  billingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trial {
  id: number;
  customerId: number;
  productId: number;
  planId: number;
  restriction: TrialRestriction;
  status: TrialStatus;
  startDate: string;
  endDate: string;
  convertedContractId?: number;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  productName?: string;
  planName?: string;
  remainingDays?: number;
}

export interface DashboardKPI {
  totalRevenue: number;
  activeContractCount: number;
  activeCustomerCount: number;
  activeTrialCount: number;
  trialConversionRate: number;
  expiringTrials: Trial[];
}

export interface RevenueData {
  year: number;
  month: number;
  totalRevenue: number;
  productBreakdown: { productId: number; productName: string; revenue: number }[];
}
