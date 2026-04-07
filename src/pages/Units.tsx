import { useState, useMemo } from "react";
import { Search, Download, Upload, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import UnitDetailDialog from "@/components/UnitDetailDialog";
import ExcelUploadDialog, { ExcelUploadConfig } from "@/components/ExcelUploadDialog";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exportToExcel } from "@/lib/exportExcel";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const getStatusBadge = (value: string) => {
  if (["입주완료", "납부완료", "발급완료", "완료"].includes(value)) return "status-complete";
  if (["입주예정", "사검완료", "예약완료"].includes(value)) return "status-pending";
  return "status-error";
};

const excelHeaders = [
  { key: "dong", label: "동" },
  { key: "ho", label: "호수" },
  { key: "area", label: "전용면적" },
  { key: "name", label: "입주자명" },
  { key: "phone", label: "연락처" },
  { key: "status", label: "입주상태" },
  { key: "payment", label: "잔금납부" },
  { key: "permit", label: "입주증발급" },
  { key: "moving", label: "이사예약" },
];

const Units = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dongFilter, setDongFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || "전체");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk status change
  const [bulkStatusTarget, setBulkStatusTarget] = useState<string | null>(null);

  const uploadConfig: ExcelUploadConfig = {
    title: "세대 엑셀 업로드",
    tableName: "units",
    columns: [
      { dbField: "dong", label: "동", required: true },
      { dbField: "ho", label: "호수", required: true },
      { dbField: "area", label: "전용면적" },
    ],
    invalidateKeys: ["units"],
    transformRow: async (row) => {
      const { data: sites } = await supabase.from("sites").select("id").limit(1).single();
      if (!sites) throw new Error("현장 정보가 없습니다.");
      return { site_id: sites.id, dong: String(row.dong), ho: String(row.ho), area: row.area || "" };
    },
  };

  const { data: rawUnits = [], isLoading } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*, residents(name, phone)")
        .order("dong")
        .order("ho");
      if (error) throw error;
      return data.map((u: any) => ({
        id: u.id,
        dong: u.dong, ho: u.ho, area: u.area,
        name: u.residents?.[0]?.name || "—",
        phone: u.residents?.[0]?.phone || "—",
        status: u.status, payment: u.payment_status,
        permit: u.permit_status, moving: u.moving_status,
      }));
    },
  });

  const dongs = [...new Set(rawUnits.map((u: any) => u.dong))];

  const filtered = useMemo(() => rawUnits.filter((u: any) => {
    if (dongFilter !== "전체" && u.dong !== dongFilter) return false;
    if (statusFilter !== "전체" && u.status !== statusFilter) return false;
    if (search && !u.name.includes(search) && !u.dong.includes(search) && !u.ho.includes(search)) return false;
    return true;
  }), [rawUnits, dongFilter, statusFilter, search]);

  // Selection helpers
  const allSelected = filtered.length > 0 && filtered.every((u: any) => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((u: any) => u.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk status mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("units").update({ status: newStatus }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success(`${selectedIds.size}세대 상태가 변경되었습니다.`);
      setSelectedIds(new Set());
      setBulkStatusTarget(null);
    },
    onError: (e: any) => {
      toast.error(`상태 변경 실패: ${e.message}`);
      setBulkStatusTarget(null);
    },
  });

  // Excel download
  const handleExcelDownload = (data: any[]) => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const isSelection = data !== filtered;
    const filename = isSelection
      ? `세대목록_선택_${data.length}건_${today}`
      : `세대목록_스마트아파트_${today}`;
    toast.success(`현재 필터 기준 ${data.length}건을 다운로드합니다.`);
    exportToExcel(data, excelHeaders, filename);
  };

  const handleRowClick = (unit: any) => {
    setSelectedUnit(unit);
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">세대 목록</h1>
        <p className="page-description">동·호수별 입주자 배정 현황 및 상태 관리</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card" value={dongFilter} onChange={(e) => setDongFilter(e.target.value)}>
          <option value="전체">동 선택: 전체</option>
          {dongs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="전체">입주상태: 전체</option>
          <option value="입주완료">입주완료</option><option value="입주예정">입주예정</option><option value="미입주">미입주</option>
        </select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card hover:bg-accent flex items-center gap-1" onClick={() => setUploadOpen(true)}>
            <Upload className="w-4 h-4" /> 엑셀 업로드
          </button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card hover:bg-accent flex items-center gap-1" onClick={() => handleExcelDownload(filtered)}>
            <Download className="w-4 h-4" /> 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 mb-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selectedIds.size}세대 선택됨</span>
          <div className="h-4 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs gap-1">
                입주상태 변경 <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setBulkStatusTarget("입주완료")}>입주완료</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkStatusTarget("입주예정")}>입주예정</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkStatusTarget("미입주")}>미입주</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => {
            const selectedData = filtered.filter((u: any) => selectedIds.has(u.id));
            handleExcelDownload(selectedData);
          }}>
            <Download className="w-3 h-3" /> 엑셀 다운로드
          </Button>
          <button className="text-xs text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1" onClick={() => setSelectedIds(new Set())}>
            <X className="w-3 h-3" /> 선택 해제
          </button>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </th>
                <th>동</th><th>호수</th><th>전용면적</th><th>입주자명</th><th>연락처</th>
                <th>입주상태</th><th>잔금납부</th><th>입주증</th><th>이사예약</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => {
                const isSelected = selectedIds.has(u.id);
                return (
                  <tr key={u.id} className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-accent/50"}`} onClick={() => handleRowClick(u)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(u.id)} />
                    </td>
                    <td>{u.dong}</td><td>{u.ho}</td><td>{u.area}</td>
                    <td className="font-medium text-primary">{u.name}</td><td>{u.phone}</td>
                    <td><span className={`status-badge ${getStatusBadge(u.status)}`}>{u.status}</span></td>
                    <td><span className={`status-badge ${getStatusBadge(u.payment)}`}>{u.payment}</span></td>
                    <td><span className={`status-badge ${getStatusBadge(u.permit)}`}>{u.permit}</span></td>
                    <td><span className={`status-badge ${getStatusBadge(u.moving)}`}>{u.moving}</span></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border">
          총 {rawUnits.length}세대 중 {filtered.length}건 표시
          {someSelected && <span className="ml-2 text-primary font-medium">· {selectedIds.size}개 선택됨</span>}
        </div>
      </div>

      {/* Bulk status change confirmation */}
      <AlertDialog open={!!bulkStatusTarget} onOpenChange={(o) => !o && setBulkStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입주상태 일괄 변경</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedIds.size}세대의 입주상태를 '{bulkStatusTarget}'(으)로 변경하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkStatusTarget && bulkStatusMutation.mutate(bulkStatusTarget)}>
              변경
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UnitDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} unit={selectedUnit} />
      <ExcelUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} config={uploadConfig} />
    </div>
  );
};

export default Units;
