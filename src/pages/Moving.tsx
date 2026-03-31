import { ChevronLeft, ChevronRight } from "lucide-react";

const calendarData = [
  { day: 1, count: 4 }, { day: 2, count: 6 }, { day: 3, count: 8 }, { day: 4, count: 3 },
  { day: 5, count: 12 }, { day: 6, count: 8 }, { day: 7, count: 0 },
  { day: 8, count: 7 }, { day: 9, count: 9 }, { day: 10, count: 5 }, { day: 11, count: 12 },
  { day: 12, count: 8 }, { day: 13, count: 0 }, { day: 14, count: 0 },
  { day: 15, count: 10 }, { day: 16, count: 11 }, { day: 17, count: 7 }, { day: 18, count: 8 },
  { day: 19, count: 6 }, { day: 20, count: 3 }, { day: 21, count: 0 },
  { day: 22, count: 2 }, { day: 23, count: 8 }, { day: 24, count: 10 }, { day: 25, count: 6 },
  { day: 26, count: 4 }, { day: 27, count: 0 }, { day: 28, count: 0 },
  { day: 29, count: 8 }, { day: 30, count: 10 },
];

const todayMoving = [
  { unit: "101동 0201", ev: "1호기", status: "완료", time: "오전" },
  { unit: "102동 0501", ev: "2호기", status: "완료", time: "오전" },
  { unit: "103동 1102", ev: "1호기", status: "진행중", time: "오전" },
  { unit: "101동 0304", ev: "1호기", status: "예정", time: "오후" },
  { unit: "102동 0802", ev: "2호기", status: "예정", time: "오후" },
];

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
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  // April 2026 starts on Wednesday (index 3)
  const startDay = 3;
  const totalDays = 30;
  const weeks: (typeof calendarData[0] | null)[][] = [];
  let currentWeek: (typeof calendarData[0] | null)[] = Array(startDay).fill(null);

  calendarData.forEach((d) => {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">이사 예약 캘린더</h1>
        <p className="page-description">이사날짜·시간대 예약 · 엘리베이터 배정 · 이삿짐 차량 QR 현황</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
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
                      <div className={`text-xs mt-1 px-1 py-0.5 rounded text-center ${getCountColor(day.count)}`}>
                        {day.count}세대
                      </div>
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

        {/* Today's Moving */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">오늘 이사 현황 — 3.31</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>시간</th><th>세대</th><th>EV</th><th>상태</th></tr></thead>
            <tbody>
              {todayMoving.map((m, i) => (
                <tr key={i}>
                  <td>{m.time}</td>
                  <td>{m.unit}</td>
                  <td>{m.ev}</td>
                  <td><span className={`status-badge ${getMovingStatus(m.status)}`}>{m.status}</span></td>
                </tr>
              ))}
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
    </div>
  );
};

export default Moving;
