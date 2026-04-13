import { useState, useMemo } from "react";
import { Download, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import AssigneePopover from "@/components/defects/AssigneePopover";
import AssigneeCards from "@/components/defects/AssigneeCards";
import DefectTimeline from "@/components/defects/DefectTimeline";

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
  visitDateFormatted?: string;
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
  const { roles } = useAuth();
  const isCsRole = roles.includes("cs_center");
  const [filters, setFilters] = useState<FilterValues>({
    search: "", dong: "전체", status: searchParams.get("filter") || "전체",
  });
  const [selectedCompany, setSelectedCompany] = useState("전체");
  const [page, setPage] = useState(1);
  const [selectedDefect, setSelectedDefect] = useState<DefectItem | null>(null);
  const [assignee, setAssignee] = useState("");
  const [visitDatePick, setVisitDatePick] = useState<Date | undefined>(undefined);
  const [memo, setMemo] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

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

  const companyOptions = useMemo(() => [
    "전체",
    ...Array.from(new Set(defects.map(d => d.company))).filter(c => c && c !== "미배정").sort(),
    "미배정",
  ], [defects]);

  const filtered = applyCommonFilters(defects, filters, {
    searchFields: ["unit", "content", "type"],
    statusField: "status",
    dongField: "dong",
    dateField: "date",
  }).filter((d: any) => selectedCompany === "전체" || d.company === selectedCompany);

  const currentPageItems = paginate(filtered, page);

  // Inline assign from table
  const handleInlineAssign = async (defectId: string, company: string) => {
    const { error } = await supabase
      .from("defects")
      .update({ status: "처리중", company })
      .eq("id", defectId);
    if (error) { toast.error("배정에 실패했습니다."); return; }
    toast.success(`${company} 배정 완료`);
    queryClient.invalidateQueries({ queryKey: ["defects"] });
  };

  // Bulk assign
  const selectedUnassigned = filtered.filter((d: any) => checkedIds.has(d.id) && d.status === "미배정");

  const handleBulkAssign = async (company: string) => {
    const ids = selectedUnassigned.map((d: any) => d.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("defects")
      .update({ status: "처리중", company })
      .in("id", ids);
    if (error) { toast.error("일괄 배정에 실패했습니다."); return; }
    toast.success(`${ids.length}건 배정이 완료되었습니다.`);
    setCheckedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["defects"] });
  };

  // Checkbox helpers
  const allPageChecked = currentPageItems.length > 0 && currentPageItems.every((d: any) => checkedIds.has(d.id));
  const toggleAll = () => {
    const newSet = new Set(checkedIds);
    if (allPageChecked) {
      currentPageItems.forEach((d: any) => newSet.delete(d.id));
    } else {
      currentPageItems.forEach((d: any) => newSet.add(d.id));
    }
    setCheckedIds(newSet);
  };
  const toggleOne = (id: string) => {
    const newSet = new Set(checkedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setCheckedIds(newSet);
  };

  // Modal
  const openDetail = (d: DefectItem) => {
    setSelectedDefect(d);
    setAssignee(d.company !== "미배정" ? d.company : "");
    setVisitDatePick(d.visitDateRaw ? new Date(d.visitDateRaw) : undefined);
    setMemo("");
  };

  const handleAction = async () => {
    if (!selectedDefect) return;
    const newStatus = selectedDefect.status === "미배정" ? "처리중" : "완료";
    const updateData: any = { status: newStatus };
    if (newStatus === "처리중") {
      if (assignee) updateData.company = assignee;
      if (visitDatePick) updateData.visit_date = format(visitDatePick, "yyyy-MM-dd");
    }
    const { error } = await supabase.from("defects").update(updateData).eq("id", selectedDefect.id);
    if (error) { toast.error("업데이트에 실패했습니다."); return; }
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

      {/* Bulk action bar */}
      {checkedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{checkedIds.size}건 선택됨</span>
          {selectedUnassigned.length > 0 && (
            <AssigneePopover onSelect={handleBulkAssign}>
              <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md">
                일괄 배정 ▾ ({selectedUnassigned.length}건)
              </button>
            </AssigneePopover>
          )}
          <button className="px-3 py-1.5 text-sm border border-border rounded-md bg-card" onClick={() => setCheckedIds(new Set())}>
            선택 해제
          </button>
        </div>
      )}

      {checkedIds.size === 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="ml-auto flex gap-2">
            <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => {
              exportToExcel(filtered as any, [
                { key: "no", label: "번호" }, { key: "unit", label: "세대" }, { key: "type", label: "유형" },
                { key: "content", label: "하자내용" }, { key: "dateDisplay", label: "접수일" }, { key: "company", label: "담당업체" },
                { key: "visitDate", label: "방문예정일" }, { key: "status", label: "처리상태" },
              ], "하자보수");
              toast.success("엑셀 파일이 다운로드되었습니다.");
            }}><Download className="w-4 h-4" /> 엑셀</button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : currentPageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Wrench className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">{filters.search ? "검색 결과가 없습니다" : "접수된 하자가 없습니다"}</p>
            <p className="text-xs text-muted-foreground/70">{filters.search ? `'${filters.search}'에 대한 결과를 찾을 수 없습니다` : "입주민 앱에서 하자 접수 시 표시됩니다"}</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="block md:hidden divide-y divide-border">
              {currentPageItems.map((d: any) => (
                <div key={d.id} className={cn("p-3 cursor-pointer", checkedIds.has(d.id) && "bg-primary/5")} onClick={() => openDetail(d)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={checkedIds.has(d.id)} onChange={() => toggleOne(d.id)} onClick={e => e.stopPropagation()} />
                      <span className="font-medium text-sm">{d.unit}</span>
                      <span className="text-xs text-muted-foreground">{d.type}</span>
                    </div>
                    <span className={`status-badge ${getDefectStatusBadge(d.status)}`}>{d.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{d.content}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>{d.dateDisplay}</span>
                    <span className={d.company === "미배정" ? "text-destructive" : ""}>{d.company}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <table className="data-table hidden md:table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={allPageChecked} onChange={toggleAll} /></th>
                  <th>번호</th><th>세대</th><th>유형</th><th className="hidden lg:table-cell">하자 내용</th><th className="hidden lg:table-cell">사진</th><th>접수일</th><th>담당업체</th><th className="hidden lg:table-cell">방문예정일</th><th>처리상태</th><th>배정</th>
                </tr>
              </thead>
              <tbody>
                {currentPageItems.map((d: any) => (
                  <tr
                    key={d.id}
                    className={cn("cursor-pointer hover:bg-muted/50", checkedIds.has(d.id) && "bg-primary/5")}
                    onClick={() => openDetail(d)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checkedIds.has(d.id)} onChange={() => toggleOne(d.id)} />
                    </td>
                    <td>{d.no}</td><td>{d.unit}</td><td>{d.type}</td>
                    <td className="hidden lg:table-cell">{d.content}</td><td className="hidden lg:table-cell">{d.photos}</td><td>{d.dateDisplay}</td>
                    <td className={d.company === "미배정" ? "text-destructive font-medium" : ""}>{d.company}</td>
                    <td className="hidden lg:table-cell">{d.visitDate}</td>
                    <td><span className={`status-badge ${getDefectStatusBadge(d.status)}`}>{d.status}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {d.status === "미배정" ? (
                        <AssigneePopover onSelect={(name) => handleInlineAssign(d.id, name)}>
                          <button className="text-primary text-sm hover:underline">배정 ▾</button>
                        </AssigneePopover>
                      ) : d.status === "완료" ? (
                        <span className="text-green-600 text-sm">완료✓</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
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
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
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
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "동호수", value: `${selectedDefect?.dong}동 ${selectedDefect?.ho}호` },
                { label: "하자 유형", value: selectedDefect?.type },
                { label: "접수일", value: selectedDefect?.dateFormatted },
                { label: "방문 예정일", value: selectedDefect?.visitDateFormatted || "—" },
                { label: "접수자", value: selectedDefect?.residentName },
                { label: "연락처", value: selectedDefect?.residentPhone },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-semibold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Content */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">하자 내용</div>
              <div className="bg-muted rounded-xl p-3 text-sm text-foreground">
                {selectedDefect?.content}
              </div>
            </div>

            {/* Assignee cards */}
            {selectedDefect && selectedDefect.status !== "완료" && (
              <div>
                <div className="text-sm font-bold text-foreground mb-2">담당 기사 배정</div>
                <AssigneeCards
                  selected={assignee}
                  onSelect={setAssignee}
                  readOnly={selectedDefect.status === "처리중" && selectedDefect.company !== "미배정"}
                />
                {!(selectedDefect.status === "처리중" && selectedDefect.company !== "미배정") && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">방문 예정일</div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !visitDatePick && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {visitDatePick ? format(visitDatePick, "yyyy-MM-dd") : "날짜를 선택하세요"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={visitDatePick}
                          onSelect={setVisitDatePick}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            )}

            {/* Read-only assignee info when already assigned */}
            {selectedDefect?.status === "완료" && selectedDefect.company !== "미배정" && (
              <div>
                <div className="text-sm font-bold text-foreground mb-2">배정 담당자</div>
                <AssigneeCards selected={selectedDefect.company} onSelect={() => {}} readOnly />
              </div>
            )}

            {/* Memo */}
            <Textarea
              rows={3}
              className="rounded-xl resize-none"
              placeholder="처리 내용 또는 특이사항을 입력하세요"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />

            {/* Timeline */}
            {selectedDefect && (
              <DefectTimeline
                status={selectedDefect.status}
                reportDate={selectedDefect.dateFormatted}
                company={selectedDefect.company}
                visitDate={selectedDefect.visitDateFormatted}
              />
            )}
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSelectedDefect(null)}>닫기</Button>
            {selectedDefect?.status === "미배정" && (
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAction}>배정하기</Button>
            )}
            {selectedDefect?.status === "처리중" && (
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleAction}>완료 처리</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Defects;
