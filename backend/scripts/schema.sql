-- =========================================================
-- COMPLETE SUPABASE POSTGRESQL SCHEMA FOR E-COMMERCE
-- Includes FK constraints, RLS policies, and Storage Setup
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USERS PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to automatically create user profile when user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(10, 2) DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'Uncategorized',
    stock INT DEFAULT 0,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    images JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT FALSE,
    offer TEXT DEFAULT '',
    sizes JSONB DEFAULT '["7","8","9","10","11","12"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    address TEXT DEFAULT '',
    status TEXT DEFAULT 'Pending',
    payment_method TEXT DEFAULT 'Prepaid',
    payment_status TEXT DEFAULT 'Paid',
    tracking_location TEXT DEFAULT '',
    cancellation_reason TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT DEFAULT 1,
    image_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CART TABLE
CREATE TABLE IF NOT EXISTS public.cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    size TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id, size)
);

-- 8. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 9. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2) DEFAULT 0,
    max_discount NUMERIC(10, 2) DEFAULT 0,
    applicable_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    target_audience TEXT DEFAULT 'all',
    allowed_user_ids JSONB DEFAULT '[]'::jsonb,
    usage_limit INT DEFAULT 0,
    usage_limit_per_user INT DEFAULT 1,
    total_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. COUPON USAGES TABLE
CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. COUPON LOCKS TABLE
CREATE TABLE IF NOT EXISTS public.coupon_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    locked BOOLEAN DEFAULT FALSE,
    last_coupon_used TEXT DEFAULT '',
    locked_at TIMESTAMP WITH TIME ZONE
);

-- 13. ADS TABLE
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT DEFAULT '',
    link_url TEXT DEFAULT '',
    button_text TEXT DEFAULT 'Shop Now',
    display_type TEXT DEFAULT 'banner',
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    target_audience TEXT DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. CAROUSEL CONFIGS TABLE
CREATE TABLE IF NOT EXISTS public.carousel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL DEFAULT 'home',
    slides JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_email TEXT,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public Read Policies
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Read Ads" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Public Read Carousel" ON public.carousel_configs FOR SELECT USING (true);
CREATE POLICY "Public Read Coupons" ON public.coupons FOR SELECT USING (true);

-- User Policies (Own Data)
CREATE POLICY "Users Read Own Profile" ON public.users FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users Update Own Profile" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users Manage Own Addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users Manage Own Cart" ON public.cart FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users Manage Own Wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users Manage Own Orders" ON public.orders FOR ALL USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users Manage Own Order Items" ON public.order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Users Write Reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Admin Full Access Policies
CREATE POLICY "Admin Full Categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Ads" ON public.ads FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Carousel" ON public.carousel_configs FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Coupons" ON public.coupons FOR ALL USING (public.is_admin());
CREATE POLICY "Admin Full Messages" ON public.messages FOR ALL USING (public.is_admin());

-- =========================================================
-- SEED INITIAL DATA
-- =========================================================

INSERT INTO public.categories (name, slug, description)
VALUES 
  ('Running Sneakers', 'running-sneakers', 'High performance running footwear'),
  ('Casual Sneakers', 'casual-sneakers', 'Everyday urban casual sneakers'),
  ('Watches', 'watches', 'Analog and digital luxury watches'),
  ('Belts', 'belts', 'Genuine leather and canvas belts')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, max_discount, is_active, target_audience, usage_limit_per_user)
VALUES 
    ('WELCOME10', 'percentage', 10, 0, 0, true, 'new_users_only', 1),
    ('SAVE20', 'percentage', 20, 500, 200, true, 'all', 1),
    ('FLAT50', 'fixed', 50, 300, 0, true, 'all', 1)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.carousel_configs (key, slides)
VALUES (
    'home',
    '[
      {"id": 1, "url": "/images/SHOE1.jpg", "title": "BRANDED SHOES"},
      {"id": 2, "url": "/images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg", "title": "Premium Collection"},
      {"id": 3, "url": "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM (1).jpeg", "title": "New Arrivals"},
      {"id": 4, "url": "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg", "title": "Premium Sneakers"},
      {"id": 5, "url": "/images/WhatsApp Image 2026-01-13 at 7.57.40 PM.jpeg", "title": "Latest Trends"}
    ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- =========================================================
-- SEED DEFAULT ADMIN USER (admin@veluxkicks.com / admin@12341)
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_uid UUID := '45314521-a09a-415d-ac4c-428967de5be5';
BEGIN

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@veluxkicks.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@veluxkicks.com',
      crypt('admin@12341', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "Admin", "role": "admin"}'::jsonb,
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
  END IF;
END $$;

INSERT INTO public.users (id, email, name, role)
SELECT id, email, 'Admin', 'admin'
FROM auth.users
WHERE email = 'admin@veluxkicks.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', name = 'Admin';

