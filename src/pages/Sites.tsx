import { useState } from "react";
import { Search, Plus, MapPin, Building2, Calendar, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SiteForm>(emptyForm);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
      dongCount: "",
      moveInStart: site.move_in_start || "",
      moveInEnd: site.move_in_end || "",
      developer: "",
      contractor: "",
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
    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      total_units: Number(form.totalUnits),
      move_in_start: form.moveInStart || null,
      move_in_end: form.moveInEnd || null,
      status: form.status,
    };

    if (editingSiteId) {
      const { error } = await supabase.from("sites").update(payload).eq("id", editingSiteId);
      setSaving(false);
      if (error) { toast.error("현장 수정에 실패했습니다."); return; }
      toast.success("현장 정보가 수정되었습니다.");
    } else {
      const { error } = await supabase.from("sites").insert([payload]).select().single();
      setSaving(false);
      if (error) { toast.error("현장 저장에 실패했습니다. 다시 시도해주세요."); return; }
      toast.success(`${form.name} 현장이 등록되었습니다.`);
    }
    queryClient.invalidateQueries({ queryKey: ["sites"] });
    setModalOpen(false);
    setForm(emptyForm);
    setEditingSiteId(null);
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
          {filtered.map((site: any) => (
            <div key={site.id} className="bg-card rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">{site.name}</h3>
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusBadge(site.status)}`}>{site.status}</span>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="text-foreground truncate">{site.address || "—"}</span></div>
                <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 shrink-0" /><span className="text-foreground">총 {site.total_units}세대</span></div>
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0" /><span className="text-foreground">입주: {site.move_in_start || "미정"} ~ {site.move_in_end || "미정"}</span></div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <button className="text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors" onClick={() => toast.success(`${site.name}(으)로 전환되었습니다.`)}>현장 전환</button>
                <button className="p-1.5 rounded-md hover:bg-accent transition-colors" onClick={() => openEdit(site)}><Pencil className="w-4 h-4 text-muted-foreground" /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center py-10 text-muted-foreground">검색 결과가 없습니다.</div>}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setModalOpen(false); setEditingSiteId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingSiteId ? "현장 수정" : "새 현장 등록"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-1">
            <FormField label="단지명" required>
              <input type="text" value={form.name} onChange={e => setField("name", e.target.value)} className="form-input" placeholder="예: 힐스테이트 광교중앙역" />
            </FormField>
            <FormField label="주소" required>
              <input type="text" value={form.address} onChange={e => setField("address", e.target.value)} className="form-input" placeholder="예: 경기도 수원시 영통구 법조로 105" />
            </FormField>
            <FormField label="전체 세대수" required>
              <input type="number" value={form.totalUnits} onChange={e => setField("totalUnits", e.target.value)} className="form-input" placeholder="예: 450" />
            </FormField>
            <FormField label="동 수">
              <input type="number" value={form.dongCount} onChange={e => setField("dongCount", e.target.value)} className="form-input" placeholder="예: 6" />
            </FormField>
            <div className="flex gap-3">
              <FormField label="입주 시작일" className="flex-1">
                <input type="date" value={form.moveInStart} onChange={e => setField("moveInStart", e.target.value)} className="form-input" />
              </FormField>
              <FormField label="입주 종료일" className="flex-1">
                <input type="date" value={form.moveInEnd} onChange={e => setField("moveInEnd", e.target.value)} className="form-input" />
              </FormField>
            </div>
            <FormField label="시행사명">
              <input type="text" value={form.developer} onChange={e => setField("developer", e.target.value)} className="form-input" placeholder="예: 현대건설" />
            </FormField>
            <FormField label="시공사명">
              <input type="text" value={form.contractor} onChange={e => setField("contractor", e.target.value)} className="form-input" placeholder="예: 현대엔지니어링" />
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
    </div>
  );
};

const FormField = ({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <label className="text-sm font-medium text-muted-foreground mb-1 block">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export default Sites;
