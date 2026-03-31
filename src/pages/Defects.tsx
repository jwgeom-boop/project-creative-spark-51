import { Search, Download, Camera } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

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
  const [search, setSearch] = useState("");

  useEffect(() => { setStatusFilter(filterParam); }, [filterParam]);

  const { data: defects = [], isLoading } = useQuery({
    queryKey: ["defects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("defects")
        .select("*, units(dong, ho)")
        .order("report_date", { ascending: false });
      if (error) throw error;
      return data.map((d: any, i: number) => ({
        no: String(i + 1).padStart(3, "0"),
        unit: `${d.units?.dong} ${d.units?.ho}`,
        type: d.defect_type, content: d.content,
        photos: d.photos?.length > 0 ? "📷" : "—",
        date: d.report_date ? new Date(d.report_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        company: d.company || "미배정",
        visitDate: d.visit_date ? new Date(d.visit_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        status: d.status,
      }));
    },
  });

  const summary = [
    { label: "전체 접수", value: `${defects.length}건` },
    { label: "미배정", value: `${defects.filter((d: any) => d.status === "미배정").length}건`, color: "text-destructive" },
    { label: "처리중", value: `${defects.filter((d: any) => d.status === "처리중").length}건`, color: "text-warning" },
    { label: "완료", value: `${defects.filter((d: any) => d.status === "완료").length}건`, color: "text-success" },
  ];

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "전체") { searchParams.delete("filter"); } else { searchParams.set("filter", value); }
    setSearchParams(searchParams, { replace: true });
  };

  const filteredData = defects.filter((d: any) => {
    if (statusFilter === "전체") return true;
    if (statusFilter === "미처리") return d.status !== "완료";
    if (statusFilter === "미배정") return d.status === "미배정";
    if (statusFilter === "처리중") return d.status === "처리중";
    if (statusFilter === "완료") return d.status === "완료";
    return true;
  }).filter((d: any) => !search || d.unit.includes(search) || d.content.includes(search));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">하자보수 관리</h1>
        <p className="page-description">하자 접수 목록 · 업체 배정 · 처리 현황</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card" value={statusFilter} onChange={(e) => handleFilterChange(e.target.value)}>
          {statusFilterOptions.map(o => <option key={o} value={o}>상태: {o}</option>)}
        </select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·내용 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={() => toast.success("미배정 건이 일괄 배정되었습니다.")}>일괄 배정</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => toast.success("엑셀 파일이 다운로드되었습니다.")}><Download className="w-4 h-4" /> 엑셀</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>번호</th><th>세대</th><th>유형</th><th>하자 내용</th><th>사진</th><th>접수일</th><th>담당업체</th><th>방문예정일</th><th>처리상태</th><th>완료처리</th></tr></thead>
            <tbody>
              {filteredData.map((d: any, i: number) => (
                <tr key={i}>
                  <td>{d.no}</td><td>{d.unit}</td><td>{d.type}</td><td>{d.content}</td><td>{d.photos}</td><td>{d.date}</td>
                  <td className={d.company === "미배정" ? "text-destructive font-medium" : ""}>{d.company}</td>
                  <td>{d.visitDate}</td>
                  <td><span className={`status-badge ${getDefectStatusBadge(d.status)}`}>{d.status}</span></td>
                  <td>
                    {d.status === "미배정" ? <button className="text-primary text-sm hover:underline" onClick={() => toast.success("업체가 배정되었습니다.")}>배정</button>
                      : d.status === "완료" ? <span className="text-success text-sm">완료✓</span> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
