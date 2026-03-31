import { Search, Download, Plus } from "lucide-react";

const siteData = [
  { name: "○○아파트 101현장", builder: "(주)○○건설", constructor: "(주)○○주택", units: "300세대", buildings: "4개동", status: "운영중", period: "2026.03~06" },
  { name: "△△힐스테이트 202현장", builder: "(주)△△건설", constructor: "(주)△△종건", units: "520세대", buildings: "6개동", status: "준비중", period: "2026.05~08" },
  { name: "□□자이 303현장", builder: "(주)□□건설", constructor: "(주)□□건설", units: "180세대", buildings: "2개동", status: "완료", period: "2025.11~2026.02" },
];

const Sites = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">현장 목록</h1>
        <p className="page-description">관리 중인 현장 목록 · 현장 전환 · 새 현장 등록</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="현장명 검색" className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <button className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1"><Plus className="w-4 h-4" /> 현장 추가</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {siteData.map((site, i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{site.name}</h3>
              <span className={`status-badge ${site.status === "운영중" ? "status-complete" : site.status === "준비중" ? "status-pending" : "status-info"}`}>{site.status}</span>
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>시행사</span><span className="text-foreground">{site.builder}</span></div>
              <div className="flex justify-between"><span>시공사</span><span className="text-foreground">{site.constructor}</span></div>
              <div className="flex justify-between"><span>세대수</span><span className="text-foreground">{site.units}</span></div>
              <div className="flex justify-between"><span>동수</span><span className="text-foreground">{site.buildings}</span></div>
              <div className="flex justify-between"><span>운영기간</span><span className="text-foreground">{site.period}</span></div>
            </div>
            <button className="w-full mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">현장 전환</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sites;
