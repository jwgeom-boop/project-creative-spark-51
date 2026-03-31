import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Building2, Users, ClipboardCheck, Truck, CreditCard, Bell, Wrench, MessageSquare, Settings, LayoutDashboard, ChevronDown, Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: any;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: "홈 대시보드", path: "/", icon: LayoutDashboard },
  { label: "현장관리", path: "/sites", icon: Building2 },
  { label: "입주자관리", path: "/residents", icon: Users, children: [
    { label: "입주자 목록", path: "/residents" },
    { label: "세대 목록", path: "/units" },
    { label: "차량 등록 현황", path: "/vehicles" },
    { label: "입주증 발급", path: "/permits" },
  ]},
  { label: "사전점검", path: "/inspection", icon: ClipboardCheck },
  { label: "이사관리", path: "/moving", icon: Truck },
  { label: "납부관리", path: "/payments", icon: CreditCard },
  { label: "안내·공지", path: "/notices", icon: Bell, children: [
    { label: "안내문 발송", path: "/notices" },
    { label: "공지사항 관리", path: "/announcements" },
    { label: "동의서 관리", path: "/agreements" },
  ]},
  { label: "하자보수", path: "/defects", icon: Wrench, children: [
    { label: "하자보수 관리", path: "/defects" },
    { label: "하자 통계 리포트", path: "/defect-report" },
  ]},
  { label: "CS·민원", path: "/cs", icon: MessageSquare },
  { label: "설정", path: "/settings", icon: Settings, children: [
    { label: "현장 기본 설정", path: "/settings" },
    { label: "담당자 계정 관리", path: "/accounts" },
  ]},
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { profile, signOut, roles } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedItem, setMobileExpandedItem] = useState<string | null>(null);

  const roleLabel = roles.includes("super_admin") ? "슈퍼관리자" : roles.includes("site_manager") ? "현장관리자" : roles.includes("cs_agent") ? "CS담당자" : "관리자";

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
      {/* Top Navigation */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center h-14 px-4">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-8 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">ON</span>
            </div>
            <span className="font-bold text-foreground text-sm">입주ON 관리자</span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const active = isActiveParent(item);

              if (item.children) {
                return (
                  <div key={item.path} className="relative"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setOpenDropdown(null)}
                      className={`px-3 py-2 text-sm whitespace-nowrap rounded-md transition-colors flex items-center gap-1 ${
                        active ? "text-primary font-semibold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}>
                      {item.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
                    </NavLink>

                    {openDropdown === item.label && (
                      <div className="absolute top-full right-0 lg:left-0 lg:right-auto mt-0 bg-card border border-border rounded-md shadow-xl py-1 min-w-[180px] z-50 backdrop-blur-none"
                        style={{ maxWidth: 'calc(100vw - 16px)', backgroundColor: 'hsl(var(--card))' }}>
                        {item.children.map(child => (
                          <NavLink key={child.path} to={child.path}
                            onClick={() => setOpenDropdown(null)}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              location.pathname === child.path ? "text-primary bg-accent font-medium" : "text-foreground hover:bg-accent"
                            }`}>
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
                  className={`px-3 py-2 text-sm whitespace-nowrap rounded-md transition-colors ${
                    active ? "text-primary font-semibold border-b-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile hamburger */}
          <button className="lg:hidden ml-auto mr-3 p-2 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* User Info - desktop */}
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

          {/* Mobile header right */}
          <div className="lg:hidden flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">{(profile?.name || "관")[0]}</span>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive" title="로그아웃">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <nav className="py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveParent(item);

                if (item.children) {
                  const expanded = mobileExpandedItem === item.label;
                  return (
                    <div key={item.path}>
                      <button
                        onClick={() => setMobileExpandedItem(expanded ? null : item.label)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          active ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-accent"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </button>
                      {expanded && (
                        <div className="bg-accent/30">
                          {item.children.map(child => (
                            <NavLink key={child.path} to={child.path}
                              onClick={closeMobileMenu}
                              className={`block pl-11 pr-4 py-2.5 text-sm transition-colors ${
                                location.pathname === child.path ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground"
                              }`}>
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
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      active ? "text-primary font-semibold bg-primary/5" : "text-foreground hover:bg-accent"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile user info */}
            <div className="border-t border-border px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">홍</span>
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">홍길동 담당</div>
                <div className="text-xs text-muted-foreground">○○건설 101</div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
