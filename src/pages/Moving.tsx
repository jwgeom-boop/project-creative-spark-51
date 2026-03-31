import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const Moving = () => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const { data: movingSchedules = [], isLoading } = useQuery({
    queryKey: ["moving_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moving_schedules")
        .select("*, units(dong, ho)")
        .order("moving_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Build calendar for April 2026
  const totalDays = 30;
  const startDay = 3; // April 2026 starts on Wednesday
  const dayCounts = new Map<number, number>();
  movingSchedules.forEach((m: any) => {
    const d = new Date(m.moving_date);
    if (d.getMonth() === 3 && d.getFullYear() === 2026) {
      const day = d.getDate();
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }
  });

  const calendarData = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    count: dayCounts.get(i + 1) || 0,
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

  // Today's moving (use all for demo)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMoving = movingSchedules
    .filter((m: any) => m.moving_date === todayStr || movingSchedules.indexOf(m) < 5)
    .slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">이사 예약 캘린더</h1>
        <p className="page-description">이사날짜·시간대 예약 · 엘리베이터 배정 · 이삿짐 차량 QR 현황</p>
      </div>

      {filterParam && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2 text-sm text-warning">
          <AlertCircle className="w-4 h-4" />
          <span>현재 필터: <strong>{filterParam}</strong> — 해당 조건의 세대를 확인하세요.</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <button className="p-1 hover:bg-accent rounded"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-lg font-semibold">2026년 4월</h2>
              <button className="p-1 hover:bg-accent rounded"><ChevronRight className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {weeks.flat().map((day, i) => (
                <div key={i} className={`min-h-[60px] border border-border rounded p-1.5 ${day ? "cursor-pointer hover:bg-accent/50" : ""}`}>
                  {day && (
                    <>
                      <div className="text-xs font-medium">{day.day}</div>
                      {day.count > 0 && (
                        <div className={`text-xs mt-1 px-1 py-0.5 rounded text-center ${getCountColor(day.count)}`}>{day.count}세대</div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success/20" /> 1~6세대</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/10" /> 7~9세대</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/20" /> 10세대↑</span>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold">오늘 이사 현황</h2>
            </div>
            <table className="data-table">
              <thead><tr><th>시간</th><th>세대</th><th>EV</th><th>상태</th></tr></thead>
              <tbody>
                {todayMoving.map((m: any) => (
                  <tr key={m.id}>
                    <td>{m.time_slot}</td>
                    <td>{m.units?.dong}동 {m.units?.ho}</td>
                    <td>{m.elevator || "—"}</td>
                    <td><span className={`status-badge ${getMovingStatus(m.status)}`}>{m.status}</span></td>
                  </tr>
                ))}
                {todayMoving.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">오늘 이사 일정이 없습니다.</td></tr>}
              </tbody>
            </table>

            <div className="p-4 border-t border-border">
              <h3 className="text-sm font-semibold mb-2">엘리베이터 현황</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-warning/10 rounded p-2"><div className="text-xs text-muted-foreground">1호기</div><div className="text-sm font-medium text-warning">사용중</div></div>
                <div className="bg-success/10 rounded p-2"><div className="text-xs text-muted-foreground">2호기</div><div className="text-sm font-medium text-success">대기</div></div>
                <div className="bg-success/10 rounded p-2"><div className="text-xs text-muted-foreground">3호기</div><div className="text-sm font-medium text-success">대기</div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Moving;
