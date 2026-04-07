import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown, GripVertical, AlertTriangle, Calendar } from "lucide-react";
import VendorFormDialog, { Vendor, categories } from "@/components/vendors/VendorFormDialog";
import VendorDeleteDialog from "@/components/vendors/VendorDeleteDialog";
import VendorExtendDialog from "@/components/vendors/VendorExtendDialog";

const initialVendors: Vendor[] = [
  { id: 1, name: "KB국민은행", category: "은행·대출", description: "", tags: "", contact: "1588-9999", startDate: "2026-01-01", endDate: "2026-12-31", order: 1, status: "노출중" },
  { id: 2, name: "신한은행", category: "은행·대출", description: "", tags: "", contact: "1599-8888", startDate: "2026-01-01", endDate: "2026-12-31", order: 2, status: "노출중" },
  { id: 3, name: "하나은행", category: "은행·대출", description: "", tags: "", contact: "1599-1111", startDate: "2026-02-01", endDate: "2026-07-31", order: 3, status: "노출중" },
  { id: 4, name: "우리은행", category: "은행·대출", description: "", tags: "", contact: "1588-5000", startDate: "2026-03-01", endDate: "2026-06-30", order: 4, status: "노출중" },
  { id: 5, name: "스마트등기 법무사", category: "법무·등기", description: "", tags: "", contact: "02-1234-5678", startDate: "2026-01-01", endDate: "2026-12-31", order: 1, status: "노출중" },
  { id: 6, name: "로앤 법무그룹", category: "법무·등기", description: "", tags: "", contact: "02-9876-5432", startDate: "2026-02-01", endDate: "2026-08-31", order: 2, status: "노출중" },
  { id: 7, name: "오늘의집", category: "인테리어", description: "", tags: "", contact: "1670-0876", startDate: "2026-01-01", endDate: "2026-06-30", order: 1, status: "노출중" },
  { id: 8, name: "집닥 인테리어", category: "인테리어", description: "", tags: "", contact: "1522-1331", startDate: "2026-03-01", endDate: "2026-03-31", order: 2, status: "노출중" },
  { id: 9, name: "한샘 리하우스", category: "인테리어", description: "", tags: "", contact: "1588-7000", startDate: "2026-04-01", endDate: "2026-09-30", order: 3, status: "노출중" },
  { id: 10, name: "짐무버 이사", category: "이사업체", description: "", tags: "", contact: "1588-2222", startDate: "2026-01-01", endDate: "2026-12-31", order: 1, status: "노출중" },
  { id: 11, name: "삼성전자", category: "가전·가구", description: "", tags: "", contact: "1588-3366", startDate: "2026-01-01", endDate: "2026-12-31", order: 1, status: "노출중" },
  { id: 12, name: "LG전자", category: "가전·가구", description: "", tags: "", contact: "1544-7777", startDate: "2026-02-01", endDate: "2026-04-01", order: 2, status: "노출중" },
];

const formatDate = (d: string) => d.replace(/-/g, ".");

type SortKey = "name" | "category" | "period" | "order";
type SortDir = "asc" | "desc" | null;

const today = new Date().toISOString().slice(0, 10);

function getDaysLeft(endDate: string) {
  const diff = Math.ceil((new Date(endDate).getTime() - new Date(today).getTime()) / 86400000);
  return diff;
}

function computeStatus(v: Vendor) {
  const days = getDaysLeft(v.endDate);
  if (days < 0) return "기간만료";
  if (v.status === "노출중지") return "노출중지";
  return "노출중";
}

function statusBadge(v: Vendor) {
  const days = getDaysLeft(v.endDate);
  const st = computeStatus(v);
  if (st === "기간만료") return <span className="bg-destructive/10 text-destructive text-xs rounded-full px-2 py-0.5">기간만료</span>;
  if (st === "노출중지") return <span className="bg-muted text-muted-foreground text-xs rounded-full px-2 py-0.5">노출중지</span>;
  if (days === 0) return <span className="bg-orange-50 text-orange-600 text-xs rounded-full px-2 py-0.5">오늘 만료</span>;
  if (days <= 7) return <span className="bg-yellow-50 text-yellow-600 text-xs rounded-full px-2 py-0.5">D-{days}</span>;
  return <span className="bg-green-50 text-green-600 text-xs rounded-full px-2 py-0.5">운영중</span>;
}

