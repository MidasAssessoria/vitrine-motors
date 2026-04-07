-- =====================================================
-- VITRINEMOTORS - RLS Policies
-- Sprint 1: Blindagem de Seguranca
-- =====================================================
-- IMPORTANTE: Executar este script no SQL Editor do Supabase Dashboard
-- Cada tabela recebe politicas especificas por operacao

-- ─── 1. PROFILES ───
-- Publico: apenas nome e avatar. Dados privados (email, phone) so para o proprio usuario
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis publicos para leitura" ON profiles;
DROP POLICY IF EXISTS "Perfis são públicos para leitura" ON profiles;

CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);
  -- NOTA: Para proteger email/phone, criar uma VIEW publica com apenas campos publicos:
  -- CREATE VIEW public_profiles AS SELECT id, name, avatar_url, city, role, document_verified, created_at FROM profiles;

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── 2. LISTINGS ───
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_select_active" ON listings
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "listings_insert_own" ON listings
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "listings_update_own_or_admin" ON listings
  FOR UPDATE USING (
    seller_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "listings_delete_own_or_admin" ON listings
  FOR DELETE USING (
    seller_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 3. LISTING_PHOTOS ───
ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select_all" ON listing_photos
  FOR SELECT USING (true);

CREATE POLICY "photos_insert_listing_owner" ON listing_photos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
  );

CREATE POLICY "photos_delete_listing_owner" ON listing_photos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 4. LEADS ───
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_own" ON leads
  FOR SELECT USING (
    seller_id = auth.uid()
    OR dealer_id IN (SELECT id FROM dealerships WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "leads_insert_authenticated" ON leads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "leads_update_own" ON leads
  FOR UPDATE USING (
    seller_id = auth.uid()
    OR dealer_id IN (SELECT id FROM dealerships WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 5. LEAD_INTERACTIONS ───
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interactions_select_lead_owner" ON lead_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads WHERE id = lead_id AND (
        seller_id = auth.uid()
        OR dealer_id IN (SELECT id FROM dealerships WHERE owner_id = auth.uid())
      )
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "interactions_insert_authenticated" ON lead_interactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── 6. FAVORITES ───
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE USING (user_id = auth.uid());

-- ─── 7. REVIEWS ───
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_all" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_authenticated" ON reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE USING (user_id = auth.uid());

-- ─── 8. DEALERSHIPS ───
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dealerships_select_approved" ON dealerships
  FOR SELECT USING (approved = true OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "dealerships_insert_own" ON dealerships
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "dealerships_update_own_or_admin" ON dealerships
  FOR UPDATE USING (
    owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── 9. BOOST_PACKAGES ───
ALTER TABLE boost_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boost_packages_select_all" ON boost_packages
  FOR SELECT USING (true);

CREATE POLICY "boost_packages_admin_write" ON boost_packages
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 10. BOOST_PURCHASES ───
ALTER TABLE boost_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "boost_purchases_select_own" ON boost_purchases
  FOR SELECT USING (
    dealer_id IN (SELECT id FROM dealerships WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "boost_purchases_insert_own" ON boost_purchases
  FOR INSERT WITH CHECK (
    dealer_id IN (SELECT id FROM dealerships WHERE owner_id = auth.uid())
  );

-- ─── 11. ANALYTICS_EVENTS ───
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_insert_all" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "analytics_select_own" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 12. USER_DOCUMENTS ───
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own_or_admin" ON user_documents
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "documents_insert_own" ON user_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_update_admin" ON user_documents
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 13. HERO_SLIDES ───
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_slides_select_active" ON hero_slides
  FOR SELECT USING (active = true OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "hero_slides_admin_write" ON hero_slides
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 14. PAYMENT_TRANSACTIONS ───
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON payment_transactions
  FOR SELECT USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "payments_insert_own" ON payment_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── 15. BRANDS / MODELS / TRIMS (catalogo - leitura publica, escrita admin) ───
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_select_all" ON brands FOR SELECT USING (true);
CREATE POLICY "brands_admin_write" ON brands FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models_select_all" ON models FOR SELECT USING (true);
CREATE POLICY "models_admin_write" ON models FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE trims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trims_select_all" ON trims FOR SELECT USING (true);
CREATE POLICY "trims_admin_write" ON trims FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ─── 16. DEALER_HOURS ───
ALTER TABLE dealer_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dealer_hours_select_all" ON dealer_hours
  FOR SELECT USING (true);

CREATE POLICY "dealer_hours_update_owner" ON dealer_hours
  FOR ALL USING (
    dealer_id IN (SELECT id FROM dealerships WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
