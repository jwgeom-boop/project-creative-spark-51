import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const defectByType = [
  { name: "도배·도장", value: 32, color: "hsl(207, 90%, 54%)" },
  { name: "배관·수도", value: 22, color: "hsl(25, 95%, 53%)" },
  { name: "바닥재", value: 18, color: "hsl(142, 71%, 45%)" },
  { name: "창호·문", value: 15, color: "hsl(174, 72%, 40%)" },
  { name: "전기", value: 8, color: "hsl(262, 83%, 58%)" },
  { name: "기타", value: 5, color: "hsl(215, 15%, 50%)" },
];

const defectByBuilding = [
  { name: "101동", count: 87 },
  { name: "102동", count: 72 },
  { name: "103동", count: 58 },
  { name: "104동", count: 63 },
];

const companyData = [
  { name: "(주)리모코", assigned: 45, completed: 40, rate: "89%", avgDays: "2.8일", rating: "★★★★☆", recommend: "권장" },
  { name: "(주)창호월드", assigned: 28, completed: 26, rate: "93%", avgDays: "1.9일", rating: "★★★★★", recommend: "권장" },
  { name: "(주)설비왕", assigned: 32, completed: 28, rate: "88%", avgDays: "3.2일", rating: "★★★☆☆", recommend: "검토" },
  { name: "(주)전기사랑", assigned: 18, completed: 15, rate: "83%", avgDays: "4.1일", rating: "★★★☆☆", recommend: "검토" },
];

const DefectReport = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">하자 통계 리포트</h1>
        <p className="page-description">동·층·유형별 분석 · 기간 비교 · 업체별 처리 속도 평가</p>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-muted-foreground">기간:</span>
        {["1주", "1개월", "3개월", "전체"].map((p, i) => (
          <button key={p} className={`px-3 py-1.5 text-xs rounded-md border ${i === 2 ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}>{p}</button>
        ))}
        <span className="text-sm text-muted-foreground ml-4">비교기간: 전월 대비</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart - Defect Type */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">하자 유형별 비율</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={defectByType} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {defectByType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
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

        {/* Bar Chart - By Building */}
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

      {/* Company Performance */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">업체별 처리 성과</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>업체명</th><th>배정 건수</th><th>완료 건수</th><th>완료율</th><th>평균처리일</th><th>만족도</th><th>재계약</th></tr>
          </thead>
          <tbody>
            {companyData.map((c, i) => (
              <tr key={i}>
                <td className="font-medium">{c.name}</td>
                <td>{c.assigned}</td>
                <td>{c.completed}</td>
                <td className="font-medium">{c.rate}</td>
                <td>{c.avgDays}</td>
                <td className="text-warning">{c.rating}</td>
                <td><span className={`status-badge ${c.recommend === "권장" ? "status-complete" : "status-pending"}`}>{c.recommend}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DefectReport;
