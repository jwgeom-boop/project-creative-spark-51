import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentItem } from "@/pages/Payments";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  unpaidPayments: PaymentItem[];
  onSent: () => void;
}

const UnpaidNotifyModal = ({ open, onOpenChange, unpaidPayments, onSent }: Props) => {
  const [sms, setSms] = useState(true);
  const [push, setPush] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const unpaid = unpaidPayments.filter(p => p.status === "미납");
  const overdue = unpaidPayments.filter(p => p.status.includes("연체"));
  const total = unpaidPayments.length;

  const sampleName = unpaidPayments[0]?.name || "홍길동";
  const sampleAmount = unpaidPayments[0]?.total || "150,000,000";

  const handleSend = async () => {
    setIsSending(true);
    try {
      // Simulate send delay
      await new Promise(r => setTimeout(r, 1500));
      const now = new Date().toISOString();
      for (const p of unpaidPayments) {
        await supabase.from("payments").update({ notification_sent_at: now }).eq("id", p.id);
      }
      onSent();
      toast.success(`미납 알림 ${total}건 발송이 완료되었습니다.`);
      onOpenChange(false);
    } catch {
      toast.error("발송 중 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>미납 알림 발송</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Target summary */}
          <div className="bg-muted rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">미납 세대</span>
              <span className="font-semibold">{unpaid.length}세대</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">연체 세대</span>
              <span className="font-semibold text-destructive">{overdue.length}세대</span>
            </div>
            <div className="border-t border-border pt-1 flex justify-between text-sm font-bold">
              <span>총 발송 대상</span>
              <span>{total}세대</span>
            </div>
          </div>

          {/* Message preview */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">발송 메시지 미리보기</p>
            <div className="bg-muted rounded-lg p-3 text-sm leading-relaxed">
              <p className="font-medium">[입주ON] 안녕하세요 {sampleName}님,</p>
              <p>납부 예정 금액 {sampleAmount}원이 미납 상태입니다.</p>
              <p>확인 부탁드립니다.</p>
            </div>
          </div>

          {/* Channel */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">발송 채널</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={sms} onCheckedChange={(v) => setSms(!!v)} /> 문자(SMS)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={push} onCheckedChange={(v) => setPush(!!v)} /> 앱 푸시
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>취소</Button>
          <Button onClick={handleSend} disabled={isSending || (!sms && !push)} className="gap-1">
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            발송
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnpaidNotifyModal;
