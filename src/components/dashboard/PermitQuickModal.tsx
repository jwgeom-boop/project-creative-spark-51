import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const initialUnits = [
  { dong: "101동", ho: "205호", name: "김민준" },
  { dong: "101동", ho: "401호", name: "이서연" },
  { dong: "102동", ho: "103호", name: "박지호" },
  { dong: "102동", ho: "302호", name: "최수아" },
  { dong: "103동", ho: "501호", name: "정우진" },
  { dong: "103동", ho: "204호", name: "한예린" },
  { dong: "104동", ho: "607호", name: "오태양" },
  { dong: "105동", ho: "308호", name: "임나은" },
];

const PermitQuickModal = ({ open, onOpenChange }: Props) => {
  const [units, setUnits] = useState(initialUnits);

  const handleIssue = (idx: number) => {
    const u = units[idx];
    toast.success(`${u.dong} ${u.ho} 입주증이 발급되었습니다`);
    setUnits(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAll = () => {
    toast.success(`${units.length}세대 입주증이 일괄 발급되었습니다`);
    setUnits([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setUnits(initialUnits); onOpenChange(v); }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">입주증 미발급 세대</span>
            <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">{units.length}세대</span>
          </div>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto">
          {units.map((u, i) => (
            <div key={`${u.dong}-${u.ho}`} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <span className="text-sm font-semibold">{u.dong} {u.ho}</span>
                <span className="text-xs text-muted-foreground ml-2">{u.name}</span>
              </div>
              <Button size="sm" className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg h-auto" onClick={() => handleIssue(i)}>발급</Button>
            </div>
          ))}
          {units.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">모든 세대에 발급 완료</p>}
        </div>
        {units.length > 0 && (
          <Button className="w-full bg-green-600 text-white rounded-xl py-2.5 mt-3 hover:bg-green-700" onClick={handleAll}>전체 발급</Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PermitQuickModal;
