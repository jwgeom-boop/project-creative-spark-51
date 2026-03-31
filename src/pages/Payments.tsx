import { Search, Download, Send } from "lucide-react";

const summaryData = [
  { label: "전체 세대", value: "300세대" },
  { label: "납부완료", value: "241세대", color: "text-success" },
  { label: "미납", value: "45세대", color: "text-warning" },
  { label: "연체(3일↑)", value: "14세대", color: "text-destructive" },
  { label: "납부율", value: "80%" },
];

const paymentData = [
  { unit: "101동 0101", name: "홍길동", balance: "2,600,000", mid: "완료", option: "850,000", ext: "1,200,000", etc: "200,000", total: "4,850,000", status: "납부완료", confirm: "승인완료" },
  { unit: "101동 0102", name: "김철수", balance: "2,600,000", mid: "완료", option: "미선택", ext: "750,000", etc: "200,000", total: "3,550,000", status: "미 납", confirm: "승인대기" },
  { unit: "102동 0201", name: "이영희", balance: "2,600,000", mid: "완료", option: "850,000", ext: "미선택", etc: "200,000", total: "3,650,000", status: "납부완료", confirm: "승인완료" },
  { unit: "102동 0302", name: "박민준", balance: "2,600,000", mid: "완료", option: "850,000", ext: "1,200,000", etc: "200,000", total: "4,850,000", status: "연체 5일", confirm: "승인대기" },
  { unit: "103동 1503", name: "최수연", balance: "2,600,000", mid: "완료", option: "미선택", ext: "미선택", etc: "200,000", total: "2,800,000", status: "미 납", confirm: "승인대기" },
];

const getPaymentStatusBadge = (status: string) => {
  if (status === "납부완료" || status === "승인완료") return "status-complete";
  if (status.includes("연체")) return "status-error";
  return "status-pending";
};

const Payments = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">잔금 납부 현황</h1>
        <p className="page-description">세대별 납부 상태 조회 · 미납 알림 · 승인 처리</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {summaryData.map((s) => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card">
          <option>납부상태: 전체</option>
        </select>
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card">
          <option>동 선택: 전체</option>
        </select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 입력" className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md flex items-center gap-1"><Send className="w-4 h-4" /> 미납 알림 일괄발송</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1"><Download className="w-4 h-4" /> 엑셀 다운로드</button>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">납부 승인</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>세대</th><th>입주자</th><th>잔금</th><th>중도금</th><th>옵션비</th><th>확장비</th><th>기타부담금</th><th>합계</th><th>납부상태</th><th>납부확인</th>
            </tr>
          </thead>
          <tbody>
            {paymentData.map((p, i) => (
              <tr key={i}>
                <td>{p.unit}</td>
                <td className="font-medium">{p.name}</td>
                <td className="text-right">{p.balance}</td>
                <td>{p.mid}</td>
                <td className="text-right">{p.option}</td>
                <td className="text-right">{p.ext}</td>
                <td className="text-right">{p.etc}</td>
                <td className="text-right font-medium">{p.total}</td>
                <td><span className={`status-badge ${getPaymentStatusBadge(p.status)}`}>{p.status}</span></td>
                <td><span className={`status-badge ${getPaymentStatusBadge(p.confirm)}`}>{p.confirm}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
