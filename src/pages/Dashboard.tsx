import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: units = [] } = useQuery({
    queryKey: ["dashboard-units"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("status, payment_status, permit_status, moving_status");
      if (error) throw error;
      return data;
    },
  });

  const { data: defects = [] } = useQuery({
    queryKey: ["dashboard-defects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("defects").select("status");
      if (error) throw error;
      return data;
    },
  });

  const { data: notices = [] } = useQuery({
    queryKey: ["dashboard-notices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notices").select("*").order("sent_date", { ascending: false }).limit(3);
      if (error) throw error;
      return data;
    },
  });

  const totalUnits = units.length;
  const moveInComplete = units.filter((u: any) => u.status === "입주완료").length;
  const inspComplete = units.filter((u: any) => ["입주완료", "사검완료"].includes(u.status)).length;
  const unpaid = units.filter((u: any) => u.payment_status === "미납").length;
  const unprocessedDefects = defects.filter((d: any) => d.status !== "완료").length;
  const noPermit = units.filter((u: any) => u.permit_status === "미발급").length;
  const noMoving = units.filter((u: any) => u.moving_status === "미예약").length;

  const kpiData = [
    { label: "입주 완료율", value: totalUnits ? Math.round((moveInComplete / totalUnits) * 100) : 0, unit: "%", color: "border-t-kpi-blue" },
    { label: "사검 완료율", value: totalUnits ? Math.round((inspComplete / totalUnits) * 100) : 0, unit: "%", color: "border-t-kpi-green" },
    { label: "잔금 미납", value: unpaid, unit: "세대", color: "border-t-kpi-red" },
    { label: "하자 미처리", value: unprocessedDefects, unit: "건", color: "border-t-kpi-orange" },
    { label: "입주증 미발급", value: noPermit, unit: "세대", color: "border-t-kpi-purple" },
    { label: "이사 미예약", value: noMoving, unit: "세대", color: "border-t-kpi-teal" },
  ];

  const quickActions = [
    { label: "안내문 발송", path: "/notices" },
    { label: "입주증 승인", path: "/permits" },
    { label: "하자 배정", path: "/defects" },
    { label: "연체 알림 발송", path: "/payments" },
    { label: "공지 등록", path: "/announcements" },
    { label: "사검 예약 확인", path: "/inspection" },
  ];

  const incompleteUnits = [
    { label: "잔금 미납", value: `${unpaid}세대`, color: "text-destructive", path: "/payments?filter=미납" },
    { label: "하자 미처리", value: `${unprocessedDefects}건`, color: "text-warning", path: "/defects?filter=미처리" },
    { label: "이사 미예약", value: `${noMoving}세대`, color: "text-kpi-orange", path: "/moving?filter=미예약" },
    { label: "입주증 미발급", value: `${noPermit}세대`, color: "text-success", path: "/permits?filter=미발급" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">홈 대시보드</h1>
        <p className="page-description">입주 현황을 한눈에 — 실시간 KPI · 미완료 세대 · 퀵 업무 실행</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className={`kpi-card border-t-4 ${kpi.color}`}>
            <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-3xl font-bold text-foreground">{kpi.value}</span>
              <span className="text-sm text-muted-foreground">{kpi.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">퀵 업무 실행</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map((action) => (
            <button key={action.label} className="quick-action-btn" onClick={() => navigate(action.path)}>{action.label}</button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">미완료 세대 즉시 확인</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {incompleteUnits.map((item) => (
            <div key={item.label} className="kpi-card cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all" onClick={() => navigate(item.path)}>
              <div className={`text-xs font-medium mb-1 ${item.color}`}>{item.label}</div>
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">최근 접수 — 하자·민원</h2>
            <button className="text-xs text-primary hover:underline" onClick={() => navigate("/defects")}>전체보기 →</button>
          </div>
          <table className="data-table">
            <thead><tr><th>세대</th><th>유형</th><th>내용</th><th>상태</th></tr></thead>
            <tbody>
              {defects.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">데이터 로딩 중...</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">최근 안내문 발송</h2>
            <button className="text-xs text-primary hover:underline" onClick={() => navigate("/notices")}>전체보기 →</button>
          </div>
          <table className="data-table">
            <thead><tr><th>발송일</th><th>제목</th><th>열람율</th></tr></thead>
            <tbody>
              {notices.map((n: any, i: number) => (
                <tr key={i} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate("/notices")}>
                  <td>{n.sent_date ? new Date(n.sent_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—"}</td>
                  <td>{n.title}</td>
                  <td>{n.read_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
