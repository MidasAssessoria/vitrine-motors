-- Add KYC (Know Your Customer) fields to profiles table
-- Required for identity verification of first-time publishers

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS nationality text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS postal_code text NOT NULL DEFAULT '';
