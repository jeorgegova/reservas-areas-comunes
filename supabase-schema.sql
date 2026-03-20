-- EXTENSION (needed for UUID generation)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- TABLES
-- =========================

-- 0. Organizations (Multi-Tenancy)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- url-friendly-name
  address TEXT,
  phone TEXT,
  contact_email TEXT,
  login_photo_url TEXT,
  logo_url TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'past_due')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Profiles (extension of auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  apartment TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Common Areas
CREATE TABLE common_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_hours_per_reservation INTEGER DEFAULT 4,
  cost_per_hour NUMERIC DEFAULT 0,
  -- Tipo de precio: 'hourly' = por hora, 'jornada' = por jornada
  pricing_type TEXT DEFAULT 'hourly' CHECK (pricing_type IN ('hourly', 'jornada')),
  -- Costos por jornada
  cost_jornada_diurna NUMERIC DEFAULT 0,
  cost_jornada_nocturna NUMERIC DEFAULT 0,
  cost_jornada_ambos NUMERIC DEFAULT 0,
  -- Horas de cada jornada (para cálculos)
  jornada_hours_diurna INTEGER DEFAULT 10,
  jornada_hours_nocturna INTEGER DEFAULT 6,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Reservations
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  common_area_id UUID NOT NULL REFERENCES common_areas(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
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
  validated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Maintenance Notices
CREATE TABLE maintenance_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- Consistent naming with component
  common_area_id UUID NOT NULL REFERENCES common_areas(id) ON DELETE CASCADE,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ROW LEVEL SECURITY
-- =========================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_notices ENABLE ROW LEVEL SECURITY;

-- =========================
-- ORGANIZATIONS POLICIES
-- =========================

CREATE POLICY "Public organizations can be viewed by anyone"
ON organizations
FOR SELECT
USING (subscription_status = 'active');

CREATE POLICY "Admins can update their own organization"
ON organizations
FOR UPDATE
USING (
  (id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) AND is_admin())
  OR is_super_admin()
);

CREATE POLICY "Super admins can manage all organizations"
ON organizations
FOR ALL
USING (is_super_admin());

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

CREATE POLICY "Admins can view profiles of their organization"
ON profiles
FOR SELECT
USING (
  (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) AND is_admin())
  OR is_super_admin()
);

CREATE POLICY "Admins can update profiles of their organization"
ON profiles
FOR UPDATE
USING (
  (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) AND is_admin())
  OR is_super_admin()
);

CREATE POLICY "Super admins can view all profiles"
ON profiles
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can manage all profiles"
ON profiles
FOR ALL
USING (is_super_admin());

-- =========================
-- COMMON AREAS POLICIES
-- =========================

CREATE POLICY "Anyone can view active common areas of their organization"
ON common_areas
FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
  AND (is_active = TRUE OR is_admin())
);

CREATE POLICY "Admins can modify common areas"
ON common_areas
FOR ALL
USING (is_admin() OR is_super_admin())
WITH CHECK (is_admin() OR is_super_admin());

-- =========================
-- RESERVATIONS POLICIES
-- =========================

CREATE POLICY "Users can view their organization's reservations"
ON reservations
FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
  AND (user_id = auth.uid() OR is_admin())
);

CREATE POLICY "Users can create reservations in their organization"
ON reservations
FOR INSERT
WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own pending reservations"
ON reservations
FOR UPDATE
USING (
  user_id = auth.uid()
  AND organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
  AND status IN ('pending_payment', 'pending_validation')
);

CREATE POLICY "Admins can manage all reservations in their organization"
ON reservations
FOR ALL
USING (
  (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) AND is_admin())
  OR is_super_admin()
);

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

CREATE POLICY "Anyone can view maintenance notices of their organization"
ON maintenance_notices
FOR SELECT
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid())
);

CREATE POLICY "Admins can manage maintenance notices of their organization"
ON maintenance_notices
FOR ALL
USING (
  (organization_id = (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()) AND is_admin())
  OR is_super_admin()
);

-- =========================
-- FUNCTIONS
-- =========================

-- Function to check if the current user is an admin or super_admin
-- SECURITY DEFINER is key here to break recursion loops
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$;

-- Function to check if the current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
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
  INSERT INTO public.profiles (id, organization_id, email, full_name, phone, apartment, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'organization_id')::uuid,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'apartment',
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