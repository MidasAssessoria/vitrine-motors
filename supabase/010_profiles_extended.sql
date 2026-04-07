-- =============================================
-- 010: Profiles Extendidos + Documentos + Reviews para Sellers
-- =============================================

-- 1. Campos extras para profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_verified boolean DEFAULT false;

-- 2. Campos extras para dealerships
ALTER TABLE public.dealerships ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE public.dealerships ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.dealerships ADD COLUMN IF NOT EXISTS whatsapp text DEFAULT '';
ALTER TABLE public.dealerships ADD COLUMN IF NOT EXISTS website text DEFAULT '';
ALTER TABLE public.dealerships ADD COLUMN IF NOT EXISTS ruc text DEFAULT '';

-- 3. Tabela de documentos de verificação
CREATE TABLE IF NOT EXISTS public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('ci_frente', 'ci_verso', 'ruc_doc')),
  file_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- User vê os próprios documentos
CREATE POLICY "user_documents_read_own" ON public.user_documents
  FOR SELECT USING (auth.uid() = user_id);

-- User pode enviar documentos
CREATE POLICY "user_documents_insert_own" ON public.user_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin pode ver e gerenciar todos
CREATE POLICY "user_documents_admin" ON public.user_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_user_documents_user ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON public.user_documents(status);

-- 4. Storage bucket para documentos (PRIVADO)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT DO NOTHING;

-- Dono pode ver e fazer upload dos próprios docs
CREATE POLICY "User vê próprios documentos"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'user-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "User faz upload de documentos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'user-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin pode ver todos os documentos
CREATE POLICY "Admin vê todos documentos"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'user-documents'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Expandir reviews para aceitar seller_id (vendedores particulares)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id);
-- Tornar dealer_id nullable (pode ser review de seller particular)
ALTER TABLE public.reviews ALTER COLUMN dealer_id DROP NOT NULL;

-- Garantir que review tem dealer_id OU seller_id
ALTER TABLE public.reviews ADD CONSTRAINT chk_review_target
  CHECK (dealer_id IS NOT NULL OR seller_id IS NOT NULL);

-- Index para buscar reviews por seller
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON public.reviews(seller_id);
