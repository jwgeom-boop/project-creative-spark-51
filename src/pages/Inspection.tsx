import { useState, useMemo } from "react";
import { Download, Settings, Plus, AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const Inspection = () => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterValues>({ search: "", dong: "전체", status: "전체" });
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [closeDate, setCloseDate] = useState<Date | undefined>();
  const [closeReason, setCloseReason] = useState("");
  const [closedSlots, setClosedSlots] = useState<Set<string>>(new Set());
  const [newSlotStart, setNewSlotStart] = useState("17:00");
  const [newSlotEnd, setNewSlotEnd] = useState("18:00");
  const [newSlotMax, setNewSlotMax] = useState(4);
  const [addedSlots, setAddedSlots] = useState<{ time: string; max: number }[]>([]);

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ["inspections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspections")
        .select("*, units(dong, ho)")
        .order("inspection_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-for-inspection"],
    queryFn: async () => {
      const { data, error } = await supabase.from("residents").select("unit_id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: defects = [] } = useQuery({
    queryKey: ["defects-for-inspection"],
    queryFn: async () => {
      const { data, error } = await supabase.from("defects").select("defect_type");
      if (error) throw error;
      return data;
    },
  });

  const dongOptions = useMemo(() => [...new Set(inspections.map((i: any) => i.units?.dong).filter(Boolean))].sort(), [inspections]);

  const enriched = useMemo(() => inspections.map((ins: any) => {
    const resident = residents.find((r: any) => r.unit_id === ins.unit_id);
    return {
      ...ins,
      dong: ins.units?.dong || "",
      unit: `${ins.units?.dong}동 ${ins.units?.ho}`,
      name: resident?.name || "—",
      date: ins.inspection_date,
    };
  }), [inspections, residents]);

  const filteredInspections = applyCommonFilters(enriched, filters, {
    searchFields: ["unit", "name"],
    statusField: "status",
    dongField: "dong",
    dateField: "date",
  });

  // Time slot summary
  const timeSlotMap = new Map<string, { total: number; checkedIn: number }>();
  filteredInspections.forEach((ins: any) => {
    const slot = ins.time_slot;
    if (!timeSlotMap.has(slot)) timeSlotMap.set(slot, { total: 0, checkedIn: 0 });
    const entry = timeSlotMap.get(slot)!;
    entry.total++;
    if (ins.checkin_time) entry.checkedIn++;
  });
  // Add custom slots
  addedSlots.forEach(s => {
    if (!timeSlotMap.has(s.time)) timeSlotMap.set(s.time, { total: 0, checkedIn: 0 });
  });
  const timeSlots = Array.from(timeSlotMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, data]) => ({
      time,
      checkin: `${data.checkedIn}/${data.total}`,
      waiting: `${data.total - data.checkedIn}명`,
      isClosed: closedSlots.has(time),
    }));

  const waitingQueue = filteredInspections
    .filter((ins: any) => ins.status !== "완료")
    .slice(0, 6)
    .map((ins: any, i: number) => ({
      id: ins.id,
      no: `${i + 1}`, unit: ins.unit, name: ins.name, status: ins.status,
      checkin: ins.checkin_time ? new Date(ins.checkin_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "—",
    }));

  const defectTypeCount = new Map<string, number>();
  defects.forEach((d: any) => defectTypeCount.set(d.defect_type, (defectTypeCount.get(d.defect_type) || 0) + 1));
  const totalDefects = defects.length || 1;
  const defectStats = Array.from(defectTypeCount.entries()).map(([type, count]) => ({
    type, ratio: Math.round((count / totalDefects) * 100),
    color: type === "도배·도장" ? "bg-kpi-blue" : type === "바닥재" ? "bg-kpi-green" : type === "창호" ? "bg-kpi-teal" : type === "배관·수도" ? "bg-kpi-orange" : "bg-kpi-purple",
  }));

  const handleCheckin = async (id: string) => {
    const { error } = await supabase.from("inspections").update({ status: "점검중", checkin_time: new Date().toISOString() }).eq("id", id);
    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ["inspections"] });
      toast.success("체크인이 완료되었습니다.");
    }
  };

  const handleComplete = async (id: string) => {
    const { error } = await supabase.from("inspections").update({ status: "완료" }).eq("id", id);
    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ["inspections"] });
      toast.success("점검이 완료되었습니다.");
    }
  };

  const handleCloseApply = () => {
    if (!closeDate) { toast.error("마감 날짜를 선택해주세요."); return; }
    if (closedSlots.size === 0) { toast.error("마감할 시간대를 선택해주세요."); return; }
    toast.success(`${closedSlots.size}개 시간대 예약 마감이 설정되었습니다.`);
    setCloseModalOpen(false);
  };

  const handleSlotAdd = () => {
    if (newSlotStart >= newSlotEnd) { toast.error("종료 시간은 시작 시간 이후여야 합니다."); return; }
    setAddedSlots(prev => [...prev, { time: `${newSlotStart}~${newSlotEnd}`, max: newSlotMax }]);
    toast.success("슬롯이 추가되었습니다.");
    setSlotModalOpen(false);
  };

  const toggleCloseSlot = (slot: string) => {
    setClosedSlots(prev => {
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      return next;
    });
  };

  const hours = Array.from({ length: 12 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">사전점검 예약 현황</h1>
        <p className="page-description">날짜·시간대별 예약 현황 · 실시간 대기열 모니터링</p>
      </div>

      {filterParam && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2 text-sm text-warning">
          <AlertCircle className="w-4 h-4" />
          <span>현재 필터: <strong>{filterParam}</strong></span>
        </div>
      )}

      <AdvancedFilterBar
        config={{
          searchPlaceholder: "세대 / 입주자명 검색",
          dongOptions,
          statusOptions: [
            { label: "전체", value: "전체" },
            { label: "대기중", value: "대기중" },
            { label: "점검중", value: "점검중" },
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
          <button className="px-3 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => setCloseModalOpen(true)}><Settings className="w-4 h-4" /> 예약 마감 설정</button>
          <button className="px-3 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => setSlotModalOpen(true)}><Plus className="w-4 h-4" /> 슬롯 추가</button>
          <button className="px-3 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => {
            exportToExcel(waitingQueue, [
              { key: "no", label: "번호" }, { key: "unit", label: "세대" }, { key: "name", label: "입주자명" }, { key: "status", label: "상태" },
            ], "사전점검");
            toast.success("엑셀 파일이 다운로드되었습니다.");
          }}><Download className="w-4 h-4" /> 엑셀 출력</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time slot table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">시간대별 예약 현황</h2></div>
            <table className="data-table">
              <thead><tr><th>시간대</th><th>체크인</th><th>대기</th></tr></thead>
              <tbody>
                {timeSlots.map((s, i) => (
                  <tr key={i} className={s.isClosed ? "bg-destructive/5" : ""}>
                    <td className={s.isClosed ? "text-destructive line-through" : ""}>{s.time}{s.isClosed && " (마감)"}</td>
                    <td className="font-medium">{s.checkin}</td>
                    <td>{s.waiting}</td>
                  </tr>
                ))}
                {timeSlots.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">예약 데이터가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Waiting queue */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">실시간 대기열 현황</h2></div>
            <table className="data-table">
              <thead><tr><th>번호</th><th>세대</th><th>입주자명</th><th>상태</th><th>액션</th></tr></thead>
              <tbody>
                {waitingQueue.map((q, i) => (
                  <tr key={i}>
                    <td className="font-medium">{q.no}</td><td>{q.unit}</td><td>{q.name}</td>
                    <td><span className={`status-badge ${q.status === "점검중" ? "status-pending" : q.status === "대기중" ? "status-info" : "status-error"}`}>{q.status}</span></td>
                    <td>
                      {q.status === "대기중" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleCheckin(q.id)}>체크인</Button>
                      )}
                      {q.status === "점검중" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleComplete(q.id)}>점검 완료</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {waitingQueue.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">대기열이 비어있습니다.</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Defect stats */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold mb-4">하자 유형 통계</h2>
            <div className="space-y-3">
              {defectStats.map((d) => (
                <div key={d.type}>
                  <div className="flex justify-between text-sm mb-1"><span>{d.type}</span><span className="font-medium">{d.ratio}%</span></div>
                  <div className="w-full bg-muted rounded-full h-2"><div className={`h-2 rounded-full ${d.color}`} style={{ width: `${d.ratio}%` }} /></div>
                </div>
              ))}
              {defectStats.length === 0 && <p className="text-sm text-muted-foreground">하자 데이터가 없습니다.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Close Settings Modal */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>예약 마감 설정</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">마감 날짜</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left", !closeDate && "text-muted-foreground")}>
                    {closeDate ? format(closeDate, "yyyy-MM-dd") : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={closeDate} onSelect={setCloseDate} className={cn("p-3 pointer-events-auto")} /></PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">마감 사유</label>
              <Input placeholder="마감 사유 입력" value={closeReason} onChange={(e) => setCloseReason(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">마감할 시간대</label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_TIME_SLOTS.map(slot => (
                  <label key={slot} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={closedSlots.has(slot)} onCheckedChange={() => toggleCloseSlot(slot)} />
                    {slot}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setCloseModalOpen(false)}>취소</Button>
            <Button onClick={handleCloseApply}>마감 적용</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slot Add Modal */}
      <Dialog open={slotModalOpen} onOpenChange={setSlotModalOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle>시간대 슬롯 추가</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">시작 시간</label>
                <Select value={newSlotStart} onValueChange={setNewSlotStart}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">종료 시간</label>
                <Select value={newSlotEnd} onValueChange={setNewSlotEnd}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">최대 예약 인원</label>
              <Input type="number" min={1} value={newSlotMax} onChange={(e) => setNewSlotMax(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setSlotModalOpen(false)}>취소</Button>
            <Button onClick={handleSlotAdd}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inspection;
