import { NavLink, useLocation } from "react-router-dom";
import { Building2, Users, ClipboardCheck, Truck, CreditCard, Bell, Wrench, MessageSquare, Settings, LayoutDashboard } from "lucide-react";

const navItems = [
  { label: "홈 대시보드", path: "/", icon: LayoutDashboard },
  { label: "현장관리", path: "/sites", icon: Building2 },
  { label: "입주자관리", path: "/residents", icon: Users },
  { label: "사전점검", path: "/inspection", icon: ClipboardCheck },
  { label: "이사관리", path: "/moving", icon: Truck },
  { label: "납부관리", path: "/payments", icon: CreditCard },
  { label: "안내·공지", path: "/notices", icon: Bell },
  { label: "하자보수", path: "/defects", icon: Wrench },
  { label: "CS·민원", path: "/cs", icon: MessageSquare },
  { label: "설정", path: "/settings", icon: Settings },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

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

          {/* Nav Items */}
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 text-sm whitespace-nowrap rounded-md transition-colors ${
                    isActive
                      ? "text-primary font-semibold border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs font-medium text-foreground">홍길동 담당</div>
              <div className="text-xs text-muted-foreground">○○건설 101</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">홍</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
