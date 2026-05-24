export type UserRole = 'lojista' | 'cliente' | 'admin'

export type User = {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
}

export type AuthResponse = {
  token: string
  expires_at: string
  user: User
}

export type RegisterClienteRequest = {
  name: string
  email: string
  password: string
  phone?: string
}

export type BalanceEntry = {
  store_id: string
  store_slug: string
  store_name: string
  store_logo_url?: string
  store_primary_color?: string
  points_balance: number
  lifetime_earned: number
  lifetime_redeemed: number
  joined_at: string
  last_activity_at: string
}

export type BalanceResponse = {
  user_id: string
  balances: BalanceEntry[]
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
}

export type RewardsResponse = { rewards: Reward[] }

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
  reward_id?: string
  notes?: string
  created_at: string
}

export type RedeemResponse = {
  transaction: PointTransaction
  membership: Membership
  reward: Reward
}

/** Linha do extrato visto pelo cliente. */
export type CustomerTransactionRow = {
  id: string
  store_id: string
  store_name: string
  store_primary_color?: string
  type: TransactionType
  points: number
  purchase_amount?: number
  reward_id?: string
  reward_name?: string
  notes?: string
  created_at: string
}

export type CustomerTransactionsResponse = { transactions: CustomerTransactionRow[] }

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
