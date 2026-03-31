import { useState, useMemo } from "react";
import { Download, Settings, Plus, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";

const Inspection = () => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const [filters, setFilters] = useState<FilterValues>({ search: "", dong: "전체", status: "전체" });

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

  // Enrich inspections for filtering
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

  // Time slot summary from filtered
  const timeSlotMap = new Map<string, { total: number; checkedIn: number }>();
  filteredInspections.forEach((ins: any) => {
    const slot = ins.time_slot;
    if (!timeSlotMap.has(slot)) timeSlotMap.set(slot, { total: 0, checkedIn: 0 });
    const entry = timeSlotMap.get(slot)!;
    entry.total++;
    if (ins.checkin_time) entry.checkedIn++;
  });
  const timeSlots = Array.from(timeSlotMap.entries()).map(([time, data]) => ({
    time, checkin: `${data.checkedIn}/${data.total}`, waiting: `${data.total - data.checkedIn}명`
  }));

  const waitingQueue = filteredInspections
    .filter((ins: any) => ins.status !== "완료")
    .slice(0, 6)
    .map((ins: any, i: number) => ({
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
          <button className="px-3 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1"><Settings className="w-4 h-4" /> 예약 마감 설정</button>
          <button className="px-3 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1"><Plus className="w-4 h-4" /> 슬롯 추가</button>
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
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">시간대별 예약 현황</h2></div>
            <table className="data-table">
              <thead><tr><th>시간대</th><th>체크인</th><th>대기</th></tr></thead>
              <tbody>
                {timeSlots.map((s, i) => (
                  <tr key={i}><td>{s.time}</td><td className="font-medium">{s.checkin}</td><td>{s.waiting}</td></tr>
                ))}
                {timeSlots.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">예약 데이터가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">실시간 대기열 현황</h2></div>
            <table className="data-table">
              <thead><tr><th>번호</th><th>세대</th><th>입주자명</th><th>상태</th></tr></thead>
              <tbody>
                {waitingQueue.map((q, i) => (
                  <tr key={i}>
                    <td className="font-medium">{q.no}</td><td>{q.unit}</td><td>{q.name}</td>
                    <td><span className={`status-badge ${q.status === "점검중" ? "status-pending" : q.status === "대기중" ? "status-info" : "status-error"}`}>{q.status}</span></td>
                  </tr>
                ))}
                {waitingQueue.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">대기열이 비어있습니다.</td></tr>}
              </tbody>
            </table>
          </div>

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
    </div>
  );
};

export default Inspection;
