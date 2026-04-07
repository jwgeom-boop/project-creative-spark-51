import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface ResidentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resident: any;
}

const getStatusBadge = (value: string) => {
  if (["발급완료", "납부완료", "완료", "유효"].includes(value)) return "bg-green-100 text-green-700";
  if (["예약완료"].includes(value)) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const ResidentDetailDialog = ({ open, onOpenChange, resident }: ResidentDetailDialogProps) => {
  const navigate = useNavigate();
  if (!resident) return null;

  const info = [
    { label: "이름", value: resident.name },
    { label: "연락처", value: resident.phone || "—" },
    { label: "세대", value: resident.unit },
    { label: "면적", value: resident.area || "—" },
    { label: "차량번호", value: resident.car || "—" },
  ];

  const statuses = [
    { label: "납부 상태", value: resident.payment || "—" },
    { label: "QR 상태", value: resident.qr || "—" },
    { label: "입주증", value: resident.permit || "—" },
    { label: "사전점검", value: resident.inspection || "—" },
    { label: "이사일", value: resident.movingDate || "—" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{resident.unit} — {resident.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            {info.map((item, i) => (
              <div key={i}>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="text-sm font-semibold">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Statuses */}
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">상태 현황</div>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg p-2.5">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${getStatusBadge(s.value)}`}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Defect count */}
          <div className="flex items-center justify-between bg-muted rounded-lg p-3">
            <span className="text-sm text-muted-foreground">하자 접수 건수</span>
            <button
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => {
                onOpenChange(false);
                navigate(`/defects?filter=${encodeURIComponent(resident.dong)}`);
              }}
            >
              {resident.defectCount || 0}건 →
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResidentDetailDialog;
