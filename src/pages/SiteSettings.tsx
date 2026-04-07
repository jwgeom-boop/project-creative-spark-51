import { useState, useEffect } from "react";
import { Save, Plus, Pencil, Trash2, X, Check, Ban, PlayCircle, Bell, Send } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// ─── Types ───
interface SlotRow {
  id: string;
  time: string;
  max: number;
  current: number;
  closed: boolean;
}

interface NotifItem {
  key: string;
  label: string;
  enabled: boolean;
  sms: boolean;
  push: boolean;
}

const NOTIF_DEFAULTS: NotifItem[] = [
  { key: "balance_due", label: "잔금 납부 알림 (D-7·D-3·D-day)", enabled: true, sms: false, push: true },
  { key: "overdue", label: "연체 즉시 알림", enabled: true, sms: true, push: true },
  { key: "moving_unreserved", label: "이사 미예약 알림 (D-14·D-7)", enabled: true, sms: false, push: true },
  { key: "defect_received", label: "하자 접수 즉시 알림", enabled: true, sms: false, push: true },
  { key: "inspection_reserved", label: "사전점검 예약 완료 알림", enabled: false, sms: false, push: true },
  { key: "agreement_unsigned", label: "동의서 미서명 알림", enabled: false, sms: false, push: true },
  { key: "permit_request", label: "입주증 발급 요청 알림", enabled: false, sms: false, push: true },
];

const NOTIF_STORAGE_KEY = "site_notification_settings";

