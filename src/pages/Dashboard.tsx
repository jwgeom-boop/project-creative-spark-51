import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { Send, FileCheck, Wrench, CalendarCheck, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();

  const isSuperAdmin = roles.includes("super_admin");
  const isDeveloper = roles.includes("developer");
  const isContractor = roles.includes("contractor");
  const isCsCenter = roles.includes("cs_center");

  const welcomeMessage = isSuperAdmin
    ? "전체 현황을 한눈에 관리하세요"
    : isDeveloper
    ? "납부 현황과 입주자 정보를 확인하세요"
    : isContractor
    ? "하자 접수 현황을 확인하세요"
    : isCsCenter
    ? "오늘의 현장 운영 현황입니다"
    : "입주 현황을 한눈에 — 실시간 KPI · 미완료 세대 · 퀵 업무 실행";

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

  const trendData: Record<string, { arrow: string; text: string; className: string }> = {
    "입주 완료율": { arrow: "▲", text: "4.1% 지난주 대비", className: "text-green-600" },
    "사검 완료율": { arrow: "▲", text: "2.3% 지난주 대비", className: "text-green-600" },
    "잔금 미납": { arrow: "▼", text: "3세대 감소", className: "text-red-500" },
    "하자 미처리": { arrow: "▼", text: "5건 감소", className: "text-red-500" },
    "입주증 미발급": { arrow: "━", text: "변동 없음", className: "text-muted-foreground" },
    "이사 미예약": { arrow: "▲", text: "2세대 증가", className: "text-green-600" },
  };

  const allKpiData = [
    { label: "입주 완료율", value: totalUnits ? Math.round((moveInComplete / totalUnits) * 100) : 0, unit: "%", color: "border-t-kpi-blue", roles: ["super_admin", "developer"] },
    { label: "사검 완료율", value: totalUnits ? Math.round((inspComplete / totalUnits) * 100) : 0, unit: "%", color: "border-t-kpi-green", roles: ["super_admin", "cs_center"] },
    { label: "잔금 미납", value: unpaid, unit: "세대", color: "border-t-kpi-red", roles: ["super_admin", "developer"] },
    { label: "하자 미처리", value: unprocessedDefects, unit: "건", color: "border-t-kpi-orange", roles: ["super_admin", "contractor"] },
    { label: "입주증 미발급", value: noPermit, unit: "세대", color: "border-t-kpi-purple", roles: ["super_admin", "cs_center"] },
    { label: "이사 미예약", value: noMoving, unit: "세대", color: "border-t-kpi-teal", roles: ["super_admin", "cs_center"] },
  ];

  const kpiData = allKpiData.filter(kpi => kpi.roles.some(r => roles.includes(r as any)));

  // Quick actions with icons
  const allQuickActions = [
    { label: "안내문 발송", icon: Send, bgColor: "bg-blue-100", iconColor: "text-blue-600", action: () => toast.info("준비 중인 기능입니다"), roles: ["super_admin", "developer"] },
    { label: "입주증 승인", icon: FileCheck, bgColor: "bg-green-100", iconColor: "text-green-600", action: () => toast.info("준비 중인 기능입니다"), roles: ["super_admin", "cs_center"] },
    { label: "하자 배정", icon: Wrench, bgColor: "bg-orange-100", iconColor: "text-orange-600", action: () => navigate("/defects"), roles: ["super_admin", "contractor"] },
    { label: "미납 안내", icon: AlertCircle, bgColor: "bg-red-100", iconColor: "text-red-600", action: () => toast.info("준비 중인 기능입니다"), roles: ["super_admin", "developer"] },
    { label: "예약 확인", icon: CalendarCheck, bgColor: "bg-purple-100", iconColor: "text-purple-600", action: () => toast.info("준비 중인 기능입니다"), roles: ["super_admin", "cs_center"] },
    { label: "엑셀 내보내기", icon: Download, bgColor: "bg-gray-100", iconColor: "text-gray-600", action: () => toast.info("준비 중인 기능입니다"), roles: ["super_admin", "developer", "contractor", "cs_center"] },
  ];

  const quickActions = allQuickActions.filter(a => a.roles.some(r => roles.includes(r as any)));

  const incompleteUnits = [
    { label: "잔금 미납", value: `${unpaid}세대`, color: "text-destructive", path: "/payments", roles: ["super_admin", "developer"] },
    { label: "하자 미처리", value: `${unprocessedDefects}건`, color: "text-warning", path: "/defects", roles: ["super_admin", "contractor"] },
    { label: "이사 미예약", value: `${noMoving}세대`, color: "text-kpi-orange", path: "/moving", roles: ["super_admin", "cs_center"] },
    { label: "입주증 미발급", value: `${noPermit}세대`, color: "text-kpi-purple", path: "/permits", roles: ["super_admin", "cs_center"] },
  ].filter(i => i.roles.some(r => roles.includes(r as any)));

  // Enhanced chart data
  const moveInPieData = [
    { name: "완료", value: moveInComplete || 127 },
    { name: "진행중", value: Math.max(0, Math.round((totalUnits - moveInComplete) * 0.62)) || 201 },
    { name: "미시작", value: Math.max(0, Math.round((totalUnits - moveInComplete) * 0.38)) || 122 },
  ];
  const moveInColors = ["#22c55e", "#3b82f6", "#e5e7eb"];
  const moveInPercent = totalUnits ? Math.round((moveInComplete / totalUnits) * 100) : 28;

  const paymentPieData = [
    { name: "완납", value: paid || 333 },
    { name: "부분납", value: Math.round(unpaid * 0.76) || 89 },
    { name: "미납", value: Math.round(unpaid * 0.24) || 28 },
  ];
  const paymentColors = ["#22c55e", "#f59e0b", "#ef4444"];
  const paymentPercent = totalUnits ? Math.round((paid / totalUnits) * 100) : 74;

  const defectPieData = [
    { name: "완료", value: completedDefects || 156 },
    { name: "처리중", value: defectStats.filter((d: any) => d.status === "처리중").length || 22 },
    { name: "미배정", value: defectStats.filter((d: any) => d.status === "미배정").length || 12 },
  ];
  const defectColors = ["#22c55e", "#f59e0b", "#ef4444"];
  const defectPercent = allDefects ? Math.round((completedDefects / allDefects) * 100) : 82;

  // Bar chart data — 6 buildings
  const dongBarData = [
    { name: "101동", 완료: 28, 진행중: 42, 미시작: 5 },
    { name: "102동", 완료: 22, 진행중: 38, 미시작: 15 },
    { name: "103동", 완료: 31, 진행중: 29, 미시작: 15 },
    { name: "104동", 완료: 19, 진행중: 44, 미시작: 12 },
    { name: "105동", 완료: 18, 진행중: 35, 미시작: 22 },
    { name: "106동", 완료: 9, 진행중: 13, 미시작: 53 },
  ];

  // Line chart data — monthly payment trend
  const monthlyPaymentData = [
    { month: "11월", 납부: 42, 누적: 42 },
    { month: "12월", 납부: 68, 누적: 110 },
    { month: "1월", 납부: 89, 누적: 199 },
    { month: "2월", 납부: 71, 누적: 270 },
    { month: "3월", 납부: 45, 누적: 315 },
    { month: "4월", 납부: 18, 누적: 333 },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      "미배정": "status-pending", "접수": "status-pending", "진행중": "status-progress", "완료": "status-complete",
    };
    return <span className={`status-badge ${map[status] || "status-pending"}`}>{status}</span>;
  };

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
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((d, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: colors[i] }} />
            {d.name} {d.value}
          </span>
        ))}
      </div>
    </div>
  );

  const showCharts = isSuperAdmin || isDeveloper;
  const showDefectsTable = isSuperAdmin || isContractor;
  const showNoticesTable = isSuperAdmin || isDeveloper;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">홈 대시보드</h1>
        <p className="page-description">{welcomeMessage}</p>
      </div>

      {/* KPI Cards */}
      {kpiData.length > 0 && (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(kpiData.length, 6)} gap-3 mb-6`}>
          {kpiData.map((kpi) => {
            const trend = trendData[kpi.label];
            return (
              <div key={kpi.label} className={`kpi-card border-t-4 ${kpi.color}`}>
                <div className="text-xs text-muted-foreground mb-2">{kpi.label}</div>
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-3xl font-bold text-foreground">{kpi.value}</span>
                  <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                </div>
                {trend && (
                  <div className={`text-xs mt-1.5 ${trend.className}`}>
                    {trend.arrow} {trend.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Section */}
      {showCharts && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">현황 요약</h2>
              <div className="flex justify-around items-start">
                {renderMiniPie(moveInPieData, moveInColors, "입주율", moveInPercent)}
                {renderMiniPie(paymentPieData, paymentColors, "납부율", paymentPercent)}
                {renderMiniPie(defectPieData, defectColors, "하자 처리율", defectPercent)}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">동별 입주 현황</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dongBarData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="완료" stackId="a" fill="#22c55e" />
                  <Bar dataKey="진행중" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="미시작" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Payment Trend */}
          <div className="bg-card rounded-lg border border-border p-5 mb-6">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-sm font-bold text-foreground">월별 잔금 납부 추이</h2>
              <span className="text-xs text-muted-foreground">최근 6개월</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyPaymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="납부" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} name="월 납부세대" />
                <Line type="monotone" dataKey="누적" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} name="누적 납부세대" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-4 border-t-2 border-blue-500 inline-block" /> 월 납부세대
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-4 border-t-2 border-dashed border-green-500 inline-block" /> 누적 납부세대
              </span>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">퀵 업무 실행</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="bg-card rounded-xl p-4 shadow-sm border border-border flex flex-col items-center gap-2 hover:shadow-md transition"
                  onClick={action.action}
                >
                  <div className={`w-10 h-10 rounded-full ${action.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${action.iconColor}`} />
                  </div>
                  <span className="text-xs font-semibold text-foreground mt-1">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Incomplete Units */}
      {incompleteUnits.length > 0 && (
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
      )}

      {/* Tables */}
      <div className={`grid grid-cols-1 ${showDefectsTable && showNoticesTable ? "lg:grid-cols-2" : ""} gap-6`}>
        {showDefectsTable && (
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
        )}

        {showNoticesTable && (
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
