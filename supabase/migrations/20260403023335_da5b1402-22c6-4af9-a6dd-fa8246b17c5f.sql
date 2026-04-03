
ALTER TABLE public.notices
ADD COLUMN IF NOT EXISTS target_type text DEFAULT '전체 세대',
ADD COLUMN IF NOT EXISTS send_method text DEFAULT '앱 푸시',
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT null;
