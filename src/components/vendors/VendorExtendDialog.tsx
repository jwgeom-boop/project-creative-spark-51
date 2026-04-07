import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  vendorName: string;
  currentEndDate: string;
  onSave: (newEndDate: string) => void;
  onClose: () => void;
}

const VendorExtendDialog = ({ open, vendorName, currentEndDate, onSave, onClose }: Props) => {
  const [newEnd, setNewEnd] = useState(currentEndDate);
  const valid = newEnd > currentEndDate;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>광고 기간 연장</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">'{vendorName}'의 광고 종료일을 연장합니다.</p>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">현재 종료일: {currentEndDate}</label>
          <Input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
          {newEnd && !valid && <p className="text-xs text-destructive">현재 종료일 이후 날짜를 선택해주세요.</p>}
        </div>
        <DialogFooter className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
          <Button className="flex-1" disabled={!valid} onClick={() => onSave(newEnd)}>연장 저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorExtendDialog;
