import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Vendor {
  id: number;
  name: string;
  category: string;
  description: string;
  tags: string;
  contact: string;
  startDate: string;
  endDate: string;
  order: number;
  status: string;
}

export const categories = ["은행·대출", "법무·등기", "인테리어", "이사업체", "가전·가구"];

interface Props {
  open: boolean;
  vendor: Vendor | null;
  onSave: (data: Omit<Vendor, "id" | "order" | "status"> & { order?: number; status?: string }) => void;
  onClose: () => void;
}

const VendorFormDialog = ({ open, vendor, onSave, onClose }: Props) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [contact, setContact] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [order, setOrder] = useState("1");
  const [formStatus, setFormStatus] = useState("노출중");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setTouched(false);
      if (vendor) {
        setName(vendor.name); setCategory(vendor.category); setDescription(vendor.description);
        setTags(vendor.tags); setContact(vendor.contact); setStartDate(vendor.startDate);
        setEndDate(vendor.endDate); setOrder(String(vendor.order)); setFormStatus(vendor.status);
      } else {
        setName(""); setCategory(""); setDescription(""); setTags(""); setContact("");
        setStartDate(""); setEndDate(""); setOrder("1"); setFormStatus("노출중");
      }
    }
  }, [open, vendor]);

  const contactValid = /^[0-9-]*$/.test(contact) && contact.length >= 8;
  const dateValid = !startDate || !endDate || endDate >= startDate;

  const errors = useMemo(() => {
    if (!touched) return {};
    const e: Record<string, string> = {};
    if (!name) e.name = "업체명을 입력해주세요.";
    if (!category) e.category = "카테고리를 선택해주세요.";
    if (!startDate) e.startDate = "시작일을 선택해주세요.";
    if (!endDate) e.endDate = "종료일을 선택해주세요.";
    if (!contact) e.contact = "연락처를 입력해주세요.";
    else if (!contactValid) e.contact = "올바른 연락처를 입력해주세요.";
    if (startDate && endDate && !dateValid) e.endDate = "종료일은 시작일 이후여야 합니다.";
    return e;
  }, [touched, name, category, startDate, endDate, contact, contactValid, dateValid]);

  const canSave = name && category && startDate && endDate && contact && contactValid && dateValid;

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    onSave({ name, category, description, tags, contact, startDate, endDate, order: Number(order), status: formStatus });
  };

  const fieldError = (key: string) => errors[key] ? <p className="text-xs text-destructive mt-1">{errors[key]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{vendor ? "업체 수정" : "업체 등록"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Input placeholder="업체명을 입력하세요 *" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} />
            {fieldError("name")}
          </div>
          <div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="카테고리 선택 *" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            {fieldError("category")}
          </div>
          <Input placeholder="앱에 표시될 한줄 설명" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="태그1, 태그2 (쉼표로 구분)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <div>
            <Input placeholder="연락처 (숫자만 입력) *" value={contact} onChange={(e) => setContact(e.target.value.replace(/[^0-9-]/g, ""))} onBlur={() => setTouched(true)} />
            {fieldError("contact")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Input type="date" className="flex-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} onBlur={() => setTouched(true)} />
              <span className="text-muted-foreground">~</span>
              <Input type="date" className="flex-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} onBlur={() => setTouched(true)} />
            </div>
            {fieldError("startDate")}
            {fieldError("endDate")}
          </div>
          <Input type="number" placeholder="노출 순서" value={order} onChange={(e) => setOrder(e.target.value)} />
          <Select value={formStatus} onValueChange={setFormStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="노출중">노출중</SelectItem>
              <SelectItem value="노출중지">노출중지</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>취소</Button>
          <Button className="flex-1" disabled={touched && !canSave} onClick={handleSave}>저장하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorFormDialog;
