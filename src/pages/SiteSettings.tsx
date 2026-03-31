import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SiteSettings = () => {
  const queryClient = useQueryClient();

  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [siteStatus, setSiteStatus] = useState("");
  const [moveInStart, setMoveInStart] = useState("");
  const [moveInEnd, setMoveInEnd] = useState("");
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "잔금 D-7·D-3·D-day": true,
    "연체 즉시 알림": true,
    "이사 미예약 D-14·D-7": true,
    "하자 접수 즉시": true,
  });

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

  const { data: inspections = [] } = useQuery({
    queryKey: ["inspections-for-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inspections").select("time_slot, status");
      if (error) throw error;
      return data;
    },
  });

  const slotMap = new Map<string, { total: number; current: number }>();
  inspections.forEach((ins: any) => {
    if (!slotMap.has(ins.time_slot)) slotMap.set(ins.time_slot, { total: 30, current: 0 });
    slotMap.get(ins.time_slot)!.current++;
  });
  const slotData = Array.from(slotMap.entries()).map(([time, data]) => ({
    time, max: data.total, current: data.current, status: data.current >= data.total ? "마감" : "운영중",
  }));

  const updateSiteInfo = useMutation({
    mutationFn: async () => {
      if (!site) throw new Error("사이트 정보 없음");
      const { error } = await supabase.from("sites").update({
        name: siteName,
        address: siteAddress,
        total_units: parseInt(totalUnits) || 0,
        status: siteStatus,
      }).eq("id", site.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("단지 정보가 저장되었습니다.");
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const updatePeriod = useMutation({
    mutationFn: async () => {
      if (!site) throw new Error("사이트 정보 없음");
      const { error } = await supabase.from("sites").update({
        move_in_start: moveInStart || null,
        move_in_end: moveInEnd || null,
      }).eq("id", site.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("운영 기간이 저장되었습니다.");
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const handleNotificationSave = () => {
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

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">사검 슬롯 설정</h2></div>
            <table className="data-table">
              <thead><tr><th>시간대</th><th>최대세대</th><th>현재예약</th><th>운영여부</th></tr></thead>
              <tbody>
                {slotData.map((s, i) => (
                  <tr key={i}>
                    <td>{s.time}</td><td>{s.max}세대</td><td>{s.current}세대</td>
                    <td><span className={`status-badge ${s.status === "운영중" ? "status-complete" : "status-error"}`}>{s.status}</span></td>
                  </tr>
                ))}
                {slotData.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-muted-foreground">슬롯 데이터 없음</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold mb-4">알림 설정</h2>
            <div className="space-y-2">
              {Object.keys(notifications).map(item => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifications[item]} onChange={e => setNotifications(prev => ({ ...prev, [item]: e.target.checked }))} className="rounded" /> {item}
                </label>
              ))}
            </div>
            <button className="mt-4 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={handleNotificationSave}><Save className="w-4 h-4" /> 저 장</button>
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
            </div>
            <button className="mt-4 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => updatePeriod.mutate()} disabled={updatePeriod.isPending}>
              <Save className="w-4 h-4" /> {updatePeriod.isPending ? "저장 중..." : "저 장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteSettings;
