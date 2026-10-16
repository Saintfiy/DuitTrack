-- Create users table (without business_id FK first to avoid circular dependency)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('owner', 'admin', 'staff')),
  business_id UUID,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  industry TEXT,
  country TEXT,
  currency TEXT DEFAULT 'IDR',
  phone TEXT,
  address TEXT,
  business_health_score NUMERIC DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Add FK constraint to users.business_id after businesses table exists
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS fk_users_business_id;
ALTER TABLE users ADD CONSTRAINT fk_users_business_id 
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;

-- Create business_branches table
CREATE TABLE IF NOT EXISTS business_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  synced_with_payment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  total_purchased NUMERIC DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  last_transaction_date TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create customer_transactions table
CREATE TABLE IF NOT EXISTS customer_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL,
  reorder_level INTEGER NOT NULL,
  last_restock_date TIMESTAMP WITH TIME ZONE,
  supplier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create debts table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('receivable', 'payable')),
  customer_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'overdue', 'paid', 'partial')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom' CHECK(type IN ('custom', 'standard')),
  filters JSONB,
  columns TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount NUMERIC NOT NULL,
  spent NUMERIC DEFAULT 0,
  period TEXT NOT NULL CHECK(period IN ('monthly', 'quarterly', 'yearly')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE budgets ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('qris', 'ewallet', 'bank', 'virtual_account')),
  name TEXT NOT NULL,
  account_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_business ON users(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_business ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business ON inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_debts_business ON debts(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid RLS infinite recursion
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID AS $$
  SELECT business_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can read their own data" ON users;
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id OR business_id = get_my_business_id());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for businesses
DROP POLICY IF EXISTS "Users can read their businesses" ON businesses;
CREATE POLICY "Users can read their businesses" ON businesses
  FOR SELECT USING (owner_id = auth.uid() OR id = get_my_business_id());

DROP POLICY IF EXISTS "Owners can update business" ON businesses;
CREATE POLICY "Owners can update business" ON businesses
  FOR UPDATE USING (owner_id = auth.uid());

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can read business transactions" ON transactions;
CREATE POLICY "Users can read business transactions" ON transactions
  FOR SELECT USING (business_id = get_my_business_id() OR business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
CREATE POLICY "Users can create transactions" ON transactions
  FOR INSERT WITH CHECK (created_by = auth.uid() AND (business_id = get_my_business_id() OR business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )));

DROP POLICY IF EXISTS "Users can update transactions" ON transactions;
CREATE POLICY "Users can update transactions" ON transactions
  FOR UPDATE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete transactions" ON transactions;
CREATE POLICY "Users can delete transactions" ON transactions
  FOR DELETE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- RLS Policies for customers
DROP POLICY IF EXISTS "Users can read business customers" ON customers;
CREATE POLICY "Users can read business customers" ON customers
  FOR SELECT USING (business_id = get_my_business_id() OR business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert customers" ON customers;
CREATE POLICY "Users can insert customers" ON customers
  FOR INSERT WITH CHECK (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update customers" ON customers;
CREATE POLICY "Users can update customers" ON customers
  FOR UPDATE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete customers" ON customers;
CREATE POLICY "Users can delete customers" ON customers
  FOR DELETE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- RLS Policies for inventory
DROP POLICY IF EXISTS "Users can read business inventory" ON inventory;
CREATE POLICY "Users can read business inventory" ON inventory
  FOR SELECT USING (business_id = get_my_business_id() OR business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert inventory" ON inventory;
CREATE POLICY "Users can insert inventory" ON inventory
  FOR INSERT WITH CHECK (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update inventory" ON inventory;
CREATE POLICY "Users can update inventory" ON inventory
  FOR UPDATE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete inventory" ON inventory;
CREATE POLICY "Users can delete inventory" ON inventory
  FOR DELETE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- RLS Policies for debts
DROP POLICY IF EXISTS "Users can read debts" ON debts;
CREATE POLICY "Users can read debts" ON debts
  FOR SELECT USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert debts" ON debts;
CREATE POLICY "Users can insert debts" ON debts
  FOR INSERT WITH CHECK (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update debts" ON debts;
CREATE POLICY "Users can update debts" ON debts
  FOR UPDATE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete debts" ON debts;
CREATE POLICY "Users can delete debts" ON debts
  FOR DELETE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- RLS Policies for budgets
DROP POLICY IF EXISTS "Users can read budgets" ON budgets;
CREATE POLICY "Users can read budgets" ON budgets
  FOR SELECT USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert budgets" ON budgets;
CREATE POLICY "Users can insert budgets" ON budgets
  FOR INSERT WITH CHECK (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update budgets" ON budgets;
CREATE POLICY "Users can update budgets" ON budgets
  FOR UPDATE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete budgets" ON budgets;
CREATE POLICY "Users can delete budgets" ON budgets
  FOR DELETE USING (
    business_id = get_my_business_id()
    OR business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('receipts', 'receipts', true),
  ('documents', 'documents', false),
  ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
DROP POLICY IF EXISTS "Public Receipt Access" ON storage.objects;
CREATE POLICY "Public Receipt Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
CREATE POLICY "Users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can upload logos" ON storage.objects;
CREATE POLICY "Users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);