// ─── Slot Editor Sub-component ───
const SlotTable = ({
  title, slots, onUpdate, onDelete, onAdd, onToggleClose, onCloseAll, onOpenAll,
}: {
  title: string;
  slots: SlotRow[];
  onUpdate: (id: string, max: number) => void;
  onDelete: (slot: SlotRow) => void;
  onAdd: (time: string, max: number) => void;
  onToggleClose: (id: string, closed: boolean) => void;
  onCloseAll: () => void;
  onOpenAll: () => void;
}) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [editMax, setEditMax] = useState(0);
  const [addMode, setAddMode] = useState(false);
  const [addTime, setAddTime] = useState("");
  const [addMax, setAddMax] = useState(4);
  const [confirmClose, setConfirmClose] = useState<{ id: string; closed: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SlotRow | null>(null);
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);

  const allClosed = slots.length > 0 && slots.every(s => s.closed);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="ml-auto flex gap-1.5">
          {allClosed ? (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={onOpenAll}>
              <PlayCircle className="w-3.5 h-3.5 mr-1" /> 전체 운영 재개
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setConfirmCloseAll(true)}>
              <Ban className="w-3.5 h-3.5 mr-1" /> 전체 마감
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setAddMode(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> 슬롯 추가
          </Button>
        </div>
      </div>
      <table className="data-table">
        <thead><tr><th>시간대</th><th>최대세대</th><th>현재예약</th><th>운영상태</th><th className="text-center">관리</th></tr></thead>
        <tbody>
          {slots.map(s => (
            <tr key={s.id} className={s.closed ? "bg-muted/50" : ""}>
              <td className={s.closed ? "text-muted-foreground line-through" : ""}>{s.time}</td>
              <td>
                {editId === s.id ? (
                  <Input type="number" min={1} value={editMax} onChange={e => setEditMax(Number(e.target.value))} className="h-7 w-20 text-sm" />
                ) : (
                  `${s.max}세대`
                )}
              </td>
              <td>{s.current}세대</td>
              <td>
                <span className={`status-badge ${s.closed ? "status-error" : "status-complete"}`}>
                  {s.closed ? "마감" : "운영중"}
                </span>
              </td>
              <td className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {editId === s.id ? (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => { onUpdate(s.id, editMax); setEditId(null); }}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditId(null)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditId(s.id); setEditMax(s.max); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                        if (!s.closed) setConfirmClose({ id: s.id, closed: true });
                        else onToggleClose(s.id, false);
                      }}>
                        {s.closed ? <PlayCircle className="w-3.5 h-3.5 text-primary" /> : <Ban className="w-3.5 h-3.5 text-warning" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(s)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {addMode && (
            <tr>
              <td><Input value={addTime} onChange={e => setAddTime(e.target.value)} placeholder="예: 09:00~10:00" className="h-7 text-sm w-28" /></td>
              <td><Input type="number" min={1} value={addMax} onChange={e => setAddMax(Number(e.target.value))} className="h-7 text-sm w-20" /></td>
              <td>0세대</td>
              <td><span className="status-badge status-complete">운영중</span></td>
              <td className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => { if (!addTime) { toast.error("시간대를 입력해주세요."); return; } onAdd(addTime, addMax); setAddMode(false); setAddTime(""); setAddMax(4); }}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setAddMode(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          )}
          {slots.length === 0 && !addMode && <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">슬롯 데이터 없음</td></tr>}
        </tbody>
      </table>

      {/* Close confirm */}
      <AlertDialog open={!!confirmClose} onOpenChange={v => { if (!v) setConfirmClose(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>해당 시간대를 마감 처리하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>마감 시 예약 페이지에서 해당 슬롯을 선택할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmClose) onToggleClose(confirmClose.id, true); setConfirmClose(null); }}>마감</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={v => { if (!v) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>슬롯을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && confirmDelete.current > 0
                ? `현재 예약이 ${confirmDelete.current}건 있습니다. 삭제하시겠습니까?`
                : "이 슬롯을 삭제합니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (confirmDelete) onDelete(confirmDelete); setConfirmDelete(null); }}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close all confirm */}
      <AlertDialog open={confirmCloseAll} onOpenChange={setConfirmCloseAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모든 슬롯을 마감하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>전체 시간대가 마감 처리됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onCloseAll(); setConfirmCloseAll(false); }}>전체 마감</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Main Component ───
const SiteSettings = () => {
  const queryClient = useQueryClient();

  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [siteStatus, setSiteStatus] = useState("");
  const [moveInStart, setMoveInStart] = useState("");
  const [moveInEnd, setMoveInEnd] = useState("");
  const [movingStart, setMovingStart] = useState("");
  const [movingEnd, setMovingEnd] = useState("");

  // Notification settings
  const [notifSettings, setNotifSettings] = useState<NotifItem[]>(NOTIF_DEFAULTS);

  // Slot data (local state since no dedicated DB table)
  const [inspSlots, setInspSlots] = useState<SlotRow[]>([]);
  const [movingSlots, setMovingSlots] = useState<SlotRow[]>([
    { id: "m1", time: "오전 (09:00~12:00)", max: 4, current: 0, closed: false },
    { id: "m2", time: "오후 (13:00~17:00)", max: 4, current: 0, closed: false },
  ]);

  const { data: site, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (site) {
      setSiteName(site.name || "");
      setSiteAddress(site.address || "");
      setTotalUnits(String(site.total_units || 0));
      setSiteStatus(site.status || "");
      setMoveInStart(site.move_in_start || "");
      setMoveInEnd(site.move_in_end || "");
    }
  }, [site]);

  // Load notification settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (saved) {
      try { setNotifSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Build inspection slots from DB data
  const { data: inspections = [] } = useQuery({
    queryKey: ["inspections-for-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inspections").select("time_slot, status");
      if (error) throw error;
      return data;
    },
  });

  const { data: movingSchedules = [] } = useQuery({
    queryKey: ["moving-for-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("moving_schedules").select("time_slot");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const slotMap = new Map<string, number>();
    inspections.forEach((ins: any) => {
      slotMap.set(ins.time_slot, (slotMap.get(ins.time_slot) || 0) + 1);
    });
    const savedSlots = localStorage.getItem("insp_slots_settings");
    const savedParsed: Record<string, { max: number; closed: boolean }> = savedSlots ? JSON.parse(savedSlots) : {};

    const slots: SlotRow[] = Array.from(slotMap.entries()).map(([time, count], i) => ({
      id: `insp_${i}`,
      time,
      max: savedParsed[time]?.max ?? 30,
      current: count,
      closed: savedParsed[time]?.closed ?? false,
    }));
    setInspSlots(slots);
  }, [inspections]);

  useEffect(() => {
    const slotMap = new Map<string, number>();
    movingSchedules.forEach((m: any) => {
      slotMap.set(m.time_slot, (slotMap.get(m.time_slot) || 0) + 1);
    });
    setMovingSlots(prev => prev.map(s => ({ ...s, current: slotMap.get(s.time.includes("오전") ? "오전" : "오후") || 0 })));
  }, [movingSchedules]);

  // Persist slot settings to localStorage
  const persistInspSlots = (slots: SlotRow[]) => {
    const map: Record<string, { max: number; closed: boolean }> = {};
    slots.forEach(s => { map[s.time] = { max: s.max, closed: s.closed }; });
    localStorage.setItem("insp_slots_settings", JSON.stringify(map));
  };

  const persistMovingSlots = (slots: SlotRow[]) => {
    const map: Record<string, { max: number; closed: boolean }> = {};
    slots.forEach(s => { map[s.time] = { max: s.max, closed: s.closed }; });
    localStorage.setItem("moving_slots_settings", JSON.stringify(map));
  };

  // Slot handlers for inspection
  const handleInspUpdate = (id: string, max: number) => {
    const next = inspSlots.map(s => s.id === id ? { ...s, max } : s);
    setInspSlots(next); persistInspSlots(next);
    toast.success("슬롯이 수정되었습니다.");
  };
  const handleInspDelete = (slot: SlotRow) => {
    const next = inspSlots.filter(s => s.id !== slot.id);
    setInspSlots(next); persistInspSlots(next);
    toast.success("슬롯이 삭제되었습니다.");
  };
  const handleInspAdd = (time: string, max: number) => {
    const next = [...inspSlots, { id: `insp_${Date.now()}`, time, max, current: 0, closed: false }];
    setInspSlots(next); persistInspSlots(next);
    toast.success("슬롯이 추가되었습니다.");
  };
  const handleInspToggleClose = (id: string, closed: boolean) => {
    const next = inspSlots.map(s => s.id === id ? { ...s, closed } : s);
    setInspSlots(next); persistInspSlots(next);
    toast.success(closed ? "슬롯이 마감되었습니다." : "슬롯이 운영 재개되었습니다.");
  };
  const handleInspCloseAll = () => {
    const next = inspSlots.map(s => ({ ...s, closed: true }));
    setInspSlots(next); persistInspSlots(next);
    toast.success("전체 슬롯이 마감되었습니다.");
  };
  const handleInspOpenAll = () => {
    const next = inspSlots.map(s => ({ ...s, closed: false }));
    setInspSlots(next); persistInspSlots(next);
    toast.success("전체 슬롯이 운영 재개되었습니다.");
  };

  // Slot handlers for moving
  const handleMovingUpdate = (id: string, max: number) => {
    const next = movingSlots.map(s => s.id === id ? { ...s, max } : s);
    setMovingSlots(next); persistMovingSlots(next);
    toast.success("이사 슬롯이 수정되었습니다.");
  };
  const handleMovingDelete = (slot: SlotRow) => {
    const next = movingSlots.filter(s => s.id !== slot.id);
    setMovingSlots(next); persistMovingSlots(next);
    toast.success("이사 슬롯이 삭제되었습니다.");
  };
  const handleMovingAdd = (time: string, max: number) => {
    const next = [...movingSlots, { id: `mov_${Date.now()}`, time, max, current: 0, closed: false }];
    setMovingSlots(next); persistMovingSlots(next);
    toast.success("이사 슬롯이 추가되었습니다.");
  };
  const handleMovingToggleClose = (id: string, closed: boolean) => {
    const next = movingSlots.map(s => s.id === id ? { ...s, closed } : s);
    setMovingSlots(next); persistMovingSlots(next);
    toast.success(closed ? "이사 슬롯이 마감되었습니다." : "이사 슬롯이 운영 재개되었습니다.");
  };
  const handleMovingCloseAll = () => {
    const next = movingSlots.map(s => ({ ...s, closed: true }));
    setMovingSlots(next); persistMovingSlots(next);
    toast.success("전체 이사 슬롯이 마감되었습니다.");
  };
  const handleMovingOpenAll = () => {
    const next = movingSlots.map(s => ({ ...s, closed: false }));
    setMovingSlots(next); persistMovingSlots(next);
    toast.success("전체 이사 슬롯이 운영 재개되었습니다.");
  };

  // Site mutations
  const updateSiteInfo = useMutation({
    mutationFn: async () => {
      if (!site) throw new Error("사이트 정보 없음");
      const { error } = await supabase.from("sites").update({
        name: siteName, address: siteAddress, total_units: parseInt(totalUnits) || 0, status: siteStatus,
      }).eq("id", site.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["site-settings"] }); toast.success("단지 정보가 저장되었습니다."); },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const updatePeriod = useMutation({
    mutationFn: async () => {
      if (!site) throw new Error("사이트 정보 없음");
      const { error } = await supabase.from("sites").update({
        move_in_start: moveInStart || null, move_in_end: moveInEnd || null,
      }).eq("id", site.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["site-settings"] }); toast.success("운영 기간이 저장되었습니다."); },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  // Notification handlers
  const updateNotif = (key: string, field: "enabled" | "sms" | "push", value: boolean) => {
    setNotifSettings(prev => prev.map(n => n.key === key ? { ...n, [field]: value } : n));
  };

  const saveNotifications = () => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifSettings));
    toast.success("알림 설정이 저장되었습니다.");
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">현장 기본 설정</h1>
        <p className="page-description">단지 정보 · 사검 슬롯 설정 · 이사 슬롯 설정 · 알림 설정 · 운영 기간</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Site info + Period */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold mb-4">단지 기본 정보</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">단지명</label>
                  <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">주소</label>
                  <input type="text" value={siteAddress} onChange={e => setSiteAddress(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">총 세대수</label>
                  <input type="number" value={totalUnits} onChange={e => setTotalUnits(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">상태</label>
                  <input type="text" value={siteStatus} onChange={e => setSiteStatus(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                </div>
              </div>
              <button className="mt-4 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => updateSiteInfo.mutate()} disabled={updateSiteInfo.isPending}>
                <Save className="w-4 h-4" /> {updateSiteInfo.isPending ? "저장 중..." : "저 장"}
              </button>
            </div>

            <div className="bg-card rounded-lg border border-border p-5">
              <h2 className="text-sm font-semibold mb-4">운영 기간</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">입주시작</label>
                  <input type="date" value={moveInStart} onChange={e => setMoveInStart(e.target.value)} className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">입주종료</label>
                  <input type="date" value={moveInEnd} onChange={e => setMoveInEnd(e.target.value)} className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">이사시작</label>
                    <input type="date" value={movingStart} onChange={e => setMovingStart(e.target.value)} className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">이사종료</label>
                  <input type="date" value={movingEnd} onChange={e => setMovingEnd(e.target.value)} className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
                </div>
              </div>
              <button className="mt-4 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => updatePeriod.mutate()} disabled={updatePeriod.isPending}>
                <Save className="w-4 h-4" /> {updatePeriod.isPending ? "저장 중..." : "저 장"}
              </button>
            </div>
          </div>

          {/* Row 2: Inspection slots + Moving slots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SlotTable
              title="사검 슬롯 설정"
              slots={inspSlots}
              onUpdate={handleInspUpdate}
              onDelete={handleInspDelete}
              onAdd={handleInspAdd}
              onToggleClose={handleInspToggleClose}
              onCloseAll={handleInspCloseAll}
              onOpenAll={handleInspOpenAll}
            />
            <SlotTable
              title="이사 슬롯 설정"
              slots={movingSlots}
              onUpdate={handleMovingUpdate}
              onDelete={handleMovingDelete}
              onAdd={handleMovingAdd}
              onToggleClose={handleMovingToggleClose}
              onCloseAll={handleMovingCloseAll}
              onOpenAll={handleMovingOpenAll}
            />
          </div>

          {/* Row 3: Notification settings */}
          <div className="bg-card rounded-lg border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">알림 설정</h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_60px_60px_60px_80px] gap-2 items-center text-xs font-medium text-muted-foreground pb-1 border-b border-border">
                <span>알림 항목</span>
                <span className="text-center">활성화</span>
                <span className="text-center">SMS</span>
                <span className="text-center">앱 푸시</span>
                <span className="text-center">테스트</span>
              </div>
              {notifSettings.map(n => (
                <div key={n.key} className="grid grid-cols-[1fr_60px_60px_60px_80px] gap-2 items-center">
                  <span className="text-sm">{n.label}</span>
                  <div className="flex justify-center">
                    <Switch checked={n.enabled} onCheckedChange={v => updateNotif(n.key, "enabled", v)} />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox checked={n.sms} onCheckedChange={v => updateNotif(n.key, "sms", !!v)} disabled={!n.enabled} />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox checked={n.push} onCheckedChange={v => updateNotif(n.key, "push", !!v)} disabled={!n.enabled} />
                  </div>
                  <div className="flex justify-center">
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2" disabled={!n.enabled}
                      onClick={() => toast.success("테스트 알림이 발송되었습니다.")}>
                      <Send className="w-3 h-3 mr-1" /> 테스트
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={saveNotifications}>
              <Save className="w-4 h-4" /> 알림 설정 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteSettings;
