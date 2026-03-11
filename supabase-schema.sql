-- EXTENSION (needed for UUID generation)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- TABLES
-- =========================

-- 1. Profiles (extension of auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  apartment TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Common Areas
CREATE TABLE common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_hours_per_reservation INTEGER DEFAULT 4,
  cost_per_hour NUMERIC DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  common_area_id UUID NOT NULL REFERENCES common_areas(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  total_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending_payment' CHECK (
    status IN (
      'pending_payment',
      'pending_validation',
      'approved',
      'rejected',
      'cancelled'
    )
  ),
  payment_url TEXT,
  payment_proof_url TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed')
  ),
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Maintenance Notices
CREATE TABLE maintenance_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  common_area_id UUID REFERENCES common_areas(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================
-- ROW LEVEL SECURITY
-- =========================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_notices ENABLE ROW LEVEL SECURITY;

-- =========================
-- PROFILES POLICIES
-- =========================

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (is_admin());

-- =========================
-- COMMON AREAS POLICIES
-- =========================

CREATE POLICY "Anyone can view active common areas"
ON common_areas
FOR SELECT
USING (
  is_active = TRUE
  OR is_admin()
);

CREATE POLICY "Admins can modify common areas"
ON common_areas
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =========================
-- RESERVATIONS POLICIES
-- =========================

CREATE POLICY "Users can view their own reservations"
ON reservations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reservations"
ON reservations
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their pending reservations"
ON reservations
FOR UPDATE
USING (
  user_id = auth.uid()
  AND status IN ('pending_payment', 'pending_validation')
);

CREATE POLICY "Admins can view/manage all reservations"
ON reservations
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =========================
-- PAYMENTS POLICIES
-- =========================

CREATE POLICY "Users can view their own payments"
ON payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM reservations
    WHERE reservations.id = reservation_id
    AND reservations.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view/manage all payments"
ON payments
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =========================
-- MAINTENANCE POLICIES
-- =========================

CREATE POLICY "Anyone can view maintenance notices"
ON maintenance_notices
FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage maintenance notices"
ON maintenance_notices
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- =========================
-- FUNCTIONS
-- =========================

-- Function to check if the current user is an admin
-- SECURITY DEFINER is key here to break recursion loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user'
  );
  RETURN NEW;
END;
$$;

-- Trigger when a new auth user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();