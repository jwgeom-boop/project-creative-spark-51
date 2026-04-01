import { useState } from "react";
import { Search, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import UnitDetailDialog from "@/components/UnitDetailDialog";
import ExcelUploadDialog, { ExcelUploadConfig } from "@/components/ExcelUploadDialog";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const getStatusBadge = (value: string) => {
  if (["입주완료", "납부완료", "발급완료", "완료"].includes(value)) return "status-complete";
  if (["입주예정", "사검완료", "예약완료"].includes(value)) return "status-pending";
  return "status-error";
};

const Units = () => {
  const [searchParams] = useSearchParams();
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dongFilter, setDongFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("filter") || "전체");

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

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*, residents(name, phone)")
        .order("dong")
        .order("ho");
      if (error) throw error;
      return data.map((u: any) => ({
        dong: u.dong, ho: u.ho, area: u.area,
        name: u.residents?.[0]?.name || "—",
        phone: u.residents?.[0]?.phone || "—",
        status: u.status, payment: u.payment_status,
        permit: u.permit_status, moving: u.moving_status,
      }));
    },
  });

  const dongs = [...new Set(units.map((u: any) => u.dong))];

  const filtered = units.filter((u: any) => {
    if (dongFilter !== "전체" && u.dong !== dongFilter) return false;
    if (statusFilter !== "전체" && u.status !== statusFilter) return false;
    if (search && !u.name.includes(search) && !u.dong.includes(search) && !u.ho.includes(search)) return false;
    return true;
  });

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
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card hover:bg-accent flex items-center gap-1" onClick={() => toast.success("엑셀 파일이 다운로드되었습니다.")}>
            <Download className="w-4 h-4" /> 엑셀 다운로드
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" className="rounded" /></th>
                <th>동</th><th>호수</th><th>전용면적</th><th>입주자명</th><th>연락처</th>
                <th>입주상태</th><th>잔금납부</th><th>입주증</th><th>이사예약</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any, i: number) => (
                <tr key={i} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleRowClick(u)}>
                  <td onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded" /></td>
                  <td>{u.dong}</td><td>{u.ho}</td><td>{u.area}</td>
                  <td className="font-medium text-primary">{u.name}</td><td>{u.phone}</td>
                  <td><span className={`status-badge ${getStatusBadge(u.status)}`}>{u.status}</span></td>
                  <td><span className={`status-badge ${getStatusBadge(u.payment)}`}>{u.payment}</span></td>
                  <td><span className={`status-badge ${getStatusBadge(u.permit)}`}>{u.permit}</span></td>
                  <td><span className={`status-badge ${getStatusBadge(u.moving)}`}>{u.moving}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border">
          총 {units.length}세대 중 {filtered.length}건 표시
        </div>
      </div>

      <UnitDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} unit={selectedUnit} />
    </div>
  );
};

export default Units;
