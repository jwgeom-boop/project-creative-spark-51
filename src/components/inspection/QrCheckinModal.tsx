import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QrCode, Search, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface QrCheckinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface InspectionResult {
  id: string;
  status: string;
  time_slot: string;
  checkin_time: string | null;
  inspection_date: string;
  unit_dong: string;
  unit_ho: string;
  resident_name: string;
  queueNo: number;
}

const QrCheckinModal = ({ open, onOpenChange }: QrCheckinModalProps) => {
  const queryClient = useQueryClient();
  const [dong, setDong] = useState("");
  const [ho, setHo] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setDong("");
    setHo("");
    setQrCode("");
    setResult(null);
    setError("");
  };

  const handleSearch = async () => {
    setResult(null);
    setError("");
    setLoading(true);

    try {
      // Find unit by dong/ho
      let unitId: string | null = null;

      if (dong && ho) {
        const { data: unit } = await supabase
          .from("units")
          .select("id")
          .eq("dong", dong.replace("동", ""))
          .eq("ho", ho.replace("호", ""))
          .maybeSingle();
        unitId = unit?.id || null;
      }

      if (!unitId && qrCode) {
        // Try QR code as unit id or search by permit qr_code
        const { data: permit } = await supabase
          .from("permits")
          .select("unit_id")
          .eq("qr_code", qrCode)
          .maybeSingle();
        unitId = permit?.unit_id || null;

        if (!unitId) {
          // Try as direct unit id
          const { data: unit } = await supabase
            .from("units")
            .select("id")
            .eq("id", qrCode)
            .maybeSingle();
          unitId = unit?.id || null;
        }
      }

      if (!unitId) {
        setError("해당 세대를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }

      // Find inspection for this unit
      const { data: inspections } = await supabase
        .from("inspections")
        .select("*, units(dong, ho)")
        .eq("unit_id", unitId)
        .order("inspection_date", { ascending: true })
        .limit(1);

      if (!inspections || inspections.length === 0) {
        setError("예약 정보가 없습니다.");
        setLoading(false);
        return;
      }

      const ins = inspections[0] as any;

      // Get resident name
      const { data: resident } = await supabase
        .from("residents")
        .select("name")
        .eq("unit_id", unitId)
        .maybeSingle();

      // Get queue number
      const { data: allInspections } = await supabase
        .from("inspections")
        .select("id")
        .eq("time_slot", ins.time_slot)
        .eq("inspection_date", ins.inspection_date)
        .order("created_at", { ascending: true });

      const queueNo = (allInspections?.findIndex((i: any) => i.id === ins.id) ?? 0) + 1;

      setResult({
        id: ins.id,
        status: ins.status,
        time_slot: ins.time_slot,
        checkin_time: ins.checkin_time,
        inspection_date: ins.inspection_date,
        unit_dong: ins.units?.dong || "",
        unit_ho: ins.units?.ho || "",
        resident_name: resident?.name || "—",
        queueNo,
      });
    } catch {
      setError("조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (!result) return;
    const { error: err } = await supabase
      .from("inspections")
      .update({ status: "점검중", checkin_time: new Date().toISOString() })
      .eq("id", result.id);

    if (!err) {
      await queryClient.invalidateQueries({ queryKey: ["inspections"] });
      toast.success("체크인이 완료되었습니다.");
      setResult({ ...result, status: "점검중", checkin_time: new Date().toISOString() });
    } else {
      toast.error("체크인 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" /> QR 체크인
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Unit search */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">세대 직접 입력</label>
            <div className="flex gap-2">
              <Input placeholder="동 (예: 101)" value={dong} onChange={(e) => setDong(e.target.value)} className="flex-1" />
              <Input placeholder="호 (예: 1202)" value={ho} onChange={(e) => setHo(e.target.value)} className="flex-1" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">또는</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* QR code input */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">QR 코드 번호</label>
            <Input placeholder="QR 코드 번호 입력" value={qrCode} onChange={(e) => setQrCode(e.target.value)} />
          </div>

          <Button className="w-full" onClick={handleSearch} disabled={loading || (!dong && !ho && !qrCode)}>
            {loading ? <span className="animate-spin mr-2">⏳</span> : <Search className="w-4 h-4 mr-2" />}
            확인
          </Button>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">이름</span><p className="font-medium">{result.resident_name}</p></div>
                <div><span className="text-muted-foreground">세대</span><p className="font-medium">{result.unit_dong}동 {result.unit_ho}호</p></div>
                <div><span className="text-muted-foreground">예약 시간</span><p className="font-medium">{result.time_slot}</p></div>
                <div><span className="text-muted-foreground">대기번호</span><p className="font-medium">{result.queueNo}번</p></div>
              </div>

              <div className="border-t border-border pt-3">
                {result.status === "대기중" && (
                  <Button className="w-full" onClick={handleCheckin}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> 체크인 처리
                  </Button>
                )}
                {result.status === "점검중" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning text-sm">
                    <Clock className="w-4 h-4 shrink-0" />
                    이미 체크인된 세대입니다.
                    {result.checkin_time && (
                      <span className="ml-auto text-xs">
                        {new Date(result.checkin_time).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                )}
                {result.status === "완료" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    점검이 완료된 세대입니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrCheckinModal;
