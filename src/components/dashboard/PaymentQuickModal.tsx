import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const unpaidRows = [
  { unit: "101동 302호", amount: "150,000,000원", days: "45일" },
  { unit: "102동 501호", amount: "150,000,000원", days: "38일" },
  { unit: "103동 204호", amount: "18,700,000원", days: "22일" },
  { unit: "104동 403호", amount: "150,000,000원", days: "31일" },
  { unit: "105동 102호", amount: "15,000,000원", days: "12일" },
  { unit: "106동 301호", amount: "150,000,000원", days: "41일" },
];

const PaymentQuickModal = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md rounded-2xl">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">잔금 미납 세대</span>
          <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">28세대</span>
        </div>
      </DialogHeader>
      <div className="flex gap-2 mb-3">
        <span className="bg-red-50 text-red-600 text-xs rounded-full px-3 py-1">30일 이상 미납 12세대</span>
        <span className="bg-orange-50 text-orange-500 text-xs rounded-full px-3 py-1">15일 이상 8세대</span>
        <span className="bg-yellow-50 text-yellow-600 text-xs rounded-full px-3 py-1">15일 미만 8세대</span>
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
        {unpaidRows.map((r) => (
          <div key={r.unit} className="flex items-center gap-2 py-2.5">
            <span className="text-sm font-semibold flex-1">{r.unit}</span>
            <span className="text-sm font-bold text-red-600">{r.amount}</span>
            <span className="text-xs text-muted-foreground">{r.days}</span>
            <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-auto rounded-lg" onClick={() => toast.success("미납 안내 문자가 발송되었습니다")}>문자발송</Button>
          </div>
        ))}
      </div>
      <Button className="w-full bg-orange-500 text-white rounded-xl py-2.5 mt-3 hover:bg-orange-600" onClick={() => { toast.success("28세대에 미납 안내 문자가 발송되었습니다"); onOpenChange(false); }}>전체 문자 발송</Button>
    </DialogContent>
  </Dialog>
);

export default PaymentQuickModal;
