import { useState, useMemo } from "react";
import { Download, QrCode, CreditCard, Upload } from "lucide-react";
import ExcelUploadDialog, { ExcelUploadConfig } from "@/components/ExcelUploadDialog";
import { toast } from "sonner";
import UnitDetailDialog from "@/components/UnitDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { exportToExcel } from "@/lib/exportExcel";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";
import TablePagination, { paginate } from "@/components/TablePagination";

const getStatusBadge = (value: string) => {
  if (["발급완료", "납부완료", "완료", "유효"].includes(value)) return "status-complete";
  if (["예약완료"].includes(value)) return "status-pending";
  if (value === "—") return "";
  return "status-error";
};

const Residents = () => {
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({ search: "", dong: "전체", status: "전체" });
  const [page, setPage] = useState(1);

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("*, units(dong, ho, area, status, payment_status, permit_status, moving_status)")
        .order("created_at");
      if (error) throw error;

      // Fetch vehicles separately by unit_id
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

      return data.map((r: any) => ({
        dong: r.units?.dong || "",
        unit: `${r.units?.dong} ${r.units?.ho}`,
        name: r.name, phone: r.phone,
        car: vehicleMap.get(r.unit_id) || "—",
        qr: r.qr_status, permit: r.units?.permit_status || "미발급",
        payment: r.units?.payment_status || "미납",
        inspection: r.inspection_status,
        movingDate: r.moving_date ? new Date(r.moving_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        _unit: r.units,
      }));
    },
  });

  const dongOptions = useMemo(() => [...new Set(residents.map((r: any) => r.dong))].filter(Boolean).sort(), [residents]);

  const toUnitData = (r: any) => ({
    dong: r._unit?.dong || "", ho: r._unit?.ho || "", area: r._unit?.area || "84㎡",
    name: r.name, phone: r.phone,
    status: r.inspection === "완료" ? "입주완료" : "입주예정",
    payment: r.payment, permit: r.permit,
    moving: r.movingDate !== "—" ? "예약완료" : "미예약",
  });

  const filtered = applyCommonFilters(residents, filters, {
    searchFields: ["name", "phone", "unit"],
    statusField: "inspection",
    dongField: "dong",
  });

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

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => toast.success("QR 일괄발급이 완료되었습니다.")}><QrCode className="w-4 h-4" /> QR 일괄발급</button>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => toast.success("입주증 일괄승인이 완료되었습니다.")}><CreditCard className="w-4 h-4" /> 입주증 일괄승인</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => {
            exportToExcel(filtered, [
              { key: "unit", label: "세대" }, { key: "name", label: "입주자명" }, { key: "phone", label: "연락처" },
              { key: "car", label: "차량번호" }, { key: "qr", label: "QR상태" }, { key: "permit", label: "입주증" },
              { key: "payment", label: "잔금" }, { key: "inspection", label: "사검예약" }, { key: "movingDate", label: "이사일" },
            ], "입주자목록");
            toast.success("엑셀 파일이 다운로드되었습니다.");
          }}><Download className="w-4 h-4" /> 엑셀 다운로드</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>세대</th><th>입주자명</th><th>연락처</th><th>차량번호</th>
                <th>QR상태</th><th>입주증</th><th>잔금</th><th>사검예약</th><th>이사일</th>
              </tr>
            </thead>
            <tbody>
              {paginate(filtered, page).map((r: any, i: number) => (
                <tr key={i} className="cursor-pointer hover:bg-accent/50" onClick={() => { setSelectedUnit(toUnitData(r)); setDialogOpen(true); }}>
                  <td onClick={(e) => e.stopPropagation()}><input type="checkbox" /></td>
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

      <UnitDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} unit={selectedUnit} />
    </div>
  );
};

export default Residents;
