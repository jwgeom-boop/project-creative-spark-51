import { useState } from "react";
import { Search, Download, QrCode, CreditCard } from "lucide-react";
import { toast } from "sonner";
import UnitDetailDialog from "@/components/UnitDetailDialog";

const residentData = [
  { unit: "101동 0101", name: "홍길동", phone: "010-1234-5678", car: "12가3456", qr: "발급완료", permit: "발급완료", payment: "납부완료", inspection: "완료", movingDate: "03.15" },
  { unit: "101동 0102", name: "김철수", phone: "010-9876-5432", car: "—", qr: "미발급", permit: "미발급", payment: "미납", inspection: "미예약", movingDate: "—" },
  { unit: "102동 0201", name: "이영희", phone: "010-1111-2222", car: "34나5678", qr: "발급완료", permit: "미발급", payment: "납부완료", inspection: "예약완료", movingDate: "03.20" },
  { unit: "102동 0302", name: "박민준", phone: "010-3333-4444", car: "56다7890", qr: "발급완료", permit: "발급완료", payment: "납부완료", inspection: "완료", movingDate: "03.22" },
];

const getStatusBadge = (value: string) => {
  if (["발급완료", "납부완료", "완료"].includes(value)) return "status-complete";
  if (["예약완료"].includes(value)) return "status-pending";
  if (value === "—") return "";
  return "status-error";
};

const toUnitData = (r: typeof residentData[0]) => {
  const [dong, ho] = r.unit.split(" ");
  return {
    dong, ho, area: "84㎡", name: r.name, phone: r.phone,
    status: r.inspection === "완료" ? "입주완료" : "입주예정",
    payment: r.payment, permit: r.permit,
    moving: r.movingDate !== "—" ? "예약완료" : "미예약",
  };
};

const Residents = () => {
  const [selectedUnit, setSelectedUnit] = useState<ReturnType<typeof toUnitData> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");

  const handleRowClick = (r: typeof residentData[0]) => {
    setSelectedUnit(toUnitData(r));
    setDialogOpen(true);
  };

  const filtered = residentData.filter(r => {
    if (search && !r.name.includes(search) && !r.phone.includes(search) && !r.unit.includes(search)) return false;
    if (statusFilter === "입주완료" && r.inspection !== "완료") return false;
    if (statusFilter === "미입주" && r.inspection === "완료") return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">입주자 목록</h1>
        <p className="page-description">QR 관리 · 입주증 발급·승인 · 차량 등록 현황</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="이름 / 연락처 / 세대" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="전체">입주상태: 전체</option>
          <option value="입주완료">입주완료</option>
          <option value="미입주">미입주</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => toast.success("QR 일괄발급이 완료되었습니다.")}><QrCode className="w-4 h-4" /> QR 일괄발급</button>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => toast.success("입주증 일괄승인이 완료되었습니다.")}><CreditCard className="w-4 h-4" /> 입주증 일괄승인</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => toast.success("엑셀 파일이 다운로드되었습니다.")}><Download className="w-4 h-4" /> 엑셀 다운로드</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>세대</th><th>입주자명</th><th>연락처</th><th>차량번호</th>
              <th>QR상태</th><th>입주증</th><th>잔금</th><th>사검예약</th><th>이사일</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="cursor-pointer hover:bg-accent/50" onClick={() => handleRowClick(r)}>
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
      </div>

      <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-foreground">
        ⚠ QR 미발급 세대 45세대 — 입주증 발급을 위해 QR 발급이 선행되어야 합니다.
      </div>

      <UnitDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} unit={selectedUnit} />
    </div>
  );
};

export default Residents;
