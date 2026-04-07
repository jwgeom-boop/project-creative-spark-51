import { useState } from "react";
import { Search, Plus, MapPin, Building2, Calendar, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SiteForm {
  name: string;
  address: string;
  totalUnits: string;
  dongCount: string;
  moveInStart: string;
  moveInEnd: string;
  developer: string;
  contractor: string;
  status: string;
}

const emptyForm: SiteForm = {
  name: "", address: "", totalUnits: "", dongCount: "",
  moveInStart: "", moveInEnd: "", developer: "", contractor: "", status: "준비중",
};

const Sites = () => {
  const queryClient = useQueryClient();
  const { activeSiteId, setActiveSite } = useAuth();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SiteForm>(emptyForm);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Switch confirmation
  const [switchTarget, setSwitchTarget] = useState<{ id: string; name: string } | null>(null);
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Auto-set first site as active if none set
  if (!activeSiteId && sites.length > 0) {
    setActiveSite(sites[0].id, sites[0].name);
  }

  const openAdd = () => {
    setForm(emptyForm);
    setEditingSiteId(null);
    setModalOpen(true);
  };

  const openEdit = (site: any) => {
    setForm({
      name: site.name || "",
      address: site.address || "",
      totalUnits: String(site.total_units ?? ""),
      dongCount: String(site.dong_count ?? ""),
      moveInStart: site.move_in_start || "",
      moveInEnd: site.move_in_end || "",
      developer: site.developer_name || "",
      contractor: site.constructor_name || "",
      status: site.status || "준비중",
    });
    setEditingSiteId(site.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.totalUnits.trim()) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      address: form.address.trim(),
      total_units: Number(form.totalUnits),
      dong_count: form.dongCount ? Number(form.dongCount) : 0,
      move_in_start: form.moveInStart || null,
      move_in_end: form.moveInEnd || null,
      developer_name: form.developer.trim(),
      constructor_name: form.contractor.trim(),
      status: form.status,
    };

    if (editingSiteId) {
      const { error } = await supabase.from("sites").update(payload).eq("id", editingSiteId);
      setSaving(false);
      if (error) { toast.error(`수정 실패: ${error.message}`); return; }
      toast.success("현장 정보가 수정되었습니다.");
      // Update active site name if editing active site
      if (editingSiteId === activeSiteId) {
        setActiveSite(editingSiteId, payload.name);
      }
    } else {
      const { data, error } = await supabase.from("sites").insert([payload]).select().single();
      setSaving(false);
      if (error) { toast.error(`저장 실패: ${error.message}`); return; }
      toast.success(`${form.name} 현장이 등록되었습니다.`);
      // If first site, auto-activate
      if (sites.length === 0 && data) {
        setActiveSite(data.id, data.name);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["sites"] });
    setModalOpen(false);
    setForm(emptyForm);
    setEditingSiteId(null);
  };

  const handleSwitch = () => {
    if (!switchTarget) return;
    setActiveSite(switchTarget.id, switchTarget.name);
    toast.success(`${switchTarget.name}(으)로 전환되었습니다.`);
    setSwitchTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("sites").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error(`삭제 실패: ${error.message}`); return; }
    toast.success("현장이 삭제되었습니다.");
    queryClient.invalidateQueries({ queryKey: ["sites"] });
    setDeleteTarget(null);
  };

  const setField = (key: keyof SiteForm, value: string) => setForm(p => ({ ...p, [key]: value }));

  const filtered = sites.filter((s: any) => s.name.includes(search) || (s.address || "").includes(search));

  const statusBadge = (status: string) => {
    if (status === "준비중") return "bg-yellow-50 text-yellow-600";
    if (status === "진행중") return "bg-blue-50 text-blue-600";
    if (status === "완료") return "bg-green-50 text-green-600";
    return "bg-muted text-muted-foreground";
  };

  return (
    <TooltipProvider>
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
          <button className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={openAdd}><Plus className="w-4 h-4" /> 현장 추가</button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((site: any) => {
              const isActive = site.id === activeSiteId;
              return (
                <div key={site.id} className={`bg-card rounded-lg border p-5 hover:shadow-md transition-shadow relative ${isActive ? "border-primary ring-1 ring-primary/20" : "border-border"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{site.name}</h3>
                      {isActive && <span className="text-[10px] rounded-full px-2 py-0.5 font-semibold bg-primary text-primary-foreground">현재 현장</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusBadge(site.status)}`}>{site.status}</span>
                      {isActive ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="p-1 rounded-md text-muted-foreground/30 cursor-not-allowed" disabled>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">현재 운영 중인 현장은 삭제할 수 없습니다.</p></TooltipContent>
                        </Tooltip>
                      ) : (
                        <button className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-accent transition-colors" onClick={() => setDeleteTarget({ id: site.id, name: site.name })}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="text-foreground truncate">{site.address || "—"}</span></div>
                    <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 shrink-0" /><span className="text-foreground">총 {site.total_units}세대{site.dong_count ? ` · ${site.dong_count}개동` : ""}</span></div>
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" /><span className="text-foreground">입주: {site.move_in_start || "미정"} ~ {site.move_in_end || "미정"}</span></div>
                    {(site.developer_name || site.constructor_name) && (
                      <div className="text-xs text-muted-foreground pt-1">
                        {site.developer_name && <span>시행: {site.developer_name}</span>}
                        {site.developer_name && site.constructor_name && <span className="mx-1">·</span>}
                        {site.constructor_name && <span>시공: {site.constructor_name}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    {isActive ? (
                      <span className="text-xs text-muted-foreground">현재 선택된 현장</span>
                    ) : (
                      <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors flex items-center gap-1" onClick={() => setSwitchTarget({ id: site.id, name: site.name })}>
                        <ArrowRightLeft className="w-3 h-3" /> 현장 전환
                      </button>
                    )}
                    <button className="p-1.5 rounded-md hover:bg-accent transition-colors" onClick={() => openEdit(site)}><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="col-span-full text-center py-10 text-muted-foreground">검색 결과가 없습니다.</div>}
          </div>
        )}

        {/* Form Dialog */}
        <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); setEditingSiteId(null); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingSiteId ? "현장 수정" : "새 현장 등록"}</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
              <FormField label="단지명" required>
                <input type="text" value={form.name} onChange={e => setField("name", e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="예: 힐스테이트 광교중앙역" />
              </FormField>
              <FormField label="주소" required>
                <input type="text" value={form.address} onChange={e => setField("address", e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="예: 경기도 수원시 영통구 법조로 105" />
              </FormField>
              <FormField label="전체 세대수" required>
                <input type="number" value={form.totalUnits} onChange={e => setField("totalUnits", e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="예: 450" />
              </FormField>
              <FormField label="동 수">
                <input type="number" value={form.dongCount} onChange={e => setField("dongCount", e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="예: 6" />
              </FormField>
              <div className="flex gap-3">
                <FormField label="입주 시작일" className="flex-1">
                  <input type="date" value={form.moveInStart} onChange={e => setField("moveInStart", e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
                </FormField>
                <FormField label="입주 종료일" className="flex-1">
                  <input type="date" value={form.moveInEnd} onChange={e => setField("moveInEnd", e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
                </FormField>
              </div>
              <FormField label="시행사명">
                <input type="text" value={form.developer} onChange={e => setField("developer", e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="예: 현대건설" />
              </FormField>
              <FormField label="시공사명">
                <input type="text" value={form.contractor} onChange={e => setField("contractor", e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="예: 현대엔지니어링" />
              </FormField>
              <FormField label="상태">
                <Select value={form.status} onValueChange={v => setField("status", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="준비중">준비중</SelectItem>
                    <SelectItem value="진행중">진행중</SelectItem>
                    <SelectItem value="완료">완료</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setModalOpen(false)}>취소</button>
              <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />}
                저장하기
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Switch Confirmation */}
        <AlertDialog open={!!switchTarget} onOpenChange={(o) => !o && setSwitchTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{switchTarget?.name}(으)로 현장을 전환하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>전환 후 모든 데이터가 해당 현장 기준으로 표시됩니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSwitchTarget(null)}>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleSwitch}>전환</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{deleteTarget?.name}을(를) 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                삭제 시 해당 현장의 모든 데이터가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTarget(null)}>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "삭제 중..." : "삭제"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

const FormField = ({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <label className="text-sm font-medium text-muted-foreground mb-1 block">
      {label}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export default Sites;
