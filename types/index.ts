export type UserRole = 'owner' | 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  business_id: string;
  created_at: string;
  updated_at: string;
  two_fa_enabled: boolean;
}

export interface Business {
  id: string;
  name: string;
  workspace_type?: 'business' | 'personal';
  owner_id: string;
  logo_url?: string;
  industry: string;
  country: string;
  currency: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  business_health_score: number;
}

export interface Transaction {
  id: string;
  business_id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
  reference_number?: string;
  receipt_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  synced_with_payment: boolean;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  total_purchased: number;
  total_transactions: number;
  last_transaction_date?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  business_id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  reorder_level: number;
  last_restock_date?: string;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

export interface DebtRecord {
  id: string;
  business_id: string;
  type: 'receivable' | 'payable';
  customer_name: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'overdue' | 'paid' | 'partial';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  business_id: string;
  name: string;
  type: 'custom' | 'standard';
  filters: Record<string, any>;
  columns: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  business_id: string;
  category: string;
  notes?: string | null;
  limit: number;
  spent: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge: string;
  title: string;
  description: string;
  unlocked_at: string;
}

export interface CashflowPrediction {
  date: string;
  projected_income: number;
  projected_expense: number;
  projected_balance: number;
}

export interface PaymentMethod {
  id: string;
  type: 'qris' | 'ewallet' | 'bank' | 'virtual_account';
  name: string;
  account_number?: string;
  status: 'active' | 'inactive';
}

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
}
