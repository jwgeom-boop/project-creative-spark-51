
-- Allow anonymous inserts on residents table (temporary for testing)
CREATE POLICY "Anon can insert residents" ON public.residents FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous inserts on units table
CREATE POLICY "Anon can insert units" ON public.units FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous inserts on vehicles table
CREATE POLICY "Anon can insert vehicles" ON public.vehicles FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous inserts on payments table
CREATE POLICY "Anon can insert payments" ON public.payments FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous select on residents (for upload transform lookups)
CREATE POLICY "Anon can view residents" ON public.residents FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view units" ON public.units FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view vehicles" ON public.vehicles FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can view payments" ON public.payments FOR SELECT TO anon USING (true);
