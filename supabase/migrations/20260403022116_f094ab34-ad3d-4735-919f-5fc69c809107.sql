
DROP POLICY IF EXISTS "developer can insert sites" ON public.sites;
DROP POLICY IF EXISTS "developer can update sites" ON public.sites;

CREATE POLICY "super_admin and developer can insert sites"
ON public.sites
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "super_admin and developer can update sites"
ON public.sites
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'developer'::app_role)
);
