-- =====================================================
-- VITRINEMOTORS - Listing Status Guard
-- Impede que non-admin aprove anuncios (pending/rejected → active)
-- =====================================================

CREATE OR REPLACE FUNCTION guard_listing_status()
RETURNS TRIGGER AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Só interceptar quando status está realmente mudando
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Buscar role do caller
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();

  -- Bloquear non-admin de setar 'active' quando status atual é 'pending' ou 'rejected'
  IF NEW.status = 'active'
    AND OLD.status IN ('pending', 'rejected')
    AND (caller_role IS NULL OR caller_role <> 'admin')
  THEN
    RAISE EXCEPTION 'Solo un administrador puede aprobar anuncios pendientes';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER listing_status_guard
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION guard_listing_status();
