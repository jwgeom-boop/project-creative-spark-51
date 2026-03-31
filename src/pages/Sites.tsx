import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Sites = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", address: "", total_units: "" });

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sites").insert({
        name: newSite.name,
        address: newSite.address,
        total_units: parseInt(newSite.total_units) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("현장이 등록되었습니다.");
      setAddOpen(false);
      setNewSite({ name: "", address: "", total_units: "" });
    },
    onError: (e) => toast.error("등록 실패: " + e.message),
  });

  const filtered = sites.filter((s: any) => s.name.includes(search) || (s.address || "").includes(search));

  const getStatusBadge = (status: string) => {
    if (status === "진행중") return "status-complete";
    if (status === "준비중") return "status-pending";
    return "status-info";
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((site: any) => (
            <div key={site.id} className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{site.name}</h3>
                <span className={`status-badge ${getStatusBadge(site.status)}`}>{site.status}</span>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex justify-between"><span>주소</span><span className="text-foreground">{site.address || "—"}</span></div>
                <div className="flex justify-between"><span>세대수</span><span className="text-foreground">{site.total_units}세대</span></div>
                <div className="flex justify-between"><span>입주시작</span><span className="text-foreground">{site.move_in_start || "—"}</span></div>
                <div className="flex justify-between"><span>입주종료</span><span className="text-foreground">{site.move_in_end || "—"}</span></div>
              </div>
              <button className="w-full mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={() => toast.success(`${site.name}(으)로 전환되었습니다.`)}>현장 전환</button>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center py-10 text-muted-foreground">검색 결과가 없습니다.</div>}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>새 현장 등록</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0 text-muted-foreground">단지명</label>
              <input type="text" value={newSite.name} onChange={e => setNewSite(p => ({ ...p, name: e.target.value }))} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="단지명 입력" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0 text-muted-foreground">주소</label>
              <input type="text" value={newSite.address} onChange={e => setNewSite(p => ({ ...p, address: e.target.value }))} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="주소 입력" />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0 text-muted-foreground">세대수</label>
              <input type="number" value={newSite.total_units} onChange={e => setNewSite(p => ({ ...p, total_units: e.target.value }))} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="300" />
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setAddOpen(false)}>취소</button>
              <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={() => addMutation.mutate()} disabled={!newSite.name}>등록</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sites;
