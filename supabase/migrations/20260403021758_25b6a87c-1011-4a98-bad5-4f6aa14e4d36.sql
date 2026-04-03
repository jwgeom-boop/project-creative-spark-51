
CREATE POLICY "developer can insert sites"
ON public.sites
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "developer can update sites"
ON public.sites
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'developer'::app_role)
);
