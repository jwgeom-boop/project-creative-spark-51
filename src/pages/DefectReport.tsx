import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUp, ArrowDown, CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, isAfter, isBefore, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type PeriodKey = "1w" | "1m" | "3m" | "all" | "custom";
type SortKey = "assigned" | "completed" | "rate";
type SortDir = "asc" | "desc";

const periodButtons: { key: PeriodKey; label: string }[] = [
  { key: "1w", label: "1주" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "all", label: "전체" },
];

const typeColors: Record<string, string> = {
  "도배·도장": "hsl(207, 90%, 54%)",
  "배관·수도": "hsl(25, 95%, 53%)",
  "바닥재": "hsl(142, 71%, 45%)",
  "창호": "hsl(174, 72%, 40%)",
  "전기": "hsl(262, 83%, 58%)",
};

const DefectReport = () => {
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [highlightType, setHighlightType] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: allDefects = [], isLoading } = useQuery({
    queryKey: ["defects-report"],
    queryFn: async () => {
      const { data, error } = await supabase.from("defects").select("*, units(dong, ho)");
      if (error) throw error;
      return data;
    },
  });

  const getDateRange = (p: PeriodKey): { start: Date | null; end: Date | null } => {
    const now = new Date();
    if (p === "1w") return { start: subDays(now, 7), end: now };
    if (p === "1m") return { start: subMonths(now, 1), end: now };
    if (p === "3m") return { start: subMonths(now, 3), end: now };
    if (p === "custom") return { start: customStart || null, end: customEnd || null };
    return { start: null, end: null };
  };

  const filterByDate = (list: any[], range: { start: Date | null; end: Date | null }) => {
    if (!range.start && !range.end) return list;
    return list.filter((d: any) => {
      const date = parseISO(d.report_date);
      if (range.start && isBefore(date, range.start)) return false;
      if (range.end && isAfter(date, range.end)) return false;
      return true;
    });
  };

  const currentRange = getDateRange(period);
  const defects = useMemo(() => filterByDate(allDefects, currentRange), [allDefects, period, customStart, customEnd]);

  // Previous period for comparison
  const prevDefects = useMemo(() => {
    if (period === "all" || period === "custom") return null;
    const { start, end } = currentRange;
    if (!start || !end) return null;
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start.getTime());
    return filterByDate(allDefects, { start: prevStart, end: prevEnd });
  }, [allDefects, period, currentRange]);

  // Stats
  const totalCount = defects.length;
  const completedCount = defects.filter((d: any) => d.status === "처리완료").length;
  const completionRate = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const avgDays = useMemo(() => {
    const completed = defects.filter((d: any) => d.status === "처리완료" && d.visit_date);
    if (!completed.length) return 0;
    const sum = completed.reduce((acc: number, d: any) => {
      return acc + Math.max(0, Math.ceil((parseISO(d.visit_date).getTime() - parseISO(d.report_date).getTime()) / 86400000));
    }, 0);
    return Math.round(sum / completed.length);
  }, [defects]);

  // Previous period stats
  const prevTotal = prevDefects?.length || 0;
  const prevCompleted = prevDefects?.filter((d: any) => d.status === "처리완료").length || 0;
  const prevRate = prevTotal ? Math.round((prevCompleted / prevTotal) * 100) : 0;

  const diffCount = totalCount - prevTotal;
  const diffRate = completionRate - prevRate;

  // Defect by type
  const typeCount = new Map<string, { total: number; completed: number }>();
  defects.forEach((d: any) => {
    const entry = typeCount.get(d.defect_type) || { total: 0, completed: 0 };
    entry.total++;
    if (d.status === "처리완료") entry.completed++;
    typeCount.set(d.defect_type, entry);
  });
  const totalForPie = defects.length || 1;
  const defectByType = Array.from(typeCount.entries()).map(([name, data]) => ({
    name,
    value: data.total,
    pct: Math.round((data.total / totalForPie) * 100),
    completed: data.completed,
    color: typeColors[name] || "hsl(215, 15%, 50%)",
  }));

  // Defect by building
  const buildingCount = new Map<string, number>();
  defects.forEach((d: any) => {
    const dong = d.units?.dong || "기타";
    buildingCount.set(dong, (buildingCount.get(dong) || 0) + 1);
  });
  const defectByBuilding = Array.from(buildingCount.entries()).map(([name, count]) => ({ name: `${name}동`, count }));

  // Company stats
  const companyMap = new Map<string, { assigned: number; completed: number }>();
  defects.forEach((d: any) => {
    const company = d.company || "미배정";
    if (!companyMap.has(company)) companyMap.set(company, { assigned: 0, completed: 0 });
    const entry = companyMap.get(company)!;
    entry.assigned++;
    if (d.status === "처리완료") entry.completed++;
  });
  const companyData = useMemo(() => {
    const list = Array.from(companyMap.entries())
      .filter(([name]) => name !== "미배정")
      .map(([name, data]) => ({
        name,
        assigned: data.assigned,
        completed: data.completed,
        rateNum: data.assigned ? Math.round((data.completed / data.assigned) * 100) : 0,
      }));
    if (sortKey) {
      list.sort((a, b) => {
        const av = sortKey === "rate" ? a.rateNum : a[sortKey];
        const bv = sortKey === "rate" ? b.rateNum : b[sortKey];
        return sortDir === "asc" ? av - bv : bv - av;
      });
    }
    return list;
  }, [companyMap, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? <ArrowUp className="inline w-3 h-3 ml-0.5" /> : <ArrowDown className="inline w-3 h-3 ml-0.5" />;
  };

  const rateColor = (r: number) => r >= 90 ? "text-green-600" : r >= 70 ? "text-orange-500" : "text-destructive";
  const rateBarColor = (r: number) => r >= 90 ? "bg-green-500" : r >= 70 ? "bg-orange-400" : "bg-destructive";

  const ComparisonBadge = ({ diff, unit, invert }: { diff: number; unit: string; invert?: boolean }) => {
    if (!prevDefects) return null;
    const positive = invert ? diff < 0 : diff > 0;
    const negative = invert ? diff > 0 : diff < 0;
    return (
      <span className={`text-xs ml-1 ${positive ? "text-green-600" : negative ? "text-destructive" : "text-muted-foreground"}`}>
        {diff > 0 ? `▲${diff}${unit}` : diff < 0 ? `▼${Math.abs(diff)}${unit}` : `—`}
      </span>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">하자 통계 리포트</h1>
        <p className="page-description">동·층·유형별 분석 · 기간 비교 · 업체별 처리 속도 평가</p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">기간:</span>
        {periodButtons.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${period === p.key ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:bg-accent"}`}>
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs gap-1", period === "custom" && customStart && "border-primary")}>
                <CalendarIcon className="w-3 h-3" />
                {customStart ? format(customStart, "yy.MM.dd") : "시작일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customStart} onSelect={(d) => { setCustomStart(d); setPeriod("custom"); }} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-xs">~</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs gap-1", period === "custom" && customEnd && "border-primary")}>
                <CalendarIcon className="w-3 h-3" />
                {customEnd ? format(customEnd, "yy.MM.dd") : "종료일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customEnd} onSelect={(d) => { setCustomEnd(d); setPeriod("custom"); }} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {/* Comparison KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground mb-1">전체 접수 건수</div>
              <div className="text-2xl font-bold text-foreground">{totalCount}건 <ComparisonBadge diff={diffCount} unit="건" /></div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground mb-1">완료율</div>
              <div className="text-2xl font-bold text-foreground">{completionRate}% <ComparisonBadge diff={diffRate} unit="%p" /></div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground mb-1">평균 처리일</div>
              <div className="text-2xl font-bold text-foreground">{avgDays}일</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Donut chart */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold mb-4">하자 유형별 비율</h2>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={defectByType} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {defectByType.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={highlightType && highlightType !== entry.name ? 0.3 : 1} stroke={highlightType === entry.name ? "#000" : "none"} strokeWidth={highlightType === entry.name ? 2 : 0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => {
                      const item = defectByType.find(d => d.name === name);
                      return [`${value}건 (${item?.pct || 0}%)`, name];
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {defectByType.map(d => (
                    <button key={d.name} onClick={() => setHighlightType(h => h === d.name ? null : d.name)}
                      className={`flex items-center gap-2 text-sm w-full text-left rounded px-2 py-1 transition ${highlightType === d.name ? "bg-accent" : "hover:bg-accent/50"}`}>
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="flex-1">{d.name}</span>
                      <span className="font-medium">{d.value}건</span>
                      <span className="text-muted-foreground text-xs">{d.pct}%</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold mb-4">동별 하자 접수 현황</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={defectByBuilding}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(207, 90%, 54%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Company table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">업체별 처리 성과</h2></div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>업체명</th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("assigned")}>배정 건수{sortIcon("assigned")}</th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("completed")}>완료 건수{sortIcon("completed")}</th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort("rate")}>완료율{sortIcon("rate")}</th>
                </tr>
              </thead>
              <tbody>
                {companyData.map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.assigned}</td>
                    <td>{c.completed}</td>
                    <td>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${rateBarColor(c.rateNum)}`} style={{ width: `${c.rateNum}%` }} />
                        </div>
                        <span className={`text-sm font-medium ${rateColor(c.rateNum)}`}>{c.rateNum}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {companyData.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">업체 데이터가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DefectReport;
