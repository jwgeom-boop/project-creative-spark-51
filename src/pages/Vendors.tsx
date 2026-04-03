import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Vendor {
  id: number;
  name: string;
  category: string;
  description: string;
  tags: string;
  startDate: string;
  endDate: string;
  order: number;
  status: string;
}

const categories = ["은행·대출", "법무·등기", "인테리어", "이사업체", "가전·가구"];

const initialVendors: Vendor[] = [
  { id: 1, name: "KB국민은행", category: "은행·대출", description: "", tags: "", startDate: "2026-01-01", endDate: "2026-12-31", order: 1, status: "노출중" },
  { id: 2, name: "신한은행", category: "은행·대출", description: "", tags: "", startDate: "2026-01-01", endDate: "2026-12-31", order: 2, status: "노출중" },
  { id: 3, name: "하나은행", category: "은행·대출", description: "", tags: "", startDate: "2026-02-01", endDate: "2026-07-31", order: 3, status: "노출중" },
  { id: 4, name: "우리은행", category: "은행·대출", description: "", tags: "", startDate: "2026-03-01", endDate: "2026-06-30", order: 4, status: "노출중" },
  { id: 5, name: "스마트등기 법무사", category: "법무·등기", description: "", tags: "", startDate: "2026-01-01", endDate: "2026-12-31", order: 1, status: "노출중" },
  { id: 6, name: "로앤 법무그룹", category: "법무·등기", description: "", tags: "", startDate: "2026-02-01", endDate: "2026-08-31", order: 2, status: "노출중" },
  { id: 7, name: "오늘의집", category: "인테리어", description: "", tags: "", startDate: "2026-01-01", endDate: "2026-06-30", order: 1, status: "노출중" },
  { id: 8, name: "집닥 인테리어", category: "인테리어", description: "", tags: "", startDate: "2026-03-01", endDate: "2026-05-31", order: 2, status: "기간만료" },
  { id: 9, name: "한샘 리하우스", category: "인테리어", description: "", tags: "", startDate: "2026-04-01", endDate: "2026-09-30", order: 3, status: "노출중" },
  { id: 10, name: "짐무버 이사", category: "이사업체", description: "", tags: "", startDate: "2026-01-01", endDate: "2026-12-31", order: 1, status: "노출중" },
  { id: 11, name: "삼성전자", category: "가전·가구", description: "", tags: "", startDate: "2026-01-01", endDate: "2026-12-31", order: 1, status: "노출중" },
  { id: 12, name: "LG전자", category: "가전·가구", description: "", tags: "", startDate: "2026-02-01", endDate: "2026-04-30", order: 2, status: "기간만료" },
];

const formatDate = (d: string) => d.replace(/-/g, ".");

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formOrder, setFormOrder] = useState("1");
  const [formStatus, setFormStatus] = useState("노출중");

  const filtered = vendors.filter((v) => {
    if (selectedCategory !== "전체" && v.category !== selectedCategory) return false;
    if (searchQuery && !v.name.includes(searchQuery)) return false;
    return true;
  });

  const openCreate = () => {
    setEditingVendor(null);
    setFormName(""); setFormCategory(""); setFormDescription(""); setFormTags("");
    setFormStartDate(""); setFormEndDate(""); setFormOrder("1"); setFormStatus("노출중");
    setShowModal(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    setFormName(v.name); setFormCategory(v.category); setFormDescription(v.description);
    setFormTags(v.tags); setFormStartDate(v.startDate); setFormEndDate(v.endDate);
    setFormOrder(String(v.order)); setFormStatus(v.status);
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingVendor) {
      setVendors((prev) => prev.map((v) => v.id === editingVendor.id ? {
        ...v, name: formName, category: formCategory, description: formDescription,
        tags: formTags, startDate: formStartDate, endDate: formEndDate,
        order: Number(formOrder), status: formStatus,
      } : v));
    } else {
      setVendors((prev) => [...prev, {
        id: Date.now(), name: formName, category: formCategory, description: formDescription,
        tags: formTags, startDate: formStartDate, endDate: formEndDate,
        order: Number(formOrder), status: formStatus,
      }]);
    }
    toast.success("업체 정보가 저장되었습니다");
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    toast.success("업체가 삭제되었습니다");
  };

  const statusBadge = (status: string) => {
    const cls = status === "노출중"
      ? "bg-green-50 text-green-600"
      : status === "기간만료"
      ? "bg-red-50 text-red-500"
      : "bg-muted text-muted-foreground";
    return <span className={`${cls} text-xs rounded-full px-2 py-0.5`}>{status}</span>;
  };

  const chipCategories = ["전체", ...categories];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">업체 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">서비스 탭 노출 광고 업체를 등록하고 관리합니다</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold">
          + 업체 등록
        </Button>
      </div>

      {/* Filters */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {chipCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-sm rounded-full px-4 py-1.5 whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Input
          placeholder="업체명 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto w-48 rounded-xl h-9"
        />
      </div>

      {/* Table */}
      <div className="mt-4 bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">업체명</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">카테고리</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">광고 기간</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">노출 순서</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">상태</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-accent/30 transition">
                <td className="px-6 py-4 text-sm text-foreground font-medium">{v.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{v.category}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(v.startDate)} ~ {formatDate(v.endDate)}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground text-center">{v.order}</td>
                <td className="px-6 py-4 text-center">{statusBadge(v.status)}</td>
                <td className="px-6 py-4 text-center space-x-3">
                  <button onClick={() => openEdit(v)} className="text-xs text-primary underline">수정</button>
                  <button onClick={() => handleDelete(v.id)} className="text-xs text-destructive underline">삭제</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">검색 결과가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "업체 수정" : "업체 등록"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input placeholder="업체명을 입력하세요" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Select value={formCategory} onValueChange={setFormCategory}>
              <SelectTrigger><SelectValue placeholder="카테고리 선택" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="앱에 표시될 한줄 설명" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            <Input placeholder="태그1, 태그2 (쉼표로 구분)" value={formTags} onChange={(e) => setFormTags(e.target.value)} />
            <div className="flex items-center gap-2">
              <Input type="date" className="flex-1" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
              <span className="text-muted-foreground">~</span>
              <Input type="date" className="flex-1" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
            </div>
            <Input type="number" placeholder="1" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} />
            <Select value={formStatus} onValueChange={setFormStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="노출중">노출중</SelectItem>
                <SelectItem value="노출중지">노출중지</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>취소</Button>
            <Button className="flex-1" onClick={handleSave}>저장하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vendors;
