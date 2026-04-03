
DROP POLICY IF EXISTS "Super admins can manage sites" ON public.sites;

CREATE POLICY "Super admins can manage sites"
ON public.sites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));
