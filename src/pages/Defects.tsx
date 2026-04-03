import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportToExcel } from "@/lib/exportExcel";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";
import TablePagination, { paginate } from "@/components/TablePagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DefectItem {
  id: string;
  no: string;
  dong: string;
  ho: string;
  unit: string;
  type: string;
  content: string;
  photos: string;
  date: string;
  dateDisplay: string;
  dateFormatted: string;
  company: string;
  visitDate: string;
  visitDateRaw: string | null;
  status: string;
  residentName: string;
  residentPhone: string;
}

const getDefectStatusBadge = (status: string) => {
  if (status === "완료") return "status-complete";
  if (status === "처리중") return "status-pending";
  return "status-error";
};

const getStatusColor = (status: string) => {
  if (status === "완료") return "bg-green-100 text-green-700";
  if (status === "처리중") return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const Defects = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterValues>({
    search: "", dong: "전체", status: searchParams.get("filter") || "전체",
  });
  const [page, setPage] = useState(1);
  const [selectedDefect, setSelectedDefect] = useState<DefectItem | null>(null);
  const [assignee, setAssignee] = useState("");
  const [visitDateInput, setVisitDateInput] = useState("");
  const [memo, setMemo] = useState("");

  const { data: defects = [], isLoading } = useQuery({
    queryKey: ["defects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("defects")
        .select("*, units(dong, ho, residents(name, phone))")
        .order("report_date", { ascending: false });
      if (error) throw error;
      return data.map((d: any, i: number) => ({
        id: d.id,
        no: String(i + 1).padStart(3, "0"),
        dong: d.units?.dong || "",
        ho: d.units?.ho || "",
        unit: `${d.units?.dong || ""} ${d.units?.ho || ""}`,
        type: d.defect_type,
        content: d.content,
        photos: d.photos?.length > 0 ? "📷" : "—",
        date: d.report_date || "",
        dateDisplay: d.report_date ? new Date(d.report_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        dateFormatted: d.report_date ? new Date(d.report_date).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "") : "—",
        company: d.company || "미배정",
        visitDate: d.visit_date ? new Date(d.visit_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        visitDateRaw: d.visit_date,
        visitDateFormatted: d.visit_date ? new Date(d.visit_date).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "") : "—",
        status: d.status,
        residentName: d.units?.residents?.[0]?.name || "—",
        residentPhone: d.units?.residents?.[0]?.phone || "—",
      })) as DefectItem[];
    },
  });

  const dongOptions = useMemo(() => [...new Set(defects.map((d) => d.dong))].filter(Boolean).sort(), [defects]);

  const summary = [
    { label: "전체 접수", value: `${defects.length}건` },
    { label: "미배정", value: `${defects.filter((d) => d.status === "미배정").length}건`, color: "text-destructive" },
    { label: "처리중", value: `${defects.filter((d) => d.status === "처리중").length}건`, color: "text-warning" },
    { label: "완료", value: `${defects.filter((d) => d.status === "완료").length}건`, color: "text-success" },
  ];

  const filtered = applyCommonFilters(defects, filters, {
    searchFields: ["unit", "content", "type"],
    statusField: "status",
    dongField: "dong",
    dateField: "date",
  });

  const openDetail = (d: DefectItem) => {
    setSelectedDefect(d);
    setAssignee("");
    setVisitDateInput(d.visitDateRaw || "");
    setMemo("");
  };

  const handleAction = async () => {
    if (!selectedDefect) return;
    const newStatus = selectedDefect.status === "미배정" ? "처리중" : "완료";
    const updateData: any = { status: newStatus };
    if (newStatus === "처리중" && visitDateInput) {
      updateData.visit_date = visitDateInput;
    }
    if (newStatus === "처리중" && assignee) {
      updateData.company = assignee;
    }

    const { error } = await supabase
      .from("defects")
      .update(updateData)
      .eq("id", selectedDefect.id);

    if (error) {
      toast.error("업데이트에 실패했습니다.");
      return;
    }

    toast.success(newStatus === "처리중" ? "담당자가 배정되었습니다" : "하자가 완료 처리되었습니다");
    setSelectedDefect(null);
    queryClient.invalidateQueries({ queryKey: ["defects"] });
  };

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
        onChange={(v) => { setFilters(v); setPage(1); }}
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
                <tr key={i} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(d)}>
                  <td>{d.no}</td><td>{d.unit}</td><td>{d.type}</td><td>{d.content}</td><td>{d.photos}</td><td>{d.dateDisplay}</td>
                  <td className={d.company === "미배정" ? "text-destructive font-medium" : ""}>{d.company}</td>
                  <td>{d.visitDate}</td>
                  <td><span className={`status-badge ${getDefectStatusBadge(d.status)}`}>{d.status}</span></td>
                  <td>
                    {d.status === "미배정" ? <button className="text-primary text-sm hover:underline" onClick={(e) => { e.stopPropagation(); openDetail(d); }}>배정</button>
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

      {/* Defect Detail Modal */}
      <Dialog open={!!selectedDefect} onOpenChange={(open) => { if (!open) setSelectedDefect(null); }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-muted text-muted-foreground text-xs rounded px-2 py-0.5 font-mono">
                  # {selectedDefect?.no}
                </span>
                <DialogTitle className="text-base">
                  {selectedDefect?.unit} {selectedDefect?.content}
                </DialogTitle>
              </div>
              <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${getStatusColor(selectedDefect?.status || "")}`}>
                {selectedDefect?.status}
              </span>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Section 1 — 기본 정보 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "동호수", value: `${selectedDefect?.dong}동 ${selectedDefect?.ho}호` },
                { label: "하자 유형", value: selectedDefect?.type },
                { label: "접수일", value: (selectedDefect as any)?.dateFormatted },
                { label: "방문 예정일", value: (selectedDefect as any)?.visitDateFormatted || "—" },
                { label: "접수자", value: selectedDefect?.residentName },
                { label: "연락처", value: selectedDefect?.residentPhone },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-semibold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Section 2 — 하자 내용 */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">하자 내용</div>
              <div className="bg-muted rounded-xl p-3 text-sm text-foreground">
                {selectedDefect?.content}
              </div>
            </div>

            {/* Section 3 — 담당자 배정 */}
            {selectedDefect && selectedDefect.status !== "완료" && (
              <div>
                <div className="text-sm font-bold text-foreground mb-2">담당 기사 배정</div>
                <select
                  className="w-full border border-input rounded-xl h-11 px-3 text-sm bg-background"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  <option value="" disabled>담당자를 선택하세요</option>
                  <option value="김기사">김기사 (배관·누수 전문)</option>
                  <option value="이기사">이기사 (마감재·도배 전문)</option>
                  <option value="박기사">박기사 (전기·설비 전문)</option>
                  <option value="최기사">최기사 (창호·유리 전문)</option>
                </select>
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">방문 예정일</div>
                  <input
                    type="date"
                    className="w-full border border-input rounded-xl h-11 px-3 text-sm bg-background"
                    value={visitDateInput}
                    onChange={(e) => setVisitDateInput(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Section 4 — 처리 메모 */}
            <div>
              <Textarea
                rows={3}
                className="rounded-xl resize-none"
                placeholder="처리 내용 또는 특이사항을 입력하세요"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedDefect(null)}>
              닫기
            </Button>
            {selectedDefect?.status === "미배정" && (
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAction}>
                배정하기
              </Button>
            )}
            {selectedDefect?.status === "처리중" && (
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleAction}>
                완료 처리
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Defects;
