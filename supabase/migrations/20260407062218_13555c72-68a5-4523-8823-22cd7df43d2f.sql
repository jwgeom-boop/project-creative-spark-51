ALTER TABLE public.sites
ADD COLUMN dong_count integer DEFAULT 0,
ADD COLUMN developer_name text DEFAULT '',
ADD COLUMN constructor_name text DEFAULT '';