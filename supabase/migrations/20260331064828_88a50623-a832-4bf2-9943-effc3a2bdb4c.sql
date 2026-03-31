
-- ============================================
-- 1. SITES (현장/아파트 단지)
-- ============================================
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  total_units INT DEFAULT 0,
  move_in_start DATE,
  move_in_end DATE,
  status TEXT NOT NULL DEFAULT '진행중',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view sites" ON public.sites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage sites" ON public.sites FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- ============================================
-- 2. UNITS (세대)
-- ============================================
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  dong TEXT NOT NULL,
  ho TEXT NOT NULL,
  area TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT '미입주',
  payment_status TEXT NOT NULL DEFAULT '미납',
  permit_status TEXT NOT NULL DEFAULT '미발급',
  moving_status TEXT NOT NULL DEFAULT '미예약',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, dong, ho)
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view units" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage units" ON public.units FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 3. RESIDENTS (입주자)
-- ============================================
CREATE TABLE public.residents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  qr_status TEXT NOT NULL DEFAULT '미발급',
  inspection_status TEXT NOT NULL DEFAULT '미예약',
  moving_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view residents" ON public.residents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage residents" ON public.residents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 4. DEFECTS (하자)
-- ============================================
CREATE TABLE public.defects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  defect_type TEXT NOT NULL DEFAULT '기타',
  content TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  company TEXT DEFAULT '',
  visit_date DATE,
  status TEXT NOT NULL DEFAULT '미배정',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.defects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view defects" ON public.defects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage defects" ON public.defects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 5. PAYMENTS (납부)
-- ============================================
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  balance BIGINT DEFAULT 0,
  mid_payment_status TEXT DEFAULT '미납',
  option_amount BIGINT DEFAULT 0,
  extension_amount BIGINT DEFAULT 0,
  etc_amount BIGINT DEFAULT 0,
  total_amount BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT '미납',
  confirm_status TEXT NOT NULL DEFAULT '승인대기',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view payments" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 6. VEHICLES (차량)
-- ============================================
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  plate TEXT NOT NULL,
  car_model TEXT DEFAULT '',
  qr_issued_date DATE,
  qr_status TEXT NOT NULL DEFAULT '미발급',
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage vehicles" ON public.vehicles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 7. INSPECTIONS (사전점검)
-- ============================================
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  time_slot TEXT NOT NULL,
  checkin_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT '대기중',
  defect_count INT DEFAULT 0,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view inspections" ON public.inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage inspections" ON public.inspections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 8. MOVING_SCHEDULES (이사 일정)
-- ============================================
CREATE TABLE public.moving_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  moving_date DATE NOT NULL,
  time_slot TEXT NOT NULL DEFAULT '오전',
  elevator TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT '예정',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.moving_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view moving_schedules" ON public.moving_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage moving_schedules" ON public.moving_schedules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 9. NOTICES (안내문)
-- ============================================
CREATE TABLE public.notices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_count INT DEFAULT 0,
  read_rate NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT '발송완료',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view notices" ON public.notices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage notices" ON public.notices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 10. ANNOUNCEMENTS (공지사항)
-- ============================================
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  category TEXT DEFAULT '일반',
  is_pinned BOOLEAN DEFAULT false,
  views INT DEFAULT 0,
  author TEXT DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 11. AGREEMENTS (동의서)
-- ============================================
CREATE TABLE public.agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_count INT DEFAULT 0,
  signed_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view agreements" ON public.agreements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage agreements" ON public.agreements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 12. AGREEMENT_SIGNATURES (동의서 서명)
-- ============================================
CREATE TABLE public.agreement_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_id UUID REFERENCES public.agreements(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agreement_id, unit_id)
);
ALTER TABLE public.agreement_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view agreement_signatures" ON public.agreement_signatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage agreement_signatures" ON public.agreement_signatures FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 13. PERMITS (입주증)
-- ============================================
CREATE TABLE public.permits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  issued_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT '미발급',
  qr_code TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view permits" ON public.permits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage permits" ON public.permits FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'site_manager'));

-- ============================================
-- 14. CS_CHATS (CS 상담)
-- ============================================
CREATE TABLE public.cs_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT '미처리',
  last_message TEXT DEFAULT '',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cs_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view cs_chats" ON public.cs_chats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage cs_chats" ON public.cs_chats FOR ALL TO authenticated USING (true);

-- ============================================
-- 15. CS_MESSAGES (CS 메시지)
-- ============================================
CREATE TABLE public.cs_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.cs_chats(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL DEFAULT 'resident',
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cs_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view cs_messages" ON public.cs_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage cs_messages" ON public.cs_messages FOR ALL TO authenticated USING (true);

-- ============================================
-- Updated_at triggers for all tables
-- ============================================
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON public.residents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_defects_updated_at BEFORE UPDATE ON public.defects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_moving_schedules_updated_at BEFORE UPDATE ON public.moving_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agreements_updated_at BEFORE UPDATE ON public.agreements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_permits_updated_at BEFORE UPDATE ON public.permits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cs_chats_updated_at BEFORE UPDATE ON public.cs_chats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