const Vendors = () => {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);

  // Extend
  const [extendTarget, setExtendTarget] = useState<Vendor | null>(null);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Drag
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Expiry banner filter
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);

  const expiringSoonCount = useMemo(() => vendors.filter((v) => { const d = getDaysLeft(v.endDate); return d >= 0 && d <= 7; }).length, [vendors]);
  const expiredCount = useMemo(() => vendors.filter((v) => getDaysLeft(v.endDate) < 0).length, [vendors]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    let active = 0;
    vendors.forEach((v) => {
      if (getDaysLeft(v.endDate) < 0) return;
      m[v.category] = (m[v.category] || 0) + 1;
      active++;
    });
    return { ...m, "전체": active, "만료": expiredCount };
  }, [vendors, expiredCount]);

  const filtered = useMemo(() => {
    let list = vendors.map((v) => ({ ...v, _status: computeStatus(v) }));
    if (showExpiringOnly) {
      list = list.filter((v) => { const d = getDaysLeft(v.endDate); return d >= 0 && d <= 7; });
    } else if (selectedCategory === "만료") {
      list = list.filter((v) => getDaysLeft(v.endDate) < 0);
    } else if (selectedCategory !== "전체") {
      list = list.filter((v) => v.category === selectedCategory);
    }
    if (searchQuery) list = list.filter((v) => v.name.includes(searchQuery));

    if (sortKey && sortDir) {
      list.sort((a, b) => {
        let cmp = 0;
        if (sortKey === "name") cmp = a.name.localeCompare(b.name);
        else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
        else if (sortKey === "period") cmp = a.startDate.localeCompare(b.startDate);
        else if (sortKey === "order") cmp = a.order - b.order;
        return sortDir === "desc" ? -cmp : cmp;
      });
    }
    return list;
  }, [vendors, selectedCategory, searchQuery, sortKey, sortDir, showExpiringOnly]);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortKey(null); setSortDir(null); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? <ArrowUp className="inline w-3 h-3 ml-1" /> : <ArrowDown className="inline w-3 h-3 ml-1" />;
  };

  const canDrag = selectedCategory === "전체" && !searchQuery && !showExpiringOnly && !sortKey;

  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx.current === null || dragIdx.current === idx) { setDragOverIdx(null); return; }
    const newList = [...vendors];
    const [moved] = newList.splice(dragIdx.current, 1);
    newList.splice(idx, 0, moved);
    setVendors(newList.map((v, i) => ({ ...v, order: i + 1 })));
    dragIdx.current = null;
    setDragOverIdx(null);
    toast.success("노출 순서가 변경되었습니다.");
  };

  // Inline order edit
  const [editOrderId, setEditOrderId] = useState<number | null>(null);
  const [editOrderVal, setEditOrderVal] = useState("");

  const handleOrderSave = (id: number) => {
    const num = Number(editOrderVal);
    if (num > 0) {
      setVendors((prev) => prev.map((v) => v.id === id ? { ...v, order: num } : v));
      toast.success("노출 순서가 변경되었습니다.");
    }
    setEditOrderId(null);
  };

  const handleSave = (data: any) => {
    if (editingVendor) {
      setVendors((prev) => prev.map((v) => v.id === editingVendor.id ? { ...v, ...data } : v));
      toast.success("업체 정보가 수정되었습니다.");
    } else {
      setVendors((prev) => [...prev, { id: Date.now(), order: prev.length + 1, status: "노출중", ...data }]);
      toast.success("업체가 등록되었습니다.");
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setVendors((prev) => prev.filter((v) => v.id !== deleteTarget.id));
    toast.success("업체가 삭제되었습니다.");
    setDeleteTarget(null);
  };

  const handleExtend = (newEnd: string) => {
    if (!extendTarget) return;
    setVendors((prev) => prev.map((v) => v.id === extendTarget.id ? { ...v, endDate: newEnd, status: "노출중" } : v));
    toast.success("광고 기간이 연장되었습니다.");
    setExtendTarget(null);
  };

  const chipCategories = ["전체", ...categories, "만료"];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">업체 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">서비스 탭 노출 광고 업체를 등록하고 관리합니다</p>
        </div>
        <Button onClick={() => { setEditingVendor(null); setShowModal(true); }} className="rounded-xl text-sm font-semibold">
          + 업체 등록
        </Button>
      </div>

      {/* Expiry banner */}
      {expiringSoonCount > 0 && !showExpiringOnly && (
        <div className="mt-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <span className="text-sm text-yellow-800">광고 기간이 7일 이내에 만료되는 업체가 {expiringSoonCount}개 있습니다.</span>
          <Button size="sm" variant="outline" className="ml-auto text-xs" onClick={() => { setShowExpiringOnly(true); setSelectedCategory("전체"); }}>
            해당 업체 보기
          </Button>
        </div>
      )}
      {showExpiringOnly && (
        <div className="mt-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <span className="text-sm text-yellow-800">만료 임박 업체만 표시 중입니다.</span>
          <Button size="sm" variant="outline" className="ml-auto text-xs" onClick={() => setShowExpiringOnly(false)}>전체 보기</Button>
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {chipCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setShowExpiringOnly(false); }}
              className={`text-sm rounded-full px-4 py-1.5 whitespace-nowrap transition ${
                !showExpiringOnly && selectedCategory === cat
                  ? cat === "만료" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat}({categoryCounts[cat] || 0})
            </button>
          ))}
        </div>
        <Input placeholder="업체명 검색" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="ml-auto w-48 rounded-xl h-9" />
      </div>

      {!canDrag && selectedCategory === "전체" && !showExpiringOnly && (sortKey || searchQuery) && (
        <p className="text-xs text-muted-foreground mt-2">※ 정렬/검색 중에는 드래그 순서 변경이 비활성화됩니다.</p>
      )}
      {selectedCategory !== "전체" && selectedCategory !== "만료" && !showExpiringOnly && (
        <p className="text-xs text-muted-foreground mt-2">※ 전체 카테고리에서 순서를 변경할 수 있습니다.</p>
      )}

      {/* Table */}
      <div className="mt-4 bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {canDrag && <th className="w-8"></th>}
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("name")}>
                업체명{sortIcon("name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("category")}>
                카테고리{sortIcon("category")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("period")}>
                광고 기간{sortIcon("period")}
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("order")}>
                노출 순서{sortIcon("order")}
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">상태</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((v, idx) => {
              const expired = getDaysLeft(v.endDate) < 0;
              const inactive = expired || v.status === "노출중지";
              return (
                <tr
                  key={v.id}
                  className={`transition ${expired ? "bg-muted/30" : "hover:bg-accent/30"} ${dragOverIdx === idx ? "border-t-2 border-primary" : ""}`}
                  draggable={canDrag && !inactive}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => setDragOverIdx(null)}
                >
                  {canDrag && (
                    <td className="pl-2">
                      <GripVertical className={`w-4 h-4 ${inactive ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground cursor-grab"}`} />
                    </td>
                  )}
                  <td className="px-6 py-3 text-sm text-foreground font-medium">{v.name}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{v.category}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{formatDate(v.startDate)} ~ {formatDate(v.endDate)}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground text-center">
                    {editOrderId === v.id ? (
                      <input
                        autoFocus
                        type="number"
                        className="w-14 text-center border rounded px-1 py-0.5 text-sm bg-background"
                        value={editOrderVal}
                        onChange={(e) => setEditOrderVal(e.target.value)}
                        onBlur={() => handleOrderSave(v.id)}
                        onKeyDown={(e) => e.key === "Enter" && handleOrderSave(v.id)}
                      />
                    ) : (
                      <span className="cursor-pointer" onClick={() => { setEditOrderId(v.id); setEditOrderVal(String(v.order)); }}>{v.order}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">{statusBadge(v)}</td>
                  <td className="px-6 py-3 text-center space-x-2">
                    <button onClick={() => { setEditingVendor(v); setShowModal(true); }} className="text-xs text-primary underline">수정</button>
                    {expired ? (
                      <button onClick={() => setExtendTarget(v)} className="text-xs text-primary underline flex-inline items-center gap-0.5">
                        <Calendar className="inline w-3 h-3 mr-0.5" />연장
                      </button>
                    ) : null}
                    <button onClick={() => setDeleteTarget(v)} className="text-xs text-destructive underline">삭제</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={canDrag ? 7 : 6} className="text-center py-8 text-muted-foreground">검색 결과가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <VendorFormDialog open={showModal} vendor={editingVendor} onSave={handleSave} onClose={() => setShowModal(false)} />
      <VendorDeleteDialog open={!!deleteTarget} vendorName={deleteTarget?.name || ""} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <VendorExtendDialog open={!!extendTarget} vendorName={extendTarget?.name || ""} currentEndDate={extendTarget?.endDate || ""} onSave={handleExtend} onClose={() => setExtendTarget(null)} />
    </div>
  );
};

export default Vendors;
