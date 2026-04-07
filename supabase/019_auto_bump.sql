-- ─── Auto-bump: atualiza last_bump_at dos anúncios com tier pago ───
-- Requer extensão pg_cron habilitada no Supabase (Dashboard > Extensions > pg_cron)

-- Função que executa o bump
CREATE OR REPLACE FUNCTION auto_bump_listings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Bump diário: Gold e Platinum (rodam todo dia)
  UPDATE listings
  SET last_bump_at = now()
  WHERE status = 'active'
    AND tier IN ('gold')
    AND (boost_expires_at IS NULL OR boost_expires_at > now());

  -- Bump semanal: Silver (só roda se last_bump_at > 7 dias)
  UPDATE listings
  SET last_bump_at = now()
  WHERE status = 'active'
    AND tier = 'silver'
    AND (boost_expires_at IS NULL OR boost_expires_at > now())
    AND (last_bump_at IS NULL OR last_bump_at < now() - INTERVAL '7 days');

  -- Expirar boosts vencidos (volta para tier free)
  UPDATE listings
  SET tier = 'free', boost_expires_at = NULL
  WHERE boost_expires_at IS NOT NULL
    AND boost_expires_at < now()
    AND tier != 'free';
END;
$$;

-- Agendar execução diária às 04:00 UTC (01:00 horário Paraguai)
-- NOTA: Requer pg_cron habilitado. Execute no SQL Editor do Supabase Dashboard:
-- SELECT cron.schedule('auto-bump-daily', '0 4 * * *', 'SELECT auto_bump_listings()');

-- Para verificar se o cron está rodando:
-- SELECT * FROM cron.job;
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
