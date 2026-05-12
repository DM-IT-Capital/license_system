export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ProductTier {
  id: string
  product_id: string
  name: string
  slug: string
  description: string | null
  price: number
  features: string[]
  max_activations: number
  is_subscription: boolean
  duration_days: number | null
  created_at: string
  updated_at: string
  product?: Product
}

export interface Customer {
  id: string
  email: string
  name: string
  company: string | null
  phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
  licenses?: License[]
}

export interface License {
  id: string
  license_key: string
  customer_id: string
  product_id: string
  tier_id: string
  status: 'active' | 'suspended' | 'expired' | 'revoked'
  is_subscription: boolean
  issued_at: string
  expires_at: string | null
  max_activations: number
  current_activations: number
  offline_signature: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  customer?: Customer
  product?: Product
  tier?: ProductTier
  activations?: LicenseActivation[]
}

export interface LicenseActivation {
  id: string
  license_id: string
  machine_id: string
  machine_name: string | null
  ip_address: string | null
  activated_at: string
  last_seen_at: string
  is_active: boolean
  metadata: Record<string, unknown>
}

export interface LicenseValidationLog {
  id: string
  license_id: string | null
  license_key: string
  product_slug: string | null
  machine_id: string | null
  ip_address: string | null
  validation_result: 'valid' | 'invalid' | 'expired' | 'suspended' | 'max_activations' | 'not_found'
  error_message: string | null
  validated_at: string
}

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'super_admin'
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalLicenses: number
  activeLicenses: number
  totalCustomers: number
  totalValidations: number
  validationsToday: number
  recentValidations: LicenseValidationLog[]
  licensesByProduct: { product: string; count: number }[]
  validationsByDay: { date: string; valid: number; invalid: number }[]
}
