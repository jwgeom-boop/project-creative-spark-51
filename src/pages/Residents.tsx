import { useState, useMemo } from "react";
import { Download, QrCode, CreditCard, Upload, X } from "lucide-react";
import ExcelUploadDialog, { ExcelUploadConfig } from "@/components/ExcelUploadDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportToExcel } from "@/lib/exportExcel";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";
import TablePagination, { paginate } from "@/components/TablePagination";
import { cn } from "@/lib/utils";
import ResidentDetailDialog from "@/components/residents/ResidentDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getStatusBadge = (value: string) => {
  if (["발급완료", "납부완료", "완료", "유효"].includes(value)) return "status-complete";
  if (["예약완료"].includes(value)) return "status-pending";
  if (value === "—") return "";
  return "status-error";
};

const Residents = () => {
  const queryClient = useQueryClient();
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({ search: "", dong: "전체", status: "전체" });
  const [page, setPage] = useState(1);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [qrConfirmOpen, setQrConfirmOpen] = useState(false);
  const [permitConfirmOpen, setPermitConfirmOpen] = useState(false);

  const uploadConfig: ExcelUploadConfig = {
    title: "입주자 엑셀 업로드",
    tableName: "residents",
    columns: [
      { dbField: "name", label: "입주자명", required: true },
      { dbField: "phone", label: "연락처" },
      { dbField: "email", label: "이메일" },
      { dbField: "dong", label: "동", required: true },
      { dbField: "ho", label: "호수", required: true },
    ],
    invalidateKeys: ["residents"],
    transformRow: async (row) => {
      const { data } = await supabase
        .from("units")
        .select("id")
        .eq("dong", String(row.dong))
        .eq("ho", String(row.ho))
        .maybeSingle();
      if (!data) throw new Error(`세대 ${row.dong}동 ${row.ho}호를 찾을 수 없습니다.`);
      return { unit_id: data.id, name: row.name, phone: row.phone || "", email: row.email || "" };
    },
  };

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("*, units(dong, ho, area, status, payment_status, permit_status, moving_status)")
        .order("created_at");
      if (error) throw error;

      const unitIds = data.map((r: any) => r.unit_id).filter(Boolean);
      let vehicleMap = new Map<string, string>();
      if (unitIds.length > 0) {
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("unit_id, plate")
          .in("unit_id", unitIds);
        if (vehicles) {
          vehicles.forEach((v: any) => vehicleMap.set(v.unit_id, v.plate));
        }
      }

      // Fetch defect counts per unit
      let defectCountMap = new Map<string, number>();
      if (unitIds.length > 0) {
        const { data: defects } = await supabase
          .from("defects")
          .select("unit_id")
          .in("unit_id", unitIds);
        if (defects) {
          defects.forEach((d: any) => {
            defectCountMap.set(d.unit_id, (defectCountMap.get(d.unit_id) || 0) + 1);
          });
        }
      }

      return data.map((r: any) => ({
        id: r.id,
        unit_id: r.unit_id,
        dong: r.units?.dong || "",
        ho: r.units?.ho || "",
        unit: `${r.units?.dong} ${r.units?.ho}`,
        name: r.name,
        phone: r.phone,
        email: r.email,
        car: vehicleMap.get(r.unit_id) || "—",
        qr: r.qr_status,
        permit: r.units?.permit_status || "미발급",
        payment: r.units?.payment_status || "미납",
        inspection: r.inspection_status,
        movingDate: r.moving_date ? new Date(r.moving_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        area: r.units?.area || "—",
        defectCount: defectCountMap.get(r.unit_id) || 0,
        _unit: r.units,
      }));
    },
  });

  const dongOptions = useMemo(() => [...new Set(residents.map((r: any) => r.dong))].filter(Boolean).sort(), [residents]);

  const filtered = applyCommonFilters(residents, filters, {
    searchFields: ["name", "phone", "unit"],
    statusField: "inspection",
    dongField: "dong",
  });

  const currentPageItems = paginate(filtered, page);

  // Checkbox helpers
  const allPageChecked = currentPageItems.length > 0 && currentPageItems.every((r: any) => checkedIds.has(r.id));
  const toggleAll = () => {
    const newSet = new Set(checkedIds);
    if (allPageChecked) {
      currentPageItems.forEach((r: any) => newSet.delete(r.id));
    } else {
      currentPageItems.forEach((r: any) => newSet.add(r.id));
    }
    setCheckedIds(newSet);
  };
  const toggleOne = (id: string) => {
    const newSet = new Set(checkedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setCheckedIds(newSet);
  };

  // Bulk QR
  const selectedResidents = residents.filter((r: any) => checkedIds.has(r.id));
  const qrUnissued = selectedResidents.filter((r: any) => r.qr !== "발급완료");
  const handleBulkQR = async () => {
    const ids = qrUnissued.map((r: any) => r.id);
    const { error } = await supabase.from("residents").update({ qr_status: "발급완료" }).in("id", ids);
    if (error) { toast.error("QR 발급에 실패했습니다."); return; }
    toast.success(`QR ${ids.length}건 발급이 완료되었습니다.`);
    setCheckedIds(new Set());
    setQrConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: ["residents"] });
  };

  // Bulk permit
  const permitEligible = selectedResidents.filter((r: any) => r.payment === "납부완료" && r.permit !== "발급완료");
  const permitExcluded = selectedResidents.filter((r: any) => r.payment !== "납부완료");
  const handleBulkPermit = async () => {
    const unitIds = permitEligible.map((r: any) => r.unit_id);
    const { error } = await supabase.from("units").update({ permit_status: "발급완료" }).in("id", unitIds);
    if (error) { toast.error("입주증 발급에 실패했습니다."); return; }
    toast.success(`입주증 ${unitIds.length}건 발급이 완료되었습니다.`);
    setCheckedIds(new Set());
    setPermitConfirmOpen(false);
    queryClient.invalidateQueries({ queryKey: ["residents"] });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">입주자 목록</h1>
        <p className="page-description">QR 관리 · 입주증 발급·승인 · 차량 등록 현황</p>
      </div>

      <AdvancedFilterBar
        config={{
          searchPlaceholder: "이름 / 연락처 / 세대",
          dongOptions,
          statusOptions: [
            { label: "전체", value: "전체" },
            { label: "완료", value: "완료" },
            { label: "미예약", value: "미예약" },
          ],
          statusLabel: "사검상태",
        }}
        values={filters}
        onChange={(v) => { setFilters(v); setPage(1); }}
      />

      {/* Bulk action bar */}
      {checkedIds.size > 0 ? (
        <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">{checkedIds.size}명 선택됨</span>
          <button
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1"
            onClick={() => { if (qrUnissued.length === 0) { toast.info("이미 모두 발급 완료입니다."); return; } setQrConfirmOpen(true); }}
          >
            <QrCode className="w-3.5 h-3.5" /> QR 일괄발급
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1"
            onClick={() => { if (permitEligible.length === 0) { toast.info("승인 가능한 대상이 없습니다."); return; } setPermitConfirmOpen(true); }}
          >
            <CreditCard className="w-3.5 h-3.5" /> 입주증 일괄승인
          </button>
          <button className="px-3 py-1.5 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => setCheckedIds(new Set())}>
            <X className="w-3.5 h-3.5" /> 선택 해제
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="ml-auto flex gap-2">
            <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => setUploadOpen(true)}>
              <Upload className="w-4 h-4" /> 엑셀 업로드
            </button>
            <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => {
              exportToExcel(filtered, [
                { key: "unit", label: "세대" }, { key: "name", label: "입주자명" }, { key: "phone", label: "연락처" },
                { key: "car", label: "차량번호" }, { key: "qr", label: "QR상태" }, { key: "permit", label: "입주증" },
                { key: "payment", label: "잔금" }, { key: "inspection", label: "사검예약" }, { key: "movingDate", label: "이사일" },
              ], "입주자목록");
              toast.success("엑셀 파일이 다운로드되었습니다.");
            }}>
              <Download className="w-4 h-4" /> 엑셀 다운로드
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allPageChecked} onChange={toggleAll} /></th>
                <th>세대</th><th>입주자명</th><th>연락처</th><th>차량번호</th>
                <th>QR상태</th><th>입주증</th><th>잔금</th><th>사검예약</th><th>이사일</th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.map((r: any) => (
                <tr
                  key={r.id}
                  className={cn("cursor-pointer hover:bg-accent/50", checkedIds.has(r.id) && "bg-blue-50")}
                  onClick={() => { setSelectedUnit(r); setDialogOpen(true); }}
                >
                  <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={checkedIds.has(r.id)} onChange={() => toggleOne(r.id)} /></td>
                  <td>{r.unit}</td>
                  <td className="font-medium">{r.name}</td>
                  <td>{r.phone}</td>
                  <td>{r.car}</td>
                  <td><span className={`status-badge ${getStatusBadge(r.qr)}`}>{r.qr}</span></td>
                  <td><span className={`status-badge ${getStatusBadge(r.permit)}`}>{r.permit}</span></td>
                  <td><span className={`status-badge ${getStatusBadge(r.payment)}`}>{r.payment}</span></td>
                  <td><span className={`status-badge ${getStatusBadge(r.inspection)}`}>{r.inspection}</span></td>
                  <td>{r.movingDate}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <TablePagination currentPage={page} totalItems={filtered.length} onPageChange={(p) => setPage(p)} />

      <ResidentDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} resident={selectedUnit} />
      <ExcelUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} config={uploadConfig} />

      {/* QR bulk confirm */}
      <AlertDialog open={qrConfirmOpen} onOpenChange={setQrConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>QR 일괄발급</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {checkedIds.size}명 중 QR 미발급 {qrUnissued.length}명에게 발급하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkQR}>발급</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permit bulk confirm */}
      <AlertDialog open={permitConfirmOpen} onOpenChange={setPermitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입주증 일괄승인</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {checkedIds.size}명 중 승인 가능한 {permitEligible.length}명의 입주증을 발급하시겠습니까?
              {permitExcluded.length > 0 && (
                <span className="block mt-1 text-destructive">잔금 미납 {permitExcluded.length}명은 제외됩니다.</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkPermit}>발급</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Residents;
