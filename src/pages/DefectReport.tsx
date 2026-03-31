import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DefectReport = () => {
  const { data: defects = [], isLoading } = useQuery({
    queryKey: ["defects-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("defects")
        .select("*, units(dong, ho)");
      if (error) throw error;
      return data;
    },
  });

  // Defect by type
  const typeCount = new Map<string, number>();
  defects.forEach((d: any) => {
    typeCount.set(d.defect_type, (typeCount.get(d.defect_type) || 0) + 1);
  });
  const total = defects.length || 1;
  const typeColors: Record<string, string> = {
    "도배·도장": "hsl(207, 90%, 54%)",
    "배관·수도": "hsl(25, 95%, 53%)",
    "바닥재": "hsl(142, 71%, 45%)",
    "창호": "hsl(174, 72%, 40%)",
    "전기": "hsl(262, 83%, 58%)",
  };
  const defectByType = Array.from(typeCount.entries()).map(([name, value]) => ({
    name, value: Math.round((value / total) * 100),
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
  const companyData = Array.from(companyMap.entries())
    .filter(([name]) => name !== "미배정")
    .map(([name, data]) => ({
      name,
      assigned: data.assigned,
      completed: data.completed,
      rate: data.assigned ? `${Math.round((data.completed / data.assigned) * 100)}%` : "0%",
    }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">하자 통계 리포트</h1>
        <p className="page-description">동·층·유형별 분석 · 기간 비교 · 업체별 처리 속도 평가</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-muted-foreground">기간:</span>
        {["1주", "1개월", "3개월", "전체"].map((p, i) => (
          <button key={p} className={`px-3 py-1.5 text-xs rounded-md border ${i === 3 ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}>{p}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold mb-4">하자 유형별 비율</h2>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={defectByType} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {defectByType.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {defectByType.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                      <span className="font-medium ml-auto">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

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

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">업체별 처리 성과</h2></div>
            <table className="data-table">
              <thead><tr><th>업체명</th><th>배정 건수</th><th>완료 건수</th><th>완료율</th></tr></thead>
              <tbody>
                {companyData.map((c, i) => (
                  <tr key={i}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.assigned}</td>
                    <td>{c.completed}</td>
                    <td className="font-medium">{c.rate}</td>
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
