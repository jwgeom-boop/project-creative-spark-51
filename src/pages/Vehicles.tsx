import { useState } from "react";
import { Search, Download, QrCode, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ExcelUploadDialog, { ExcelUploadConfig } from "@/components/ExcelUploadDialog";

const Vehicles = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);

  const uploadConfig: ExcelUploadConfig = {
    title: "차량 엑셀 업로드",
    tableName: "vehicles",
    columns: [
      { dbField: "dong", label: "동", required: true },
      { dbField: "ho", label: "호수", required: true },
      { dbField: "plate", label: "차량번호", required: true },
      { dbField: "car_model", label: "차종" },
    ],
    invalidateKeys: ["vehicles"],
    transformRow: async (row) => {
      const { data } = await supabase
        .from("units").select("id")
        .eq("dong", String(row.dong)).eq("ho", String(row.ho)).maybeSingle();
      if (!data) throw new Error(`세대 ${row.dong}동 ${row.ho}호를 찾을 수 없습니다.`);
      return { unit_id: data.id, plate: String(row.plate), car_model: row.car_model || "" };
    },
  };

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, units(dong, ho, residents(name))")
        .order("created_at");
      if (error) throw error;
      return data.map((v: any) => ({
        unit: `${v.units?.dong} ${v.units?.ho}`,
        name: v.units?.residents?.[0]?.name || "—",
        plate: v.plate, car: v.car_model || "—",
        qrDate: v.qr_issued_date ? new Date(v.qr_issued_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—",
        qrStatus: v.qr_status,
        expiry: v.expiry_date ? new Date(v.expiry_date).toLocaleDateString("ko-KR") : "—",
      }));
    },
  });

  const summary = [
    { label: "등록 차량", value: `${vehicles.length}대` },
    { label: "QR 발급완료", value: `${vehicles.filter((v: any) => v.qrStatus === "유효").length}대`, color: "text-success" },
    { label: "미발급", value: `${vehicles.filter((v: any) => v.qrStatus === "미발급").length}대`, color: "text-destructive" },
  ];

  const filtered = vehicles.filter((v: any) => {
    if (!search) return true;
    return v.name.includes(search) || v.unit.includes(search) || v.plate.includes(search);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">차량 등록 현황</h1>
        <p className="page-description">입주자 차량 QR · 이삿짐 차량 임시 QR · 출입 이력 통합 관리</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {["입주자 차량", "이삿짐 차량 (임시 QR)", "출입 이력"].map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-2 text-sm rounded-t-md border border-b-0 ${activeTab === i ? "bg-card font-semibold border-border" : "bg-muted text-muted-foreground border-transparent"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름·차량번호 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => toast.success("QR 일괄발급이 완료되었습니다.")}><QrCode className="w-4 h-4" /> QR 일괄발급</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => setUploadOpen(true)}><Upload className="w-4 h-4" /> 엑셀 업로드</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => toast.success("엑셀 파일이 다운로드되었습니다.")}><Download className="w-4 h-4" /> 엑셀 다운로드</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>세대</th><th>입주자명</th><th>차량번호</th><th>차종</th><th>QR발급일</th><th>QR상태</th><th>유효기간</th><th>QR 관리</th></tr></thead>
            <tbody>
              {filtered.map((v: any, i: number) => (
                <tr key={i}>
                  <td>{v.unit}</td><td className="font-medium">{v.name}</td><td>{v.plate}</td><td>{v.car}</td><td>{v.qrDate}</td>
                  <td><span className={`status-badge ${v.qrStatus === "유효" ? "status-complete" : "status-error"}`}>{v.qrStatus}</span></td>
                  <td>{v.expiry}</td>
                  <td><button className="text-primary text-sm hover:underline" onClick={() => toast.success(`QR이 ${v.qrStatus === "미발급" ? "발급" : "재발급"}되었습니다.`)}>{v.qrStatus === "미발급" ? "발급" : "재발급"}</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Vehicles;
