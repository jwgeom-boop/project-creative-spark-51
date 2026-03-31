import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning, 38 92% 50%))", "hsl(142 76% 36%)", "hsl(262 83% 58%)", "hsl(199 89% 48%)"];

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: units = [] } = useQuery({
    queryKey: ["dashboard-units"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units").select("dong, status, payment_status, permit_status, moving_status");
      if (error) throw error;
      return data;
    },
  });

  const { data: defects = [] } = useQuery({
    queryKey: ["dashboard-defects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("defects").select("status, defect_type, unit_id, content, report_date").order("report_date", { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: defectStats = [] } = useQuery({
    queryKey: ["dashboard-defect-stats"],
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

  const { data: movingSchedules = [] } = useQuery({
    queryKey: ["dashboard-moving"],
    queryFn: async () => {
      const { data, error } = await supabase.from("moving_schedules").select("status");
      if (error) throw error;
      return data;
    },
  });

  // Fetch unit info for defects display
  const defectUnitIds = defects.map((d: any) => d.unit_id).filter(Boolean);
  const { data: defectUnits = [] } = useQuery({
    queryKey: ["dashboard-defect-units", defectUnitIds],
    queryFn: async () => {
      if (defectUnitIds.length === 0) return [];
      const { data, error } = await supabase.from("units").select("id, dong, ho").in("id", defectUnitIds);
      if (error) throw error;
      return data;
    },
    enabled: defectUnitIds.length > 0,
  });

  const unitMap = new Map((defectUnits as any[]).map((u: any) => [u.id, `${u.dong}동 ${u.ho}호`]));

  const totalUnits = units.length;
  const moveInComplete = units.filter((u: any) => u.status === "입주완료").length;
  const inspComplete = units.filter((u: any) => ["입주완료", "사검완료"].includes(u.status)).length;
  const unpaid = units.filter((u: any) => u.payment_status === "미납").length;
  const paid = totalUnits - unpaid;
  const allDefects = defectStats.length;
  const unprocessedDefects = defectStats.filter((d: any) => d.status !== "완료").length;
  const completedDefects = allDefects - unprocessedDefects;
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
    { label: "잔금 미납", value: `${unpaid}세대`, color: "text-destructive", path: "/payments" },
    { label: "하자 미처리", value: `${unprocessedDefects}건`, color: "text-warning", path: "/defects" },
    { label: "이사 미예약", value: `${noMoving}세대`, color: "text-kpi-orange", path: "/moving" },
    { label: "입주증 미발급", value: `${noPermit}세대`, color: "text-kpi-purple", path: "/permits" },
  ];

  // Chart data
  const moveInPieData = [
    { name: "입주완료", value: moveInComplete },
    { name: "미입주", value: totalUnits - moveInComplete },
  ];
  const paymentPieData = [
    { name: "납부완료", value: paid },
    { name: "미납", value: unpaid },
  ];
  const defectPieData = [
    { name: "처리완료", value: completedDefects },
    { name: "미처리", value: unprocessedDefects },
  ];

  // Dong-based bar chart
  const dongMap = new Map<string, { total: number; complete: number }>();
  units.forEach((u: any) => {
    if (!dongMap.has(u.dong)) dongMap.set(u.dong, { total: 0, complete: 0 });
    const entry = dongMap.get(u.dong)!;
    entry.total++;
    if (u.status === "입주완료") entry.complete++;
  });
  const dongBarData = Array.from(dongMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "ko", { numeric: true }))
    .map(([dong, data]) => ({
      name: `${dong}동`,
      입주완료: data.complete,
      미입주: data.total - data.complete,
    }));

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      "미배정": "status-pending", "접수": "status-pending", "진행중": "status-progress", "완료": "status-complete",
    };
    return <span className={`status-badge ${map[status] || "status-pending"}`}>{status}</span>;
  };

  const PIE_COLORS = ["hsl(142 76% 36%)", "hsl(var(--muted-foreground))"];
  const PIE_COLORS_RED = ["hsl(142 76% 36%)", "hsl(var(--destructive))"];

  const renderMiniPie = (data: { name: string; value: number }[], colors: string[], label: string, percentage: number) => (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={40} dataKey="value" stroke="none">
              {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{percentage}%</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-2 text-[10px]">
        {data.map((d, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: colors[i] }} />
            {d.name} {d.value}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">홈 대시보드</h1>
        <p className="page-description">입주 현황을 한눈에 — 실시간 KPI · 미완료 세대 · 퀵 업무 실행</p>
      </div>

      {/* KPI Cards */}
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">현황 요약</h2>
          <div className="flex justify-around items-start">
            {renderMiniPie(moveInPieData, PIE_COLORS, "입주율", totalUnits ? Math.round((moveInComplete / totalUnits) * 100) : 0)}
            {renderMiniPie(paymentPieData, PIE_COLORS_RED, "납부율", totalUnits ? Math.round((paid / totalUnits) * 100) : 0)}
            {renderMiniPie(defectPieData, PIE_COLORS, "하자 처리율", allDefects ? Math.round((completedDefects / allDefects) * 100) : 0)}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">동별 입주 현황</h2>
          {dongBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dongBarData} barSize={20}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="입주완료" stackId="a" fill="hsl(142 76% 36%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="미입주" stackId="a" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">데이터 없음</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">퀵 업무 실행</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map((action) => (
            <button key={action.label} className="quick-action-btn" onClick={() => navigate(action.path)}>{action.label}</button>
          ))}
        </div>
      </div>

      {/* Incomplete Units */}
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

      {/* Tables */}
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
                <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">접수된 하자가 없습니다</td></tr>
              ) : defects.map((d: any) => (
                <tr key={d.id || d.content} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate("/defects")}>
                  <td className="text-xs">{unitMap.get(d.unit_id) || "—"}</td>
                  <td className="text-xs">{d.defect_type}</td>
                  <td className="text-xs max-w-[150px] truncate">{d.content}</td>
                  <td>{statusBadge(d.status)}</td>
                </tr>
              ))}
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
              {notices.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">발송된 안내문이 없습니다</td></tr>
              ) : notices.map((n: any, i: number) => (
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
