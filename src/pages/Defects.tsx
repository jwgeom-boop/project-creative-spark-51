import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { exportToExcel } from "@/lib/exportExcel";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";
import TablePagination, { paginate } from "@/components/TablePagination";

const getDefectStatusBadge = (status: string) => {
  if (status === "완료") return "status-complete";
  if (status === "처리중") return "status-pending";
  return "status-error";
};

const Defects = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterValues>({
    search: "", dong: "전체", status: searchParams.get("filter") || "전체",
  });
  const [page, setPage] = useState(1);

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
        dong: d.units?.dong || "",
        unit: `${d.units?.dong} ${d.units?.ho}`,
        type: d.defect_type, content: d.content,
        photos: d.photos?.length > 0 ? "📷" : "—",
        date: d.report_date || "",
        dateDisplay: d.report_date ? new Date(d.report_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        company: d.company || "미배정",
        visitDate: d.visit_date ? new Date(d.visit_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        status: d.status,
      }));
    },
  });

  const dongOptions = useMemo(() => [...new Set(defects.map((d: any) => d.dong))].filter(Boolean).sort(), [defects]);

  const summary = [
    { label: "전체 접수", value: `${defects.length}건` },
    { label: "미배정", value: `${defects.filter((d: any) => d.status === "미배정").length}건`, color: "text-destructive" },
    { label: "처리중", value: `${defects.filter((d: any) => d.status === "처리중").length}건`, color: "text-warning" },
    { label: "완료", value: `${defects.filter((d: any) => d.status === "완료").length}건`, color: "text-success" },
  ];

  const filtered = applyCommonFilters(defects, filters, {
    searchFields: ["unit", "content", "type"],
    statusField: "status",
    dongField: "dong",
    dateField: "date",
  });

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

      <AdvancedFilterBar
        config={{
          searchPlaceholder: "세대 / 하자내용 / 유형 검색",
          dongOptions,
          statusOptions: [
            { label: "전체", value: "전체" },
            { label: "미처리", value: "미처리" },
            { label: "미배정", value: "미배정" },
            { label: "처리중", value: "처리중" },
            { label: "완료", value: "완료" },
          ],
          statusLabel: "상태",
          showDateRange: true,
        }}
        values={filters}
        onChange={setFilters}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={() => toast.success("미배정 건이 일괄 배정되었습니다.")}>일괄 배정</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => {
            exportToExcel(filtered, [
              { key: "no", label: "번호" }, { key: "unit", label: "세대" }, { key: "type", label: "유형" },
              { key: "content", label: "하자내용" }, { key: "dateDisplay", label: "접수일" }, { key: "company", label: "담당업체" },
              { key: "visitDate", label: "방문예정일" }, { key: "status", label: "처리상태" },
            ], "하자보수");
            toast.success("엑셀 파일이 다운로드되었습니다.");
          }}><Download className="w-4 h-4" /> 엑셀</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>번호</th><th>세대</th><th>유형</th><th>하자 내용</th><th>사진</th><th>접수일</th><th>담당업체</th><th>방문예정일</th><th>처리상태</th><th>완료처리</th></tr></thead>
            <tbody>
              {paginate(filtered, page).map((d: any, i: number) => (
                <tr key={i}>
                  <td>{d.no}</td><td>{d.unit}</td><td>{d.type}</td><td>{d.content}</td><td>{d.photos}</td><td>{d.dateDisplay}</td>
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
      <TablePagination currentPage={page} totalItems={filtered.length} onPageChange={(p) => setPage(p)} />

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
