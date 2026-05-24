export type UserRole = 'lojista' | 'cliente' | 'admin'

export type User = {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
}

export type Store = {
  id: string
  slug: string
  name: string
  description?: string
  logo_url?: string
  primary_color?: string
  address?: string
  city?: string
  state?: string
  country: string
  active: boolean
}

export type Membership = {
  customer_user_id: string
  store_id: string
  points_balance: number
  lifetime_earned: number
  lifetime_redeemed: number
  joined_at: string
  last_activity_at: string
}

export type TransactionType = 'purchase' | 'redemption' | 'adjustment' | 'expiration' | 'bonus'

export type PointTransaction = {
  id: string
  customer_user_id: string
  store_id: string
  type: TransactionType
  points: number
  purchase_amount?: number
  reward_id?: string
  notes?: string
  created_by_user_id?: string
  created_at: string
}

export type Reward = {
  id: string
  store_id: string
  name: string
  description?: string
  image_url?: string
  points_cost: number
  stock?: number
  active: boolean
  starts_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export type RewardPayload = {
  name: string
  description?: string | null
  image_url?: string | null
  points_cost: number
  stock?: number | null
  active?: boolean
  starts_at?: string | null
  expires_at?: string | null
}

export type RewardsListResponse = { rewards: Reward[] }

export type StoreMemberRow = {
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  points_balance: number
  lifetime_earned: number
  lifetime_redeemed: number
  joined_at: string
  last_activity_at: string
}

export type StoreMembersResponse = { members: StoreMemberRow[] }

/** Linha do extrato visto pelo lojista. */
export type StoreTransactionRow = {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  type: TransactionType
  points: number
  purchase_amount?: number
  reward_id?: string
  reward_name?: string
  notes?: string
  created_by_user_id?: string
  created_by_name?: string
  created_at: string
}

export type StoreTransactionsResponse = { transactions: StoreTransactionRow[] }

export type AuthResponse = {
  token: string
  expires_at: string
  user: User
  store?: Store
}

export type LoginResponse = AuthResponse

export type RegisterLojistaRequest = {
  owner: {
    name: string
    email: string
    password: string
    phone?: string
  }
  store: {
    slug: string
    name: string
    primary_color?: string
    city?: string
    state?: string
  }
}

export type MyStoresResponse = { stores: Store[] }

export type AwardPointsRequest = {
  customer_email: string
  points: number
  purchase_amount?: number
  notes?: string
}

export type AwardPointsResponse = {
  transaction: PointTransaction
  membership: Membership
}

export type UpdateProfilePayload = {
  name: string
  phone?: string | null
}

export type ChangePasswordPayload = {
  current_password: string
  new_password: string
}

export type ApiErrorBody = {
  error: string
  message: string
}
