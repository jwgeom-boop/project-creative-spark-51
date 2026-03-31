import { useNavigate } from "react-router-dom";

const kpiData = [
  { label: "입주 완료율", value: "68", unit: "%", color: "border-t-kpi-blue" },
  { label: "사검 완료율", value: "82", unit: "%", color: "border-t-kpi-green" },
  { label: "잔금 미납", value: "14", unit: "세대", color: "border-t-kpi-red" },
  { label: "하자 미처리", value: "37", unit: "건", color: "border-t-kpi-orange" },
  { label: "오늘 방문자", value: "48", unit: "명", color: "border-t-kpi-purple" },
  { label: "이사 예약", value: "12", unit: "세대", color: "border-t-kpi-teal" },
  { label: "동의서 미서명", value: "23", unit: "세대", color: "border-t-kpi-yellow" },
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
  { label: "잔금 미납", value: "14세대", color: "text-destructive", path: "/payments?filter=미납" },
  { label: "동의서 미서명", value: "23세대", color: "text-warning", path: "/agreements?filter=미서명" },
  { label: "사검 미예약", value: "8세대", color: "text-destructive", path: "/inspection?filter=미예약" },
  { label: "하자 미처리", value: "37건", color: "text-warning", path: "/defects?filter=미처리" },
  { label: "이사 미예약", value: "18세대", color: "text-kpi-orange", path: "/moving?filter=미예약" },
  { label: "입주증 미발급", value: "5세대", color: "text-success", path: "/permits?filter=미발급" },
];

const recentDefects = [
  { no: 1, unit: "101동 1503", type: "하자", content: "욕실 타일 들뜸", company: "(주)하자보수", date: "03.30", status: "처리중", statusColor: "status-pending" },
  { no: 2, unit: "102동 0804", type: "민원", content: "잔금 계좌 문의", company: "—", date: "03.30", status: "미처리", statusColor: "status-error" },
  { no: 3, unit: "103동 1201", type: "하자", content: "현관문 잠금 오작동", company: "(주)하자보수", date: "03.29", status: "완료", statusColor: "status-complete" },
];

const recentNotices = [
  { date: "03.30", title: "잔금 납부 기한 안내", rate: "74%" },
  { date: "03.28", title: "사전점검 일정 안내", rate: "91%" },
  { date: "03.25", title: "이사 차량 등록 안내", rate: "83%" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">홈 대시보드</h1>
        <p className="page-description">입주 현황을 한눈에 — 실시간 KPI · 미완료 세대 · 퀵 업무 실행</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
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

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">퀵 업무 실행</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {quickActions.map((action) => (
            <button key={action.label} className="quick-action-btn" onClick={() => navigate(action.path)}>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Incomplete Units */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">미완료 세대 즉시 확인</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {incompleteUnits.map((item) => (
            <div
              key={item.label}
              className="kpi-card cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
              onClick={() => navigate(item.path)}
            >
              <div className={`text-xs font-medium mb-1 ${item.color}`}>{item.label}</div>
              <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">최근 접수 — 하자·민원</h2>
            <button className="text-xs text-primary hover:underline" onClick={() => navigate("/defects")}>전체보기 →</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th><th>세대</th><th>유형</th><th>내용</th><th>담당업체</th><th>접수일</th><th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recentDefects.map((item) => (
                <tr key={item.no} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate("/defects")}>
                  <td>{item.no}</td>
                  <td>{item.unit}</td>
                  <td>{item.type}</td>
                  <td>{item.content}</td>
                  <td>{item.company}</td>
                  <td>{item.date}</td>
                  <td><span className={`status-badge ${item.statusColor}`}>{item.status}</span></td>
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
            <thead>
              <tr>
                <th>발송일</th><th>제목</th><th>열람율</th>
              </tr>
            </thead>
            <tbody>
              {recentNotices.map((item, i) => (
                <tr key={i} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate("/notices")}>
                  <td>{item.date}</td>
                  <td>{item.title}</td>
                  <td>{item.rate}</td>
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
