import { Search, Send, ArrowRight, QrCode, Printer, Download, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

const statusFilterOptions = ["전체", "발급완료", "승인대기", "미발급"];

const getStatusBadge = (s: string) => {
  if (s.includes("완료") || s === "완납") return "status-complete";
  if (s.includes("대기")) return "status-pending";
  return "status-error";
};

const Permits = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") || "전체";
  const [statusFilter, setStatusFilter] = useState(filterParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // QR modal
  const [qrTarget, setQrTarget] = useState<any>(null);
  // Reissue
  const [reissueTarget, setReissueTarget] = useState<any>(null);
  // Notify modal
  const [notifyOpen, setNotifyOpen] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { setStatusFilter(filterParam); }, [filterParam]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["permits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permits")
        .select("*, units(dong, ho)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-for-permits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("residents").select("unit_id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments-for-permits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("unit_id, status, confirm_status");
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permits").update({ status: "발급완료", issued_at: new Date().toISOString(), qr_code: `QR-${Date.now()}` }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits"] });
      toast.success("입주증이 발급되었습니다.");
    },
  });

  const reissueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permits").update({ qr_code: `QR-${Date.now()}`, issued_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits"] });
      toast.success("입주증이 재발급되었습니다.");
      setReissueTarget(null);
    },
  });

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "전체") { searchParams.delete("filter"); } else { searchParams.set("filter", value); }
    setSearchParams(searchParams, { replace: true });
  };

  const filteredData = useMemo(() => {
    let list = permits.filter((p: any) => {
      if (statusFilter !== "전체" && p.status !== statusFilter) return false;
      return true;
    });
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((p: any) => {
        const unit = `${p.units?.dong || ""}동 ${p.units?.ho || ""}호`.toLowerCase();
        const resident = residents.find((r: any) => r.unit_id === p.unit_id);
        const name = (resident?.name || "").toLowerCase();
        return unit.includes(q) || name.includes(q);
      });
    }
    return list;
  }, [permits, statusFilter, debouncedSearch, residents]);

  const pendingCount = permits.filter((p: any) => p.status === "승인대기").length;
  const unissuedCount = permits.filter((p: any) => p.status === "미발급").length;
  const notifyTotal = pendingCount + unissuedCount;

  const summary = [
    { label: "전체 세대", value: `${permits.length}세대` },
    { label: "발급 완료", value: `${permits.filter((p: any) => p.status === "발급완료").length}세대`, color: "text-success" },
    { label: "승인 대기", value: `${pendingCount}세대`, color: "text-warning" },
    { label: "미발급", value: `${unissuedCount}세대`, color: "text-destructive" },
  ];

  // Generate QR code on canvas
  const drawQr = (code: string) => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 200;
    canvas.height = 200;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = "#000000";
    // Simple pattern based on code hash
    const hash = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((hash + i * 7 + j * 13) % 3 !== 0) {
          ctx.fillRect(25 + i * 19, 25 + j * 19, 17, 17);
        }
      }
    }
    // Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.strokeRect(15, 15, 170, 170);
  };

  useEffect(() => {
    if (qrTarget?.qr_code) {
      setTimeout(() => drawQr(qrTarget.qr_code), 100);
    }
  }, [qrTarget]);

  const handleQrDownload = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `입주증_${qrTarget?.units?.dong}동_${qrTarget?.units?.ho}호.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleQrPrint = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const resident = residents.find((r: any) => r.unit_id === qrTarget?.unit_id);
    win.document.write(`<html><head><title>입주증 인쇄</title></head><body style="text-align:center;padding:40px;font-family:sans-serif">
      <h2>입주증</h2>
      <img src="${canvas.toDataURL("image/png")}" width="200" height="200"/>
      <p>${qrTarget?.units?.dong}동 ${qrTarget?.units?.ho}호 · ${resident?.name || ""}</p>
      <p>발급일: ${qrTarget?.issued_at ? new Date(qrTarget.issued_at).toLocaleDateString("ko-KR") : ""}</p>
      <script>setTimeout(()=>{ window.print(); window.close(); }, 300)</script>
    </body></html>`);
  };

  const getQrResident = () => residents.find((r: any) => r.unit_id === qrTarget?.unit_id);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">입주증 발급 현황</h1>
        <p className="page-description">납부확인 → 승인 → 자동 발급 프로세스 · 미발급 세대 일괄 처리</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3">입주증 발급 프로세스</h2>
        <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
          {["잔금 납부", "담당자 납부 확인", "앱 승인 처리", "입주증 QR 자동 생성", "입주자 앱 수신"].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="px-3 py-2 bg-primary/10 text-primary rounded-md text-center"><div className="font-medium">{s}</div></div>
              {i < 4 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card" value={statusFilter} onChange={(e) => handleFilterChange(e.target.value)}>
          {statusFilterOptions.map(o => <option key={o} value={o}>발급상태: {o}</option>)}
        </select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 검색" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md flex items-center gap-1" onClick={() => setNotifyOpen(true)}>
            <Send className="w-4 h-4" /> 미발급 알림 발송
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>세대</th><th>입주자</th><th>잔금납부</th><th>납부확인</th><th>발급상태</th><th>발급일</th><th>QR</th><th>관리</th></tr></thead>
            <tbody>
              {filteredData.map((p: any) => {
                const resident = residents.find((r: any) => r.unit_id === p.unit_id);
                const payment = payments.find((pm: any) => pm.unit_id === p.unit_id);
                return (
                  <tr key={p.id}>
                    <td>{p.units?.dong}동 {p.units?.ho}호</td>
                    <td className="font-medium">{resident?.name || "—"}</td>
                    <td><span className={`status-badge ${getStatusBadge(payment?.status || "미납")}`}>{payment?.status || "미납"}</span></td>
                    <td>{payment?.confirm_status || "—"}</td>
                    <td><span className={`status-badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                    <td>{p.issued_at ? new Date(p.issued_at).toLocaleDateString("ko-KR") : "—"}</td>
                    <td>
                      {p.qr_code ? (
                        <button className="text-primary text-sm hover:underline flex items-center gap-1" onClick={() => setQrTarget(p)}>
                          <QrCode className="w-3.5 h-3.5" /> QR보기
                        </button>
                      ) : "—"}
                    </td>
                    <td>
                      {p.status === "승인대기" ? (
                        <button className="text-primary text-sm hover:underline" onClick={() => approveMutation.mutate(p.id)}>승인</button>
                      ) : p.status === "발급완료" ? (
                        <button className="text-primary text-sm hover:underline flex items-center gap-1" onClick={() => setReissueTarget(p)}>
                          <RefreshCw className="w-3 h-3" /> 재발급
                        </button>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* QR View Modal */}
      <Dialog open={!!qrTarget} onOpenChange={(o) => !o && setQrTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>입주증 QR 코드</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <canvas ref={qrCanvasRef} className="border border-border rounded-lg" style={{ width: 200, height: 200 }} />
            <div className="text-center text-sm space-y-1">
              <p className="font-semibold">{qrTarget?.units?.dong}동 {qrTarget?.units?.ho}호</p>
              <p className="text-muted-foreground">{getQrResident()?.name || "—"}</p>
              <p className="text-xs text-muted-foreground">발급일: {qrTarget?.issued_at ? new Date(qrTarget.issued_at).toLocaleDateString("ko-KR") : "—"}</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1" onClick={handleQrDownload}><Download className="w-4 h-4" /> 다운로드</Button>
            <Button className="flex-1 gap-1" onClick={handleQrPrint}><Printer className="w-4 h-4" /> 인쇄</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reissue Confirmation */}
      <AlertDialog open={!!reissueTarget} onOpenChange={(o) => !o && setReissueTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입주증을 재발급하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>기존 QR코드는 즉시 만료됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => reissueMutation.mutate(reissueTarget?.id)}>재발급</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notify Modal */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>미발급 알림 발송</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">승인대기</span><span className="font-medium">{pendingCount}세대</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">미발급</span><span className="font-medium">{unissuedCount}세대</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold"><span>총 발송 대상</span><span>{notifyTotal}세대</span></div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">발송 메시지 미리보기</p>
              <p className="text-foreground">[입주ON] 입주증이 아직 발급되지 않았습니다. 앱에서 잔금 납부 현황을 확인하고 입주증을 신청해 주세요.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyOpen(false)}>취소</Button>
            <Button onClick={() => { toast.success(`알림 ${notifyTotal}건이 발송되었습니다.`); setNotifyOpen(false); }}>발송</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Permits;
