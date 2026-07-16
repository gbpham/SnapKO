import { apiFetch } from './backendClient'

export type AdminOverview = {
  summary: {
    totalRevenue: number
    revenueThisMonth: number
    revenueLastMonth: number
    revenueChangePercent: number
    activePro: number
    activeChain: number
    totalBusinesses: number
    totalUsers: number
  }
  monthlyRevenue: Array<{ key: string; label: string; revenue: number }>
  recentPayments: Array<{
    id: string
    businessName: string
    planCode: string | null
    amountPaid: number
    paymentGateway: string | null
    occurredAt: string | null
  }>
}

export type AdminBusiness = {
  id: string
  name: string
  tier: 'FREE' | 'PRO' | 'CHAIN'
  inventoryModel: 'SIMPLE' | 'STANDARD' | 'CHAIN'
  subscriptionExpiresAt: string | null
  operationalState: 'ACTIVE' | 'READ_ONLY_EXPIRED'
  createdAt: string
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
  owner: { id: string; fullName: string | null; phoneNumber: string | null } | null
  _count: { profiles: number; ingredients: number; recipes: number }
}

export type AdminUser = {
  id: string
  fullName: string | null
  email: string | null
  phoneNumber: string | null
  role: 'OWNER' | 'BRANCH_MANAGER' | 'STAFF' | 'ADMIN'
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED'
  createdAt: string
  lastSignInAt: string | null
  business: { id: string; name: string } | null
}

export type AdminPlan = {
  id: string
  code: string
  name: string
  description: string | null
  price: number | string
  durationDays: number
  targetTier: 'FREE' | 'PRO' | 'CHAIN'
  monthlyScansQuota: number
  adRewardScans: number
  maxAdRewardsPerDay: number
  isActive: boolean
}

export type PageResult<T> = { items: T[]; page: number; pageSize: number; total: number }

export function adminGet<T>(path: string, params?: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  return apiFetch<T>(`/admin/${path}${query.size ? `?${query}` : ''}`)
}

export function adminPatch<T>(path: string, data: unknown) {
  return apiFetch<T>(`/admin/${path}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function adminPost<T>(path: string, data: unknown) {
  return apiFetch<T>(`/admin/${path}`, { method: 'POST', body: JSON.stringify(data) })
}
