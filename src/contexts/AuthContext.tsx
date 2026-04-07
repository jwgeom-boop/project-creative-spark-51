import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "developer" | "contractor" | "cs_center";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  activeSiteId: string | null;
  activeSiteName: string | null;
  setActiveSite: (id: string, name: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  hasRole: () => false,
  activeSiteId: null,
  activeSiteName: null,
  setActiveSite: () => {},
});

export const useAuth = () => useContext(AuthContext);

// 🔓 임시: 공유용 기본 역할 (BYPASS_AUTH와 연동)
const BYPASS_AUTH = true;
const BYPASS_ROLE: AppRole = "super_admin";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(BYPASS_AUTH ? { id: "", user_id: "", name: "관리자(테스트)", email: "test@test.com", phone: null } : null);
  const [roles, setRoles] = useState<AppRole[]>(BYPASS_AUTH ? [BYPASS_ROLE] : []);
  const [loading, setLoading] = useState(true);
  const [activeSiteId, setActiveSiteId] = useState<string | null>(() => localStorage.getItem("activeSiteId"));
  const [activeSiteName, setActiveSiteName] = useState<string | null>(() => localStorage.getItem("activeSiteName"));

  const setActiveSite = (id: string, name: string) => {
    setActiveSiteId(id);
    setActiveSiteName(name);
    localStorage.setItem("activeSiteId", id);
    localStorage.setItem("activeSiteName", name);
  };

  const fetchProfileAndRoles = async (userId: string) => {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (rolesRes.data) setRoles(rolesRes.data.map((r: { role: AppRole }) => r.role));
  };

  useEffect(() => {
    if (BYPASS_AUTH) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfileAndRoles(session.user.id), 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ session, user, profile, roles, loading, signOut, hasRole, activeSiteId, activeSiteName, setActiveSite }}>
      {children}
    </AuthContext.Provider>
  );
};
