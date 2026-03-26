import { apiClient } from './client'
import type { Contract, ContractPlanHistory, ContractStatus, PrimaryUseCase } from '../types/api'

export interface ContractCreateInput {
  customer_id: string
  product_id: string
  current_plan_id: string
  contract_start_date: string
  contract_end_date?: string | null
  contract_renewal_date: string
  license_count: number
  status?: ContractStatus
  primary_use_case: PrimaryUseCase
}

export interface ContractUpdateInput {
  current_plan_id?: string | null
  contract_end_date?: string | null
  contract_renewal_date?: string | null
  license_count?: number | null
  status?: ContractStatus | null
  primary_use_case?: PrimaryUseCase | null
  change_reason?: string | null
}

export async function fetchContracts(): Promise<Contract[]> {
  return apiClient<Contract[]>('/contracts/')
}

export async function fetchContract(id: string): Promise<Contract> {
  return apiClient<Contract>(`/contracts/${id}`)
}

export async function createContract(data: ContractCreateInput): Promise<Contract> {
  return apiClient<Contract>('/contracts/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateContract(id: string, data: ContractUpdateInput): Promise<Contract> {
  return apiClient<Contract>(`/contracts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function fetchContractHistory(contractId: string): Promise<ContractPlanHistory[]> {
  return apiClient<ContractPlanHistory[]>(`/contracts/${contractId}/history`)
}
