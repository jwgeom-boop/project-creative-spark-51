import { Search, Download, Camera } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const summaryData = [
  { label: "전체 접수", value: "142건" },
  { label: "미배정", value: "28건", color: "text-destructive" },
  { label: "처리중", value: "76건", color: "text-warning" },
  { label: "완료", value: "38건", color: "text-success" },
  { label: "평균처리일", value: "3.2일" },
];

const defectData = [
  { no: "001", unit: "101동 1503", type: "도배·도장", content: "욕실 타일 들뜸", photos: "📷", date: "03.28", company: "(주)리모코", visitDate: "04.02", status: "처리중" },
  { no: "002", unit: "102동 0804", type: "배관·수도", content: "주방 싱크대 누수", photos: "📷", date: "03.29", company: "미배정", visitDate: "—", status: "미배정" },
  { no: "003", unit: "103동 1201", type: "창호·문", content: "현관문 잠금 오작동", photos: "📷", date: "03.29", company: "(주)창호월드", visitDate: "03.31", status: "완료" },
  { no: "004", unit: "101동 0302", type: "전기", content: "콘센트 불량 2개소", photos: "📷", date: "03.30", company: "미배정", visitDate: "—", status: "미배정" },
  { no: "005", unit: "102동 1102", type: "바닥재", content: "거실 마루 들뜸", photos: "📷", date: "03.30", company: "(주)리모코", visitDate: "04.03", status: "처리중" },
];

const getDefectStatusBadge = (status: string) => {
  if (status === "완료") return "status-complete";
  if (status === "처리중") return "status-pending";
  return "status-error";
};

const statusFilterOptions = ["전체", "미처리", "미배정", "처리중", "완료"];

const Defects = () => {
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

  const filteredData = defectData.filter((d) => {
    if (statusFilter === "전체") return true;
    if (statusFilter === "미처리") return d.status !== "완료";
    if (statusFilter === "미배정") return d.status === "미배정";
    if (statusFilter === "처리중") return d.status === "처리중";
    if (statusFilter === "완료") return d.status === "완료";
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">하자보수 관리</h1>
        <p className="page-description">하자 접수 목록 · 업체 배정 · 처리 현황</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {summaryData.map(s => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card"><option>유형: 전체</option></select>
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card" value={statusFilter} onChange={(e) => handleFilterChange(e.target.value)}>
          {statusFilterOptions.map(o => <option key={o} value={o}>상태: {o}</option>)}
        </select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 검색" className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={() => toast.success("미배정 건이 일괄 배정되었습니다.")}>일괄 배정</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => toast.success("엑셀 파일이 다운로드되었습니다.")}><Download className="w-4 h-4" /> 엑셀</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>번호</th><th>세대</th><th>유형</th><th>하자 내용</th><th>사진</th><th>접수일</th><th>담당업체</th><th>방문예정일</th><th>처리상태</th><th>완료처리</th></tr>
          </thead>
          <tbody>
            {filteredData.map((d, i) => (
              <tr key={i}>
                <td>{d.no}</td>
                <td>{d.unit}</td>
                <td>{d.type}</td>
                <td>{d.content}</td>
                <td>{d.photos}</td>
                <td>{d.date}</td>
                <td className={d.company === "미배정" ? "text-destructive font-medium" : ""}>{d.company}</td>
                <td>{d.visitDate}</td>
                <td><span className={`status-badge ${getDefectStatusBadge(d.status)}`}>{d.status}</span></td>
                <td>
                  {d.status === "미배정" ? (
                    <button className="text-primary text-sm hover:underline">배정</button>
                  ) : d.status === "완료" ? (
                    <span className="text-success text-sm">완료✓</span>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="mt-4 bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-2">법정 하자보수 기간 자동 관리</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 마감재(도배·타일) — 1년 / 만료 D-30, D-7 자동 알림</li>
          <li>• 방수·창호·급배수 — 2년 / 만료 D-30, D-7 자동 알림</li>
          <li>• 구조체·외벽·기초 — 5년 / 만료 D-60, D-30 자동 알림</li>
        </ul>
      </div>
    </div>
  );
};

export default Defects;
