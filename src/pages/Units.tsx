import { useState } from "react";
import { Search, Download } from "lucide-react";
import UnitDetailDialog from "@/components/UnitDetailDialog";

const unitData = [
  { dong: "101동", ho: "0101호", area: "84㎡", name: "홍길동", phone: "010-1234-5678", status: "입주완료", payment: "납부완료", permit: "발급완료", moving: "완료" },
  { dong: "101동", ho: "0102호", area: "59㎡", name: "김철수", phone: "010-9876-5432", status: "입주예정", payment: "미납", permit: "미발급", moving: "예약완료" },
  { dong: "101동", ho: "0201호", area: "84㎡", name: "이영희", phone: "010-1111-2222", status: "사검완료", payment: "납부완료", permit: "미발급", moving: "미예약" },
  { dong: "102동", ho: "0301호", area: "114㎡", name: "박민준", phone: "010-3333-4444", status: "입주완료", payment: "납부완료", permit: "발급완료", moving: "완료" },
  { dong: "102동", ho: "0302호", area: "84㎡", name: "최수연", phone: "010-5555-6666", status: "미입주", payment: "미납", permit: "미발급", moving: "미예약" },
];

const getStatusBadge = (value: string) => {
  if (["입주완료", "납부완료", "발급완료", "완료"].includes(value)) return "status-complete";
  if (["입주예정", "사검완료", "예약완료"].includes(value)) return "status-pending";
  return "status-error";
};

const Units = () => {
  const [selectedUnit, setSelectedUnit] = useState<typeof unitData[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (unit: typeof unitData[0]) => {
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
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card">
          <option>동 선택: 전체</option>
          <option>101동</option><option>102동</option><option>103동</option>
        </select>
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card">
          <option>입주상태: 전체</option>
          <option>입주완료</option><option>입주예정</option><option>미입주</option>
        </select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 검색" className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <button className="ml-auto px-4 py-2 text-sm border border-border rounded-md bg-card hover:bg-accent flex items-center gap-1">
          <Download className="w-4 h-4" /> 엑셀 다운로드
        </button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th><input type="checkbox" className="rounded" /></th>
              <th>동</th><th>호수</th><th>전용면적</th><th>입주자명</th><th>연락처</th>
              <th>입주상태</th><th>잔금납부</th><th>입주증</th><th>이사예약</th>
            </tr>
          </thead>
          <tbody>
            {unitData.map((u, i) => (
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
          </tbody>
        </table>
        <div className="px-4 py-3 text-sm text-muted-foreground border-t border-border">
          총 300세대 중 5건 표시 | 1 / 60 페이지
        </div>
      </div>

      <UnitDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} unit={selectedUnit} />
    </div>
  );
};

export default Units;
