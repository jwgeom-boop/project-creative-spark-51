import { Search, Download, Settings, Plus } from "lucide-react";

const timeSlots = [
  { time: "09:00~10:00", checkin: "30/30", waiting: "0명" },
  { time: "10:00~11:00", checkin: "28/30", waiting: "2명" },
  { time: "11:00~12:00", checkin: "18/30", waiting: "6명" },
  { time: "13:00~14:00", checkin: "5/30", waiting: "12명" },
  { time: "14:00~15:00", checkin: "0/30", waiting: "0명" },
  { time: "15:00~16:00", checkin: "0/20", waiting: "0명" },
];

const waitingQueue = [
  { no: "★ 7", unit: "101동 0203", name: "홍길동", time: "11:00~12:00", checkin: "11:08", status: "점검중", action: "—" },
  { no: "8", unit: "101동 0501", name: "김철수", time: "11:00~12:00", checkin: "11:15", status: "대기중", action: "호출" },
  { no: "9", unit: "102동 1102", name: "이영희", time: "11:00~12:00", checkin: "11:22", status: "대기중", action: "호출" },
  { no: "10", unit: "103동 0804", name: "박민준", time: "11:00~12:00", checkin: "—", status: "미도착", action: "알림" },
];

const defectStats = [
  { type: "도배·도장", ratio: 32, color: "bg-kpi-blue" },
  { type: "바닥재", ratio: 18, color: "bg-kpi-green" },
  { type: "창호", ratio: 15, color: "bg-kpi-teal" },
  { type: "배관·수도", ratio: 22, color: "bg-kpi-orange" },
  { type: "전기", ratio: 8, color: "bg-kpi-purple" },
  { type: "기타", ratio: 5, color: "bg-muted-foreground" },
];

const Inspection = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">사전점검 예약 현황</h1>
        <p className="page-description">날짜·시간대별 예약 현황 · 실시간 대기열 모니터링</p>
      </div>

      {filterParam && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2 text-sm text-warning">
          <AlertCircle className="w-4 h-4" />
          <span>현재 필터: <strong>{filterParam}</strong> — 해당 조건의 세대를 확인하세요.</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input type="date" defaultValue="2026-03-31" className="px-3 py-2 border border-border rounded-md text-sm bg-card" />
        <div className="flex gap-1">
          {["1주", "1개월", "3개월"].map(p => (
            <button key={p} className="px-3 py-1.5 text-xs border border-border rounded-md bg-card hover:bg-accent">{p}</button>
          ))}
        </div>
        <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">검 색</button>
        <div className="ml-auto flex gap-2">
          <button className="px-3 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1"><Settings className="w-4 h-4" /> 예약 마감 설정</button>
          <button className="px-3 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1"><Plus className="w-4 h-4" /> 슬롯 추가</button>
          <button className="px-3 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1"><Download className="w-4 h-4" /> 엑셀 출력</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Slots */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">시간대별 예약 현황 — 2026.03.31</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>시간대</th><th>체크인</th><th>대기</th></tr></thead>
            <tbody>
              {timeSlots.map((s, i) => (
                <tr key={i}>
                  <td>{s.time}</td>
                  <td className="font-medium">{s.checkin}</td>
                  <td>{s.waiting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Waiting Queue */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">실시간 대기열 현황</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>대기번호</th><th>세대</th><th>입주자명</th><th>상태</th><th>호출</th></tr></thead>
            <tbody>
              {waitingQueue.map((q, i) => (
                <tr key={i}>
                  <td className="font-medium">{q.no}</td>
                  <td>{q.unit}</td>
                  <td>{q.name}</td>
                  <td><span className={`status-badge ${q.status === "점검중" ? "status-pending" : q.status === "대기중" ? "status-info" : "status-error"}`}>{q.status}</span></td>
                  <td>{q.action !== "—" ? <button className="text-primary text-sm hover:underline">{q.action}</button> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Defect Stats */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold mb-4">하자 유형 통계</h2>
          <div className="space-y-3">
            {defectStats.map((d) => (
              <div key={d.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{d.type}</span>
                  <span className="font-medium">{d.ratio}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full ${d.color}`} style={{ width: `${d.ratio}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inspection;
