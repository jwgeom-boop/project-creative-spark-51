import { Search, Download, Send, ArrowRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

const summary = [
  { label: "전체 세대", value: "300세대" },
  { label: "발급 완료", value: "187세대", color: "text-success" },
  { label: "승인 대기", value: "58세대", color: "text-warning" },
  { label: "미발급", value: "55세대", color: "text-destructive" },
  { label: "납부 미확인", value: "28세대", color: "text-muted-foreground" },
];

const permitData = [
  { unit: "101동 0101", name: "홍길동", payment: "납부완료", confirm: "확인완료", approvedAt: "03.28 14:00", status: "발급완료", expiry: "2026.12.31", qr: true },
  { unit: "101동 0102", name: "김철수", payment: "미납", confirm: "—", approvedAt: "—", status: "미발급", expiry: "—", qr: false },
  { unit: "102동 0201", name: "이영희", payment: "납부완료", confirm: "확인완료", approvedAt: "03.29 09:30", status: "발급완료", expiry: "2026.12.31", qr: true },
  { unit: "102동 0302", name: "박민준", payment: "납부완료", confirm: "승인대기", approvedAt: "—", status: "승인대기", expiry: "—", qr: false },
  { unit: "103동 1503", name: "최수연", payment: "납부완료", confirm: "승인대기", approvedAt: "—", status: "승인대기", expiry: "—", qr: false },
];

const getStatusBadge = (s: string) => {
  if (s.includes("완료")) return "status-complete";
  if (s.includes("대기")) return "status-pending";
  return "status-error";
};

const statusFilterOptions = ["전체", "발급완료", "승인대기", "미발급"];

const Permits = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") || "전체";
  const [statusFilter, setStatusFilter] = useState(filterParam);

  useEffect(() => {
    setStatusFilter(filterParam);
  }, [filterParam]);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "전체") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filteredData = permitData.filter((p) => {
    if (statusFilter === "전체") return true;
    if (statusFilter === "미발급") return p.status === "미발급";
    if (statusFilter === "승인대기") return p.status === "승인대기";
    if (statusFilter === "발급완료") return p.status === "발급완료";
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">입주증 발급 현황</h1>
        <p className="page-description">납부확인 → 승인 → 자동 발급 프로세스 · 미발급 세대 일괄 처리</p>
      </div>

      {/* Process Flow */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3">입주증 발급 프로세스</h2>
        <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
          {[
            { step: "잔금 납부", sub: "(입주자)" },
            { step: "담당자 납부 확인", sub: "" },
            { step: "앱 승인 처리", sub: "" },
            { step: "입주증 QR 자동 생성", sub: "" },
            { step: "입주자 앱 수신", sub: "" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="px-3 py-2 bg-primary/10 text-primary rounded-md text-center">
                <div className="font-medium">{s.step}</div>
                {s.sub && <div className="text-xs text-muted-foreground">{s.sub}</div>}
              </div>
              {i < 4 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card"><option>발급상태: 승인대기</option></select>
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card"><option>동 선택: 전체</option></select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 입력" className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">납부확인 후 일괄 승인</button>
          <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md flex items-center gap-1"><Send className="w-4 h-4" /> 미발급 알림 발송</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>세대</th><th>입주자</th><th>잔금납부</th><th>납부확인</th><th>승인일시</th><th>발급상태</th><th>유효기간</th><th>QR</th><th>관리</th></tr>
          </thead>
          <tbody>
            {permitData.map((p, i) => (
              <tr key={i}>
                <td>{p.unit}</td>
                <td className="font-medium">{p.name}</td>
                <td><span className={`status-badge ${getStatusBadge(p.payment)}`}>{p.payment}</span></td>
                <td>{p.confirm}</td>
                <td>{p.approvedAt}</td>
                <td><span className={`status-badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                <td>{p.expiry}</td>
                <td>{p.qr ? <button className="text-primary text-sm hover:underline">QR보기</button> : "—"}</td>
                <td>
                  {p.status.includes("대기") ? (
                    <button className="text-primary text-sm hover:underline">승인</button>
                  ) : p.status.includes("완료") ? (
                    <button className="text-muted-foreground text-sm hover:underline">재발급</button>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Permits;
