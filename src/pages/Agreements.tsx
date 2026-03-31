import { Search, Send, Download, FileText } from "lucide-react";

const agreementStats = [
  { name: "주차장 이용 동의서", signed: 278, total: 300, percent: 93 },
  { name: "층간소음 준수 확약서", signed: 241, total: 300, percent: 80 },
  { name: "커뮤니티 이용 규칙", signed: 256, total: 300, percent: 85 },
  { name: "개인정보 수집 동의", signed: 289, total: 300, percent: 96 },
  { name: "입주민 공동규약", signed: 198, total: 300, percent: 66 },
];

const signingData = [
  { unit: "101동 0101", name: "홍길동", parking: true, noise: true, community: true, privacy: true, common: true, date: "03.28" },
  { unit: "101동 0102", name: "김철수", parking: true, noise: false, community: true, privacy: true, common: false, date: "일부" },
  { unit: "102동 0201", name: "이영희", parking: true, noise: true, community: false, privacy: true, common: false, date: "일부" },
  { unit: "102동 0302", name: "박민준", parking: false, noise: false, community: false, privacy: true, common: false, date: "—" },
  { unit: "103동 1503", name: "최수연", parking: true, noise: true, community: true, privacy: true, common: true, date: "03.27" },
];

const Agreements = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">전자 동의서 관리</h1>
        <p className="page-description">서명 현황 조회 · 미서명 알림 발송 · PDF 다운로드 · 항목별 관리</p>
      </div>

      {/* Agreement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {agreementStats.map((a) => (
          <div key={a.name} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{a.name}</div>
            <div className="text-lg font-bold text-foreground">{a.signed}/{a.total} <span className="text-sm font-normal text-muted-foreground">({a.percent}%)</span></div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div className={`h-1.5 rounded-full ${a.percent >= 90 ? "bg-success" : a.percent >= 75 ? "bg-primary" : "bg-warning"}`} style={{ width: `${a.percent}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card"><option>동의서 종류: 전체</option></select>
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card"><option>서명상태: 미서명</option></select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 입력" className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md flex items-center gap-1"><Send className="w-4 h-4" /> 미서명 알림 발송</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1"><Download className="w-4 h-4" /> PDF 일괄 다운로드</button>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">서명 추가</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>세대</th><th>입주자</th><th>주차장</th><th>층간소음</th><th>커뮤니티</th><th>개인정보</th><th>공동규약</th><th>서명일시</th><th>미서명 알림</th></tr>
          </thead>
          <tbody>
            {signingData.map((s, i) => (
              <tr key={i}>
                <td>{s.unit}</td>
                <td className="font-medium">{s.name}</td>
                <td>{s.parking ? <span className="text-success">✔</span> : <span className="text-destructive">✗</span>}</td>
                <td>{s.noise ? <span className="text-success">✔</span> : <span className="text-destructive">✗</span>}</td>
                <td>{s.community ? <span className="text-success">✔</span> : <span className="text-destructive">✗</span>}</td>
                <td>{s.privacy ? <span className="text-success">✔</span> : <span className="text-destructive">✗</span>}</td>
                <td>{s.common ? <span className="text-success">✔</span> : <span className="text-destructive">✗</span>}</td>
                <td>{s.date}</td>
                <td>
                  {s.date === "03.28" || s.date === "03.27" ? <span className="text-success text-sm">✔</span> : (
                    <button className="text-primary text-sm hover:underline">발송</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-accent rounded-lg text-sm text-muted-foreground">
        💡 현장 설정에서 동의서 항목을 추가·수정할 수 있습니다. 변경 후 미서명 세대에 자동으로 재서명 요청이 발송됩니다.
      </div>
    </div>
  );
};

export default Agreements;
