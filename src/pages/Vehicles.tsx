import { useState } from "react";
import { Search, Download, QrCode } from "lucide-react";
import { toast } from "sonner";

const summary = [
  { label: "등록 차량", value: "312대" },
  { label: "QR 발급완료", value: "298대", color: "text-success" },
  { label: "미발급", value: "14대", color: "text-destructive" },
  { label: "오늘 이삿짐", value: "8대", color: "text-warning" },
  { label: "오늘 입출차", value: "47회" },
];

const vehicleData = [
  { unit: "101동 0101", name: "홍길동", plate: "12가3456", car: "현대 아반떼", qrDate: "03.20", qrStatus: "유효", expiry: "2026.12.31", lastEntry: "오늘 08:45", count: "3회" },
  { unit: "101동 0102", name: "김철수", plate: "34나5678", car: "기아 K5", qrDate: "03.22", qrStatus: "유효", expiry: "2026.12.31", lastEntry: "03.28", count: "1회" },
  { unit: "102동 0201", name: "이영희", plate: "—", car: "—", qrDate: "—", qrStatus: "미발급", expiry: "—", lastEntry: "—", count: "—" },
  { unit: "102동 0302", name: "박민준", plate: "56다7890", car: "BMW 520i", qrDate: "03.15", qrStatus: "유효", expiry: "2026.12.31", lastEntry: "오늘 09:12", count: "5회" },
  { unit: "103동 1503", name: "최수연", plate: "78라9012", car: "테슬라 모델3", qrDate: "03.18", qrStatus: "유효", expiry: "2026.12.31", lastEntry: "03.27", count: "2회" },
  { unit: "103동 0804", name: "정우성", plate: "—", car: "—", qrDate: "—", qrStatus: "미발급", expiry: "—", lastEntry: "—", count: "—" },
];

const Vehicles = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const filtered = vehicleData.filter(v => {
    if (!search) return true;
    return v.name.includes(search) || v.unit.includes(search) || v.plate.includes(search);
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">차량 등록 현황</h1>
        <p className="page-description">입주자 차량 QR · 이삿짐 차량 임시 QR · 출입 이력 통합 관리</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {["입주자 차량", "이삿짐 차량 (임시 QR)", "출입 이력"].map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} className={`px-4 py-2 text-sm rounded-t-md border border-b-0 ${activeTab === i ? "bg-card font-semibold border-border" : "bg-muted text-muted-foreground border-transparent"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름·차량번호 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => toast.success("QR 일괄발급이 완료되었습니다.")}><QrCode className="w-4 h-4" /> QR 일괄발급</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => toast.success("엑셀 파일이 다운로드되었습니다.")}><Download className="w-4 h-4" /> 엑셀 다운로드</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>세대</th><th>입주자명</th><th>차량번호</th><th>차종</th><th>QR발급일</th><th>QR상태</th><th>유효기간</th><th>최근입차</th><th>출입횟수</th><th>QR 관리</th></tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr key={i}>
                <td>{v.unit}</td>
                <td className="font-medium">{v.name}</td>
                <td>{v.plate}</td>
                <td>{v.car}</td>
                <td>{v.qrDate}</td>
                <td><span className={`status-badge ${v.qrStatus === "유효" ? "status-complete" : "status-error"}`}>{v.qrStatus}</span></td>
                <td>{v.expiry}</td>
                <td>{v.lastEntry}</td>
                <td>{v.count}</td>
                <td>
                  <button className="text-primary text-sm hover:underline" onClick={() => toast.success(`${v.name} 세대 QR이 ${v.qrStatus === "미발급" ? "발급" : "재발급"}되었습니다.`)}>
                    {v.qrStatus === "미발급" ? "발급" : "재발급"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={10} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-accent rounded-lg text-sm text-muted-foreground">
        💡 이사 예약 완료 세대에 당일 유효한 임시 QR 자동 발급 → 이삿짐 전용 주차구역 배정 → 당일 24:00 자동 만료
      </div>
    </div>
  );
};

export default Vehicles;
