
-- Add new role values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'contractor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cs_center';
