import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, QrCode, Wrench, FileCheck } from "lucide-react";

interface UnitData {
  dong: string;
  ho: string;
  area: string;
  name: string;
  phone: string;
  status: string;
  payment: string;
  permit: string;
  moving: string;
}

interface UnitDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: UnitData | null;
}

const StatusBadge = ({ value }: { value: string }) => {
  const cls = ["입주완료", "납부완료", "발급완료", "완료", "서명완료", "처리완료"].includes(value)
    ? "status-complete"
    : ["입주예정", "사검완료", "예약완료", "처리중", "승인대기"].includes(value)
    ? "status-pending"
    : "status-error";
  return <span className={`status-badge ${cls}`}>{value}</span>;
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center py-2.5 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
    <span className="text-sm font-medium text-foreground">{value}</span>
  </div>
);

const TabBasicInfo = ({ unit }: { unit: UnitData }) => (
  <div className="space-y-4">
    <div className="bg-accent/50 rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-3 text-foreground">세대 정보</h4>
      <InfoRow label="동·호수" value={`${unit.dong} ${unit.ho}`} />
      <InfoRow label="전용면적" value={unit.area} />
      <InfoRow label="입주상태" value={<StatusBadge value={unit.status} />} />
      <InfoRow label="이사예약" value={<StatusBadge value={unit.moving} />} />
    </div>
    <div className="bg-accent/50 rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-3 text-foreground">입주자 정보</h4>
      <InfoRow label="이름" value={unit.name} />
      <InfoRow label="연락처" value={unit.phone} />
      <InfoRow label="이메일" value={`${unit.name.toLowerCase()}@email.com`} />
      <InfoRow label="입주예정일" value="2026.04.15" />
      <InfoRow label="계약유형" value="분양" />
    </div>
  </div>
);

const paymentHistory = [
  { item: "계약금", amount: "30,000,000", date: "2025.06.15", status: "납부완료" },
  { item: "중도금 1차", amount: "50,000,000", date: "2025.09.15", status: "납부완료" },
  { item: "중도금 2차", amount: "50,000,000", date: "2025.12.15", status: "납부완료" },
  { item: "잔금", amount: "70,000,000", date: "2026.03.31", status: "미납" },
  { item: "옵션비", amount: "5,000,000", date: "2026.03.31", status: "미납" },
];

