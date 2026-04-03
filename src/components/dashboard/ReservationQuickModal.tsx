import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const inspectionRows = [
  { time: "09:00", unit: "101-302", name: "김민준", status: "완료", color: "bg-green-100 text-green-700" },
  { time: "10:00", unit: "102-501", name: "이서연", status: "진행중", color: "bg-blue-100 text-blue-700" },
  { time: "11:00", unit: "103-204", name: "박지호", status: "대기", color: "bg-gray-100 text-gray-600" },
  { time: "13:00", unit: "104-403", name: "최수아", status: "대기", color: "bg-gray-100 text-gray-600" },
  { time: "14:00", unit: "105-308", name: "정우진", status: "미확정", color: "bg-yellow-100 text-yellow-700" },
];

const movingRows = [
  { time: "09:00", unit: "101-205", name: "한예린", status: "완료", color: "bg-green-100 text-green-700" },
  { time: "10:30", unit: "102-103", name: "오태양", status: "진행중", color: "bg-blue-100 text-blue-700" },
  { time: "13:00", unit: "103-501", name: "임나은", status: "대기", color: "bg-gray-100 text-gray-600" },
  { time: "15:00", unit: "104-607", name: "강도현", status: "대기", color: "bg-gray-100 text-gray-600" },
];

const ReservationQuickModal = ({ open, onOpenChange }: Props) => {
  const [tab, setTab] = useState<"inspection" | "moving">("inspection");
  const navigate = useNavigate();
  const rows = tab === "inspection" ? inspectionRows : movingRows;
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">오늘의 예약 현황</span>
            <span className="text-sm text-muted-foreground">{today}</span>
          </div>
        </DialogHeader>
        <div className="flex border-b mb-3">
          {(["inspection", "moving"] as const).map((t) => (
            <button
              key={t}
              className={`flex-1 py-2 text-sm ${tab === t ? "border-b-2 border-blue-600 text-blue-600 font-semibold" : "text-muted-foreground"}`}
              onClick={() => setTab(t)}
            >
              {t === "inspection" ? "사전점검" : "이사입주"}
            </button>
          ))}
        </div>
        <div className="divide-y">
          {rows.map((r) => (
            <div key={r.unit} className="flex gap-3 py-3 px-1 text-sm items-center">
              <span className="w-12 text-muted-foreground">{r.time}</span>
              <span className="font-semibold flex-1">{r.unit}</span>
              <span className="text-muted-foreground">{r.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.color}`}>{r.status}</span>
            </div>
          ))}
        </div>
        <button className="text-blue-500 text-sm text-center mt-3 w-full" onClick={() => { onOpenChange(false); navigate("/inspection"); }}>
          전체 예약 관리 →
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationQuickModal;
