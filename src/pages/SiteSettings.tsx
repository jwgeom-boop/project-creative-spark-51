import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const initialSlotData = [
  { time: "09:00~10:00", max: 30, current: 28, status: "운영중" },
  { time: "10:00~11:00", max: 30, current: 25, status: "운영중" },
  { time: "11:00~12:00", max: 30, current: 30, status: "운영중" },
  { time: "13:00~14:00", max: 30, current: 22, status: "운영중" },
  { time: "14:00~15:00", max: 30, current: 18, status: "운영중" },
  { time: "15:00~16:00", max: 20, current: 0, status: "마감" },
];

const SiteSettings = () => {
  const [slotData, setSlotData] = useState(initialSlotData);
  const [editSlot, setEditSlot] = useState<number | null>(null);
  const [editMax, setEditMax] = useState(30);

  const handleSave = () => {
    toast.success("설정이 저장되었습니다.");
  };

  const handleSlotEdit = (index: number) => {
    setEditSlot(index);
    setEditMax(slotData[index].max);
  };

  const handleSlotSave = () => {
    if (editSlot !== null) {
      setSlotData(prev => prev.map((s, i) => i === editSlot ? { ...s, max: editMax } : s));
      toast.success("슬롯이 수정되었습니다.");
      setEditSlot(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">현장 기본 설정</h1>
        <p className="page-description">단지 정보 · 사검 슬롯 설정 · 이사 슬롯 설정 · 알림 설정 · 운영 기간</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">단지 기본 정보</h2>
          <div className="space-y-3">
            {[
              { label: "단지명", value: "○○아파트 101현장" },
              { label: "시행사", value: "(주)○○건설" },
              { label: "시공사", value: "(주)○○주택" },
              { label: "총 세대수", value: "300세대" },
              { label: "동 수", value: "4개동 (101~104동)" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">{item.label}</label>
                <input type="text" defaultValue={item.value} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
              </div>
            ))}
          </div>
          <button className="mt-4 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={handleSave}><Save className="w-4 h-4" /> 저 장</button>
        </div>

        {/* Slot Settings */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">사검 슬롯 설정</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>시간대</th><th>최대세대</th><th>현재예약</th><th>운영여부</th><th>수정</th></tr></thead>
            <tbody>
              {slotData.map((s, i) => (
                <tr key={i}>
                  <td>{s.time}</td>
                  <td>{s.max}세대</td>
                  <td>{s.current}세대</td>
                  <td><span className={`status-badge ${s.status === "운영중" ? "status-complete" : "status-error"}`}>{s.status}</span></td>
                  <td><button className="text-primary text-sm hover:underline" onClick={() => handleSlotEdit(i)}>수정</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">알림 설정</h2>
          <div className="space-y-2">
            {["잔금 D-7·D-3·D-day", "연체 즉시 알림", "이사 미예약 D-14·D-7", "하자 접수 즉시"].map(item => (
              <label key={item} className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked className="rounded" /> {item}
              </label>
            ))}
          </div>
          <button className="mt-4 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={handleSave}><Save className="w-4 h-4" /> 저 장</button>
        </div>

        {/* Operating Period */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">운영 기간</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">운영시간</label>
              <div className="flex items-center gap-2">
                <input type="time" defaultValue="09:00" className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
                <span>~</span>
                <input type="time" defaultValue="17:00" className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">사전점검</label>
              <div className="flex items-center gap-2">
                <input type="date" defaultValue="2026-04-01" className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
                <span>~</span>
                <input type="date" defaultValue="2026-04-30" className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-24 shrink-0 text-muted-foreground">이사기간</label>
              <input type="month" defaultValue="2026-05" className="px-2 py-1.5 border border-border rounded-md text-sm bg-background" />
            </div>
          </div>
          <button className="mt-4 px-6 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={handleSave}><Save className="w-4 h-4" /> 저 장</button>
        </div>
      </div>

      {/* Slot Edit Dialog */}
      <Dialog open={editSlot !== null} onOpenChange={() => setEditSlot(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>슬롯 수정</DialogTitle></DialogHeader>
          {editSlot !== null && (
            <div className="space-y-3 mt-2">
              <div className="text-sm text-muted-foreground">시간대: {slotData[editSlot].time}</div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-24 shrink-0">최대 세대수</label>
                <input type="number" value={editMax} onChange={(e) => setEditMax(Number(e.target.value))} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setEditSlot(null)}>취소</button>
                <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={handleSlotSave}>저장</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteSettings;