const TabPayments = ({ unit }: { unit: UnitData }) => (
  <div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-accent/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground">총 납부액</div>
        <div className="text-base font-bold text-primary mt-1">1.3억</div>
      </div>
      <div className="bg-accent/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground">잔여 미납</div>
        <div className="text-base font-bold text-destructive mt-1">7,500만</div>
      </div>
      <div className="bg-accent/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground">납부 상태</div>
        <div className="mt-1"><StatusBadge value={unit.payment} /></div>
      </div>
    </div>
    <table className="data-table text-sm">
      <thead>
        <tr><th>항목</th><th>금액(원)</th><th>납부기한</th><th>상태</th></tr>
      </thead>
      <tbody>
        {paymentHistory.map((p, i) => (
          <tr key={i}>
            <td>{p.item}</td>
            <td className="font-medium">{p.amount}</td>
            <td>{p.date}</td>
            <td><StatusBadge value={p.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TabQRPermit = ({ unit }: { unit: UnitData }) => (
  <div className="space-y-4">
    <div className="bg-accent/50 rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-3 text-foreground">입주증 현황</h4>
      <InfoRow label="발급상태" value={<StatusBadge value={unit.permit} />} />
      <InfoRow label="승인일시" value={unit.permit === "발급완료" ? "2026.03.28 14:00" : "—"} />
      <InfoRow label="유효기간" value={unit.permit === "발급완료" ? "2026.12.31" : "—"} />
      <InfoRow label="QR코드" value={
        unit.permit === "발급완료" 
          ? <button className="text-primary text-sm hover:underline">QR보기</button>
          : <span className="text-muted-foreground text-sm">미발급</span>
      } />
    </div>
    <div className="bg-accent/50 rounded-lg p-4">
      <h4 className="text-sm font-semibold mb-3 text-foreground">차량 QR</h4>
      <InfoRow label="등록차량" value="12가3456 (현대 아반떼)" />
      <InfoRow label="QR상태" value={<StatusBadge value="발급완료" />} />
      <InfoRow label="최근입차" value="오늘 08:45" />
      <InfoRow label="출입횟수" value="3회" />
    </div>
    <div className="flex gap-2">
      <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md">입주증 재발급</button>
      <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card">차량 QR 재발급</button>
    </div>
  </div>
);

const defectHistory = [
  { id: "D-001", type: "도배·도장", content: "거실 벽지 들뜸", company: "(주)하자보수", date: "03.25", status: "처리완료" },
  { id: "D-002", type: "배관·수도", content: "욕실 배수 느림", company: "(주)설비왕", date: "03.28", status: "처리중" },
  { id: "D-003", type: "창호·문", content: "안방 창문 잠금 불량", company: "(주)창호월드", date: "03.30", status: "접수" },
];

const TabDefects = () => (
  <div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="bg-accent/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground">전체 접수</div>
        <div className="text-base font-bold text-foreground mt-1">3건</div>
      </div>
      <div className="bg-accent/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground">처리 완료</div>
        <div className="text-base font-bold text-primary mt-1">1건</div>
      </div>
      <div className="bg-accent/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground">미처리</div>
        <div className="text-base font-bold text-destructive mt-1">2건</div>
      </div>
    </div>
    <table className="data-table text-sm">
      <thead>
        <tr><th>번호</th><th>유형</th><th>내용</th><th>업체</th><th>접수일</th><th>상태</th></tr>
      </thead>
      <tbody>
        {defectHistory.map((d, i) => (
          <tr key={i}>
            <td>{d.id}</td>
            <td>{d.type}</td>
            <td>{d.content}</td>
            <td>{d.company}</td>
            <td>{d.date}</td>
            <td><StatusBadge value={d.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const agreements = [
  { name: "주차장 이용 동의서", status: "서명완료", date: "03.20" },
  { name: "층간소음 준수 확약서", status: "서명완료", date: "03.20" },
  { name: "커뮤니티 이용 규칙", status: "미서명", date: "—" },
  { name: "개인정보 수집 동의", status: "서명완료", date: "03.20" },
  { name: "입주민 공동규약", status: "미서명", date: "—" },
];

const TabAgreements = () => (
  <div>
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-accent/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground">서명 완료</div>
        <div className="text-base font-bold text-primary mt-1">3/5</div>
      </div>
      <div className="bg-accent/50 rounded-lg p-3 text-center">
        <div className="text-xs text-muted-foreground">미서명</div>
        <div className="text-base font-bold text-destructive mt-1">2건</div>
      </div>
    </div>
    <table className="data-table text-sm">
      <thead>
        <tr><th>동의서 항목</th><th>상태</th><th>서명일</th><th>알림</th></tr>
      </thead>
      <tbody>
        {agreements.map((a, i) => (
          <tr key={i}>
            <td>{a.name}</td>
            <td><StatusBadge value={a.status} /></td>
            <td>{a.date}</td>
            <td>
              {a.status === "미서명" 
                ? <button className="text-primary text-sm hover:underline">알림 발송</button>
                : <span className="text-success text-sm">✔</span>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <button className="mt-3 w-full px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md">
      미서명 항목 일괄 알림 발송
    </button>
  </div>
);

const UnitDetailDialog = ({ open, onOpenChange, unit }: UnitDetailDialogProps) => {
  if (!unit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">{unit.dong} {unit.ho}</span>
            <StatusBadge value={unit.status} />
            <span className="text-sm font-normal text-muted-foreground ml-1">| {unit.name}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-2">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="basic" className="text-xs gap-1"><User className="w-3.5 h-3.5" />기본정보</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs gap-1"><CreditCard className="w-3.5 h-3.5" />납부내역</TabsTrigger>
            <TabsTrigger value="qr" className="text-xs gap-1"><QrCode className="w-3.5 h-3.5" />QR·입주증</TabsTrigger>
            <TabsTrigger value="defects" className="text-xs gap-1"><Wrench className="w-3.5 h-3.5" />하자이력</TabsTrigger>
            <TabsTrigger value="agreements" className="text-xs gap-1"><FileCheck className="w-3.5 h-3.5" />동의서</TabsTrigger>
          </TabsList>
          <TabsContent value="basic"><TabBasicInfo unit={unit} /></TabsContent>
          <TabsContent value="payments"><TabPayments unit={unit} /></TabsContent>
          <TabsContent value="qr"><TabQRPermit unit={unit} /></TabsContent>
          <TabsContent value="defects"><TabDefects /></TabsContent>
          <TabsContent value="agreements"><TabAgreements /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UnitDetailDialog;
