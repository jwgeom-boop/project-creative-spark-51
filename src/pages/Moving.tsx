import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subDays, getDay, getDaysInMonth, startOfMonth } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EV_OPTIONS = ["EV1", "EV2", "EV3", "EV4"];
const PARKING_OPTIONS = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10"];

const getCountColor = (count: number) => {
  if (count === 0) return "";
  if (count >= 10) return "bg-warning/20 text-warning font-semibold";
  if (count >= 7) return "bg-primary/10 text-primary font-medium";
  return "bg-success/10 text-success";
};

const getMovingStatus = (s: string) => {
  if (s === "완료") return "status-complete";
  if (s === "진행중") return "status-pending";
  return "status-info";
};

const getEvColor = (status: string, ev: string) => {
  if (!ev || ev === "—") return "text-muted-foreground";
  if (status === "진행중") return "text-warning font-semibold";
  if (status === "완료") return "text-success";
  return "";
};

const Moving = () => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const queryClient = useQueryClient();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const [filters, setFilters] = useState<FilterValues>({ search: "", dong: "전체", status: "전체" });
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1));
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // EV assignment in detail modal
  const [evAssignMode, setEvAssignMode] = useState(false);
  const [selectedEv, setSelectedEv] = useState<string | null>(null);

  // Bulk assignment modal
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignments, setBulkAssignments] = useState<Record<string, string>>({});
  const [bulkSaving, setBulkSaving] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const { data: movingSchedules = [], isLoading } = useQuery({
    queryKey: ["moving_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moving_schedules")
        .select("*, units(dong, ho, residents(name, phone))")
        .order("moving_date", { ascending: true });
      if (error) throw error;
      return data.map((m: any) => ({
        ...m,
        dong: m.units?.dong || "",
        unit: `${m.units?.dong}동 ${m.units?.ho}`,
        name: m.units?.residents?.[0]?.name || "—",
        phone: m.units?.residents?.[0]?.phone || "—",
        date: m.moving_date,
      }));
    },
  });

  const dongOptions = useMemo(() => [...new Set(movingSchedules.map((m: any) => m.dong))].filter(Boolean).sort(), [movingSchedules]);

  const filtered = applyCommonFilters(movingSchedules, filters, {
    searchFields: ["unit"],
    statusField: "status",
    dongField: "dong",
    dateField: "date",
  });

  // Calendar
  const totalDays = getDaysInMonth(currentDate);
  const startDay = getDay(startOfMonth(currentDate));
  const dayCounts = new Map<number, number>();
  filtered.forEach((m: any) => {
    const d = new Date(m.moving_date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      dayCounts.set(d.getDate(), (dayCounts.get(d.getDate()) || 0) + 1);
    }
  });

  const calendarData = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1, count: dayCounts.get(i + 1) || 0,
  }));

  const weeks: (typeof calendarData[0] | null)[][] = [];
  let currentWeek: (typeof calendarData[0] | null)[] = Array(startDay).fill(null);
  calendarData.forEach((d) => {
    currentWeek.push(d);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const selectedDateStr = format(currentDate, "yyyy-MM-dd");
  const todayMoving = filtered.filter((m: any) => m.moving_date === selectedDateStr);
  const displayMoving = todayMoving.length > 0 ? todayMoving : filtered.slice(0, 5);

  // EV status cards — derived from today's display data
  const evStatusCards = useMemo(() => {
    return EV_OPTIONS.map(ev => {
      const using = displayMoving.find((m: any) => m.elevator === ev && m.status === "진행중");
      return {
        name: ev,
        inUse: !!using,
        unit: using ? using.unit : null,
      };
    });
  }, [displayMoving]);

  // Which EVs are taken (for current date, status 진행중 or 예정)
  const takenEvs = useMemo(() => {
    const map: Record<string, string> = {};
    displayMoving.forEach((m: any) => {
      if (m.elevator && m.elevator !== "—" && m.id !== selectedDetail?.id) {
        map[m.elevator] = m.unit;
      }
    });
    return map;
  }, [displayMoving, selectedDetail]);

  // Unassigned for bulk
  const unassigned = useMemo(() => displayMoving.filter((m: any) => !m.elevator || m.elevator === "—" || m.elevator === ""), [displayMoving]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.from("moving_schedules").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["moving_schedules"] });
      setSelectedDetail(null);
      toast.success(`상태가 "${newStatus}"로 변경되었습니다.`);
    } catch (e: any) {
      toast.error(`변경 실패: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEvAssign = async () => {
    if (!selectedDetail || !selectedEv) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from("moving_schedules").update({ elevator: selectedEv }).eq("id", selectedDetail.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["moving_schedules"] });
      setSelectedDetail({ ...selectedDetail, elevator: selectedEv });
      setEvAssignMode(false);
      setSelectedEv(null);
      toast.success(`${selectedEv} 배정이 완료되었습니다.`);
    } catch (e: any) {
      toast.error(`배정 실패: ${e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkSave = async () => {
    const entries = Object.entries(bulkAssignments).filter(([, v]) => v);
    if (entries.length === 0) { toast.error("배정할 항목이 없습니다."); return; }
    setBulkSaving(true);
    try {
      for (const [id, ev] of entries) {
        const { error } = await supabase.from("moving_schedules").update({ elevator: ev }).eq("id", id);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["moving_schedules"] });
      setBulkAssignOpen(false);
      setBulkAssignments({});
      toast.success(`${entries.length}세대 엘리베이터 배정이 완료되었습니다.`);
    } catch (e: any) {
      toast.error(`일괄 배정 실패: ${e.message}`);
    } finally {
      setBulkSaving(false);
    }
  };

  const goToPrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const goToNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToPrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">이사 예약 캘린더</h1>
        <p className="page-description">이사날짜·시간대 예약 · 엘리베이터 배정 · 이삿짐 차량 QR 현황</p>
      </div>

      {filterParam && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2 text-sm text-warning">
          <AlertCircle className="w-4 h-4" />
          <span>현재 필터: <strong>{filterParam}</strong></span>
        </div>
      )}

      <AdvancedFilterBar
        config={{
          searchPlaceholder: "세대 검색",
          dongOptions,
          statusOptions: [
            { label: "전체", value: "전체" },
            { label: "예정", value: "예정" },
            { label: "진행중", value: "진행중" },
            { label: "완료", value: "완료" },
          ],
          statusLabel: "상태",
          showDateRange: true,
        }}
        values={filters}
        onChange={setFilters}
      />

      {/* EV Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {evStatusCards.map(ev => (
          <div key={ev.name} className={`rounded-lg p-3 border ${ev.inUse ? "bg-destructive/10 border-destructive/30" : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold">{ev.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ev.inUse ? "bg-destructive/20 text-destructive" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400"}`}>
                {ev.inUse ? "사용중" : "사용가능"}
              </span>
            </div>
            {ev.inUse && ev.unit && <span className="text-xs text-muted-foreground">{ev.unit}</span>}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <button className="p-1 hover:bg-accent rounded" onClick={goToPrevMonth}><ChevronLeft className="w-5 h-5" /></button>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer">
                      {currentYear}년 {currentMonth + 1}월
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar mode="single" selected={currentDate} onSelect={(d) => d && setCurrentDate(d)} className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={goToToday}>오늘</Button>
              </div>
              <button className="p-1 hover:bg-accent rounded" onClick={goToNextMonth}><ChevronRight className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {weeks.flat().map((day, i) => {
                const isSelected = day && day.day === currentDate.getDate() && currentMonth === currentDate.getMonth();
                return (
                  <div key={i}
                    className={`min-h-[60px] border rounded p-1.5 ${day ? "cursor-pointer hover:bg-accent/50" : ""} ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
                    onClick={() => day && setCurrentDate(new Date(currentYear, currentMonth, day.day))}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-medium ${isSelected ? "text-primary font-bold" : ""}`}>{day.day}</div>
                        {day.count > 0 && (
                          <div className={`text-xs mt-1 px-1 py-0.5 rounded text-center ${getCountColor(day.count)}`}>{day.count}세대</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/20" /> 1~6세대</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/10" /> 7~9세대</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/20" /> 10세대↑</span>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {format(currentDate, "M월 d일 (E)", { locale: ko })} 이사 현황
              </h2>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setBulkAssignments({}); setBulkAssignOpen(true); }}>일괄 배정</Button>
                <button className="p-1 hover:bg-accent rounded" onClick={goToPrevDay}><ChevronLeft className="w-4 h-4" /></button>
                <button className="p-1 hover:bg-accent rounded" onClick={goToNextDay}><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <table className="data-table">
              <thead><tr><th>시간</th><th>세대</th><th>EV</th><th>상태</th></tr></thead>
              <tbody>
                {displayMoving.map((m: any) => (
                  <tr key={m.id} className="cursor-pointer hover:bg-accent/50" onClick={() => { setSelectedDetail(m); setEvAssignMode(false); setSelectedEv(null); }}>
                    <td>{m.time_slot}</td>
                    <td>{m.unit}</td>
                    <td className={getEvColor(m.status, m.elevator)}>{m.elevator || "—"}</td>
                    <td><span className={`status-badge ${getMovingStatus(m.status)}`}>{m.status}</span></td>
                  </tr>
                ))}
                {displayMoving.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">이사 일정이 없습니다.</td></tr>}
              </tbody>
            </table>

            <div className="p-4 border-t border-border">
              <h3 className="text-sm font-semibold mb-2">엘리베이터 현황</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                {evStatusCards.map(ev => (
                  <div key={ev.name} className={`rounded p-2 ${ev.inUse ? "bg-destructive/10 text-destructive" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"}`}>
                    <div className="text-xs text-muted-foreground">{ev.name}</div>
                    <div className="text-xs font-medium">{ev.inUse ? "사용중" : "대기"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal with EV assignment */}
      <Dialog open={!!selectedDetail} onOpenChange={(open) => { if (!open) { setSelectedDetail(null); setEvAssignMode(false); setSelectedEv(null); } }}>
        <DialogContent className="max-w-sm rounded-2xl">
          {selectedDetail && (
            <>
              <DialogHeader>
                <DialogTitle>이사 상세정보</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="bg-muted rounded-lg p-3 space-y-1.5">
                  <h4 className="text-xs font-semibold text-muted-foreground">세대 정보</h4>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">세대</span><span className="font-medium">{selectedDetail.unit}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">입주자</span><span className="font-medium">{selectedDetail.name}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">연락처</span><span className="font-medium">{selectedDetail.phone}</span></div>
                </div>
                <div className="bg-muted rounded-lg p-3 space-y-1.5">
                  <h4 className="text-xs font-semibold text-muted-foreground">예약 정보</h4>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">시간대</span><span className="font-medium">{selectedDetail.time_slot}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">상태</span><span className={`status-badge ${getMovingStatus(selectedDetail.status)}`}>{selectedDetail.status}</span></div>
                </div>

                {/* Elevator assignment */}
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-muted-foreground">엘리베이터 배정</h4>
                    {!evAssignMode && (
                      <Button variant="outline" size="sm" className="text-xs h-6" onClick={() => setEvAssignMode(true)}>
                        {selectedDetail.elevator ? "변경" : "배정"}
                      </Button>
                    )}
                  </div>
                  {!evAssignMode ? (
                    <div className="text-sm font-medium">{selectedDetail.elevator || "미배정"}</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-2">
                        {EV_OPTIONS.map(ev => {
                          const taken = takenEvs[ev];
                          const isSelected = selectedEv === ev;
                          return (
                            <button
                              key={ev}
                              disabled={!!taken}
                              onClick={() => setSelectedEv(ev)}
                              className={cn(
                                "py-2 rounded-md text-xs font-medium border transition-colors",
                                taken ? "bg-muted text-muted-foreground border-border cursor-not-allowed" :
                                isSelected ? "bg-primary text-primary-foreground border-primary" :
                                "bg-card border-border hover:bg-accent"
                              )}
                            >
                              {ev}
                              {taken && <div className="text-[10px] text-muted-foreground">사용중</div>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button variant="outline" size="sm" className="text-xs flex-1" onClick={() => { setEvAssignMode(false); setSelectedEv(null); }}>취소</Button>
                        <Button size="sm" className="text-xs flex-1" disabled={!selectedEv || isUpdating} onClick={handleEvAssign}>
                          {isUpdating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}배정 확정
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedDetail(null)}>닫기</Button>
                {selectedDetail.status === "예정" && (
                  <Button onClick={() => handleStatusChange(selectedDetail.id, "진행중")} disabled={isUpdating}>입실 시작</Button>
                )}
                {selectedDetail.status === "진행중" && (
                  <Button onClick={() => handleStatusChange(selectedDetail.id, "완료")} disabled={isUpdating} className="bg-green-600 hover:bg-green-700 text-white">이사 완료</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Modal */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>엘리베이터 일괄 배정</DialogTitle>
          </DialogHeader>
          {unassigned.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">미배정 세대가 없습니다.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {unassigned.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{m.unit}</div>
                    <div className="text-xs text-muted-foreground">{m.time_slot}</div>
                  </div>
                  <Select value={bulkAssignments[m.id] || ""} onValueChange={v => setBulkAssignments(prev => ({ ...prev, [m.id]: v }))}>
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {EV_OPTIONS.map(ev => (
                        <SelectItem key={ev} value={ev}>{ev}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>취소</Button>
            <Button onClick={handleBulkSave} disabled={bulkSaving || unassigned.length === 0}>
              {bulkSaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}일괄 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Moving;
