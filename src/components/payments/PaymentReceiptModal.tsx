import { useRef } from "react";
import { CheckCircle2, Download, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface PaymentItem {
  unit: string;
  name: string;
  balance: string;
  totalRaw: number;
  total: string;
  option: string;
  ext: string;
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
  const receiptRef = useRef<HTMLDivElement>(null);
  const receiptLabel = "분양 잔금";
  const receiptDate = paymentDateMap[receiptLabel] || "2026.02.14";
  const receiptNumber = receiptNumberMap[receiptLabel] || "RCP-2026-0001";
  const today = new Date().toISOString().slice(0, 10);

  const handlePdfDownload = async () => {
    if (!receiptRef.current || !payment) return;
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [90, 140] });
      pdf.addImage(imgData, "PNG", 0, 0, 90, 140);
      const unitClean = payment.unit.replace(/\s/g, "");
      pdf.save(`납부영수증_${unitClean}_${today.replace(/-/g, "")}.pdf`);
      toast.success("영수증 PDF가 다운로드되었습니다.");
    } catch {
      toast.error("PDF 생성 중 오류가 발생했습니다.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Build line items for receipt
  const lineItems = payment ? [
    { label: "분양 잔금", value: payment.balance },
    ...(payment.option !== "미선택" ? [{ label: "옵션비", value: payment.option }] : []),
    ...(payment.ext !== "미선택" ? [{ label: "발코니 확장비", value: payment.ext }] : []),
  ] : [];

  return (
    <Dialog open={!!payment} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[380px] rounded-2xl p-5">
        {payment && (
          <>
            <div ref={receiptRef} className="bg-white text-gray-900 p-5 rounded-xl">
              {/* Header */}
              <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
                <div className="text-base font-black">납부 확인 영수증</div>
                <div className="text-[10px] text-gray-400 tracking-widest mt-0.5">PAYMENT RECEIPT</div>
                <div className="text-xs text-gray-500 mt-1">발행일: {today}</div>
              </div>

              {/* Payer info */}
              <div className="space-y-1 mb-3 pb-3 border-b border-dashed border-gray-300">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">입주자</span>
                  <span className="font-semibold">{payment.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">세대</span>
                  <span className="font-semibold">{payment.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">단지명</span>
                  <span className="font-semibold">스마트 아파트</span>
                </div>
              </div>

              {/* Line items */}
              <div className="space-y-1.5 mb-3 pb-3 border-b border-dashed border-gray-300">
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                  <span>납부 항목</span><span>금액</span>
                </div>
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.value}원</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-1.5 flex justify-between text-sm font-bold">
                  <span>합계</span>
                  <span>{payment.totalRaw.toLocaleString()}원</span>
                </div>
              </div>

              {/* Footer info */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">납부일</span>
                  <span className="font-medium">{receiptDate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">수납 기관</span>
                  <span className="font-medium">힐스테이트 입주지원센터</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">확인번호</span>
                  <span className="font-medium">{receiptNumber}</span>
                </div>
              </div>

              {/* Check icon */}
              <div className="flex justify-center mt-3">
                <div className="w-10 h-10 border-2 border-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 pt-3">
              <Button variant="outline" className="flex-1 gap-1" onClick={handlePrint}>
                <Printer className="w-4 h-4" /> 인쇄
              </Button>
              <Button className="flex-1 gap-1" onClick={handlePdfDownload}>
                <Download className="w-4 h-4" /> PDF 다운로드
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReceiptModal;
