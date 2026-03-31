
-- Fix cs_chats: replace permissive ALL policy with role-based
DROP POLICY "Admins can manage cs_chats" ON public.cs_chats;
CREATE POLICY "Admins can manage cs_chats" ON public.cs_chats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager') OR public.has_role(auth.uid(), 'cs_agent'));

-- Fix cs_messages: replace permissive ALL policy with role-based
DROP POLICY "Admins can manage cs_messages" ON public.cs_messages;
CREATE POLICY "Admins can manage cs_messages" ON public.cs_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager') OR public.has_role(auth.uid(), 'cs_agent'));
