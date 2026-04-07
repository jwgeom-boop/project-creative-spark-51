import { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Building2, Users, ClipboardCheck, Truck, CreditCard, Bell, Wrench, MessageSquare, Settings, LayoutDashboard, ChevronDown, Menu, X, LogOut, UserCog, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NavChild {
  label: string;
  path: string;
  allowedRoles: string[];
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  allowedRoles: string[];
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: "홈 대시보드", path: "/", icon: LayoutDashboard, allowedRoles: ["super_admin", "developer", "contractor", "cs_center"] },
  { label: "현장관리", path: "/sites", icon: Building2, allowedRoles: ["super_admin"] },
  { label: "입주자관리", path: "/residents", icon: Users, allowedRoles: ["super_admin", "developer", "cs_center"], children: [
    { label: "입주자 목록", path: "/residents", allowedRoles: ["super_admin", "developer"] },
    { label: "세대 목록", path: "/units", allowedRoles: ["super_admin", "developer"] },
    { label: "차량 등록 현황", path: "/vehicles", allowedRoles: ["super_admin", "cs_center"] },
    { label: "입주증 발급", path: "/permits", allowedRoles: ["super_admin", "cs_center"] },
  ]},
  { label: "사전점검", path: "/inspection", icon: ClipboardCheck, allowedRoles: ["super_admin", "cs_center"] },
  { label: "이사관리", path: "/moving", icon: Truck, allowedRoles: ["super_admin", "cs_center"] },
  { label: "납부관리", path: "/payments", icon: CreditCard, allowedRoles: ["super_admin", "developer"] },
  { label: "안내·공지", path: "/notices", icon: Bell, allowedRoles: ["super_admin", "developer"], children: [
    { label: "공지사항", path: "/notices", allowedRoles: ["super_admin", "developer"] },
    { label: "안내문", path: "/announcements", allowedRoles: ["super_admin", "developer"] },
    { label: "동의서", path: "/agreements", allowedRoles: ["super_admin", "developer"] },
  ]},
  { label: "하자보수", path: "/defects", icon: Wrench, allowedRoles: ["super_admin", "contractor"], children: [
    { label: "하자 목록", path: "/defects", allowedRoles: ["super_admin", "contractor"] },
    { label: "하자 접수", path: "/defect-report", allowedRoles: ["super_admin", "contractor"] },
  ]},
  { label: "CS·민원", path: "/cs", icon: MessageSquare, allowedRoles: ["super_admin", "cs_center"] },
  { label: "업체관리", path: "/vendors", icon: Store, allowedRoles: ["super_admin", "developer"] },
  { label: "계정관리", path: "/accounts", icon: UserCog, allowedRoles: ["super_admin"] },
  { label: "설정", path: "/settings", icon: Settings, allowedRoles: ["super_admin"] },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, signOut, roles, activeSiteName } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedItem, setMobileExpandedItem] = useState<string | null>(null);

  const roleLabel = roles.includes("super_admin") ? "총관리자" : roles.includes("developer") ? "시행사" : roles.includes("contractor") ? "시공사" : roles.includes("cs_center") ? "입주지원센터" : "관리자";

  // Filter nav items by role
  const visibleNavItems = navItems
    .filter(item => item.allowedRoles.some(role => roles.includes(role as any)))
    .map(item => {
      if (!item.children) return item;
      const visibleChildren = item.children.filter(child =>
        child.allowedRoles.some(role => roles.includes(role as any))
      );
      if (visibleChildren.length === 0) return null;
      return { ...item, children: visibleChildren };
    })
    .filter(Boolean) as NavItem[];

  const isActiveParent = (item: NavItem) => {
    if (location.pathname === item.path) return true;
    if (item.children) return item.children.some(c => location.pathname === c.path);
    return false;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileExpandedItem(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center h-14 px-4">
          <div className="flex items-center gap-2 mr-8 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">ON</span>
            </div>
            <span className="font-bold text-foreground text-sm">입주ON</span>
            {activeSiteName && <span className="text-xs text-muted-foreground ml-1 hidden md:inline">· {activeSiteName}</span>}
          </div>

          <nav className="hidden lg:flex items-center gap-1 flex-wrap">
            {visibleNavItems.map((item) => {
              const active = isActiveParent(item);
              if (item.children) {
                return (
                  <div key={item.path} className="relative"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}>
                    <NavLink to={item.path} onClick={() => setOpenDropdown(null)}
                      className={`px-3 py-2 text-sm whitespace-nowrap rounded-md transition-colors flex items-center gap-1 ${active ? "text-primary font-semibold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                      {item.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                    </NavLink>
                    {openDropdown === item.label && (
                      <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-0 bg-card border border-border rounded-md shadow-xl py-1 min-w-[180px] z-50"
                        style={{ maxWidth: 'calc(100vw - 16px)', backgroundColor: 'hsl(var(--card))' }}>
                        {item.children.map(child => (
                          <NavLink key={child.path} to={child.path} onClick={() => setOpenDropdown(null)}
                            className={`block px-4 py-2 text-sm transition-colors ${location.pathname === child.path ? "text-primary bg-accent font-medium" : "text-foreground hover:bg-accent"}`}>
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink key={item.path} to={item.path}
                  className={`px-3 py-2 text-sm whitespace-nowrap rounded-md transition-colors ${active ? "text-primary font-semibold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <button className="lg:hidden ml-auto mr-3 p-2 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="hidden lg:flex ml-auto items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs font-medium text-foreground">{profile?.name || "관리자"}</div>
              <div className="text-xs text-muted-foreground">{roleLabel}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">{(profile?.name || "관")[0]}</span>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-accent" title="로그아웃">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">{(profile?.name || "관")[0]}</span>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive" title="로그아웃">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <nav className="py-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveParent(item);
                if (item.children) {
                  const expanded = mobileExpandedItem === item.label;
                  return (
                    <div key={item.path}>
                      <button onClick={() => setMobileExpandedItem(expanded ? null : item.label)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${active ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-accent"}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>
                      {expanded && (
                        <div className="bg-accent/30">
                          {item.children.map(child => (
                            <NavLink key={child.path} to={child.path} onClick={closeMobileMenu}
                              className={`block pl-11 pr-4 py-2.5 text-sm transition-colors ${location.pathname === child.path ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <NavLink key={item.path} to={item.path} onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${active ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-accent"}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
            <div className="border-t border-border px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">{(profile?.name || "관")[0]}</span>
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">{profile?.name || "관리자"}</div>
                <div className="text-xs text-muted-foreground">{roleLabel}</div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
