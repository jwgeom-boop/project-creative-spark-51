import { useState } from "react";
import { Search, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const siteData = [
  { name: "○○아파트 101현장", builder: "(주)○○건설", constructor: "(주)○○주택", units: "300세대", buildings: "4개동", status: "운영중", period: "2026.03~06" },
  { name: "△△힐스테이트 202현장", builder: "(주)△△건설", constructor: "(주)△△종건", units: "520세대", buildings: "6개동", status: "준비중", period: "2026.05~08" },
  { name: "□□자이 303현장", builder: "(주)□□건설", constructor: "(주)□□건설", units: "180세대", buildings: "2개동", status: "완료", period: "2025.11~2026.02" },
];

const Sites = () => {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = siteData.filter(s => s.name.includes(search) || s.builder.includes(search));

  const handleAddSite = () => {
    toast.success("현장이 등록되었습니다.");
    setAddOpen(false);
  };

  const handleSwitch = (name: string) => {
    toast.success(`${name}(으)로 전환되었습니다.`);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">현장 목록</h1>
        <p className="page-description">관리 중인 현장 목록 · 현장 전환 · 새 현장 등록</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="현장명 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <button className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> 현장 추가</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((site, i) => (
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
            <button className="w-full mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={() => handleSwitch(site.name)}>현장 전환</button>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-10 text-muted-foreground">검색 결과가 없습니다.</div>}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>새 현장 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {["단지명", "시행사", "시공사", "세대수", "동수", "운영기간"].map(label => (
              <div key={label} className="flex items-center gap-3">
                <label className="text-sm font-medium w-20 shrink-0 text-muted-foreground">{label}</label>
                <input type="text" className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder={`${label} 입력`} />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setAddOpen(false)}>취소</button>
              <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={handleAddSite}>등록</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sites;
