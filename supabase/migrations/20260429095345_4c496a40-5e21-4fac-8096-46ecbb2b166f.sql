
-- ========== MISC EXPENSES (Sonstiges) ==========
CREATE TYPE public.misc_expense_category AS ENUM (
  'cleaning',      -- دستمال، شیشه‌پاک‌کن، اسپری
  'tools',         -- ابزار کوچک
  'parking',       -- پارکینگ/عوارض
  'toll',          -- عوارض جاده
  'carwash',       -- کارواش
  'food',          -- غذا/نوشیدنی در حین کار (با تأیید)
  'office',        -- ملزومات اداری (پرینت، کاغذ)
  'safety',        -- دستکش، ماسک، ایمنی
  'other'
);

CREATE TYPE public.misc_expense_status AS ENUM (
  'pending',       -- در انتظار تأیید ادمین
  'approved',
  'rejected',
  'reimbursed'
);

CREATE TABLE public.misc_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_log_id UUID,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category public.misc_expense_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  vat_percent NUMERIC(4,2) DEFAULT 19.00,
  vendor TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'cash', -- cash | card | company_card
  receipt_photo_url TEXT,
  has_receipt BOOLEAN NOT NULL DEFAULT false,
  status public.misc_expense_status NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reimbursed_at TIMESTAMP WITH TIME ZONE,
  synced_to_admin BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_misc_expenses_user_date ON public.misc_expenses(user_id, expense_date DESC);
CREATE INDEX idx_misc_expenses_status ON public.misc_expenses(status);

ALTER TABLE public.misc_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own misc expenses"
  ON public.misc_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own misc expenses"
  ON public.misc_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending misc expenses"
  ON public.misc_expenses FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE TRIGGER update_misc_expenses_updated_at
  BEFORE UPDATE ON public.misc_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== DRIVER PERFORMANCE / GAMIFICATION ==========
CREATE TABLE public.driver_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak_days INTEGER NOT NULL DEFAULT 0,
  best_streak_days INTEGER NOT NULL DEFAULT 0,
  total_oil_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 0,
  on_time_visits INTEGER NOT NULL DEFAULT 0,
  last_visit_date DATE,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view performance (leaderboard)"
  ON public.driver_performance FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users update own performance"
  ON public.driver_performance FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own performance"
  ON public.driver_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_driver_performance_updated_at
  BEFORE UPDATE ON public.driver_performance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== ROUTE OPTIMIZATIONS (AI Smart Routing) ==========
CREATE TABLE public.route_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  input_visits JSONB NOT NULL DEFAULT '[]'::jsonb,
  optimized_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_total_km NUMERIC(8,2),
  estimated_total_minutes INTEGER,
  estimated_fuel_savings_eur NUMERIC(8,2),
  reasoning TEXT DEFAULT '',
  applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.route_optimizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own route optimizations"
  ON public.route_optimizations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own route optimizations"
  ON public.route_optimizations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own route optimizations"
  ON public.route_optimizations FOR UPDATE USING (auth.uid() = user_id);
