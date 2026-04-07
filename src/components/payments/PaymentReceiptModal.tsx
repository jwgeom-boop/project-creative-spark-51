import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentItem {
  unit: string;
  name: string;
  totalRaw: number;
}

const paymentDateMap: Record<string, string> = {
  "분양 잔금": "2026.02.14",
  "중도금 1차": "2025.06.30",
  "중도금 2차": "2025.12.31",
  "발코니 확장비": "2024.11.20",
  "옵션비 (시스템에어컨)": "2024.11.20",
  "관리비 예치금": "2026.01.10",
};

const receiptNumberMap: Record<string, string> = {
  "분양 잔금": "RCP-2026-0214",
  "중도금 1차": "RCP-2025-0630",
  "중도금 2차": "RCP-2025-1231",
  "발코니 확장비": "RCP-2024-1120",
  "옵션비 (시스템에어컨)": "RCP-2024-1121",
  "관리비 예치금": "RCP-2026-0110",
};

interface Props {
  payment: PaymentItem | null;
  onClose: () => void;
}

const PaymentReceiptModal = ({ payment, onClose }: Props) => {
  const receiptLabel = "분양 잔금";
  const receiptDate = paymentDateMap[receiptLabel] || "2026.02.14";
  const receiptNumber = receiptNumberMap[receiptLabel] || "RCP-2026-0001";

  return (
    <Dialog open={!!payment} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[340px] rounded-2xl p-5">
        {payment && (
          <>
            <div className="bg-muted rounded-xl p-4 mb-4 text-center">
              <div className="text-base font-black text-foreground">납부 확인서</div>
              <div className="text-[10px] text-muted-foreground tracking-widest mt-0.5">PAYMENT RECEIPT</div>
              <div className="border-t border-dashed border-border mt-3 mb-3" />
              <div className="w-14 h-14 border-2 border-green-500 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: "납부 항목", value: receiptLabel },
                { label: "납부 금액", value: `${payment.totalRaw.toLocaleString()}원` },
                { label: "납부 일자", value: receiptDate },
                { label: "수납 기관", value: "힐스테이트 입주지원센터" },
                { label: "납부자", value: `${payment.name} (${payment.unit})` },
                { label: "확인번호", value: receiptNumber },
              ].map((row, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-sm font-semibold text-foreground">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-border my-3" />
            <p className="text-[10px] text-muted-foreground text-center">
              본 확인서는 전자 납부 기록을 기반으로 발급됩니다.
            </p>

            <DialogFooter className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>닫기</Button>
              <Button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white" onClick={() => { toast.success("영수증이 저장되었습니다"); onClose(); }}>
                저장하기
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReceiptModal;
