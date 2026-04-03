
CREATE POLICY "super_admin and developer can insert notices"
ON public.notices
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "super_admin and developer can update notices"
ON public.notices
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR public.has_role(auth.uid(), 'developer'::app_role)
);
