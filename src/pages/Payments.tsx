import { useState, useMemo } from "react";
import { Download, Send, Upload, CheckCircle2 } from "lucide-react";
import ExcelUploadDialog, { ExcelUploadConfig } from "@/components/ExcelUploadDialog";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { exportToExcel } from "@/lib/exportExcel";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";
import TablePagination, { paginate } from "@/components/TablePagination";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaymentItem {
  dong: string;
  unit: string;
  name: string;
  balance: string;
  mid: string;
  option: string;
  ext: string;
  etc: string;
  total: string;
  totalRaw: number;
  status: string;
  confirm: string;
  paid: boolean;
}

const paymentDateMap: Record<string, string> = {
  "분양 잔금": "2026.02.14",
  "중도금 1차": "2025.06.30",
  "중도금 2차": "2025.12.31",
  "발코니 확장비": "2024.11.20",
  "옵션비 (시스템에어컨)": "2024.11.20",
  "관리비 예치금": "2026.01.10",
};

const receiptNumberMap: Record<string, string> = {
  "분양 잔금": "RCP-2026-0214",
  "중도금 1차": "RCP-2025-0630",
  "중도금 2차": "RCP-2025-1231",
  "발코니 확장비": "RCP-2024-1120",
  "옵션비 (시스템에어컨)": "RCP-2024-1121",
  "관리비 예치금": "RCP-2026-0110",
};

const getPaymentStatusBadge = (status: string) => {
  if (status === "납부완료" || status === "승인완료") return "status-complete";
  if (status.includes("연체")) return "status-error";
  return "status-pending";
};

const formatAmount = (n: number) => n > 0 ? n.toLocaleString() : "미선택";

const Payments = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterValues>({
    search: "", dong: "전체", status: searchParams.get("filter") || "전체",
  });
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);

  const uploadConfig: ExcelUploadConfig = {
    title: "납부내역 엑셀 업로드",
    tableName: "payments",
    columns: [
      { dbField: "dong", label: "동", required: true },
      { dbField: "ho", label: "호수", required: true },
      { dbField: "balance", label: "잔금" },
      { dbField: "option_amount", label: "옵션비" },
      { dbField: "extension_amount", label: "확장비" },
      { dbField: "etc_amount", label: "기타부담금" },
      { dbField: "total_amount", label: "합계" },
    ],
    invalidateKeys: ["payments"],
    transformRow: async (row) => {
      const { data } = await supabase
        .from("units").select("id")
        .eq("dong", String(row.dong)).eq("ho", String(row.ho)).maybeSingle();
      if (!data) throw new Error(`세대 ${row.dong}동 ${row.ho}호를 찾을 수 없습니다.`);
      return {
        unit_id: data.id,
        balance: Number(row.balance) || 0,
        option_amount: Number(row.option_amount) || 0,
        extension_amount: Number(row.extension_amount) || 0,
        etc_amount: Number(row.etc_amount) || 0,
        total_amount: Number(row.total_amount) || 0,
      };
    },
  };

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, units(dong, ho, residents(name))")
        .order("created_at");
      if (error) throw error;
      return data.map((p: any) => ({
        dong: p.units?.dong || "",
        unit: `${p.units?.dong} ${p.units?.ho}`,
        name: p.units?.residents?.[0]?.name || "—",
        balance: p.balance?.toLocaleString() || "0",
        mid: p.mid_payment_status || "—",
        option: formatAmount(p.option_amount || 0),
        ext: formatAmount(p.extension_amount || 0),
        etc: formatAmount(p.etc_amount || 0),
        total: p.total_amount?.toLocaleString() || "0",
        totalRaw: p.total_amount || 0,
        status: p.status,
        confirm: p.confirm_status,
        paid: p.status === "납부완료",
      })) as PaymentItem[];
    },
  });

  const dongOptions = useMemo(() => [...new Set(payments.map((p) => p.dong))].filter(Boolean).sort(), [payments]);

  const summary = [
    { label: "전체 세대", value: `${payments.length}세대` },
    { label: "납부완료", value: `${payments.filter((p) => p.status === "납부완료").length}세대`, color: "text-success" },
    { label: "미납", value: `${payments.filter((p) => p.status === "미납").length}세대`, color: "text-warning" },
    { label: "연체", value: `${payments.filter((p) => p.status.includes("연체")).length}세대`, color: "text-destructive" },
  ];

  const filtered = applyCommonFilters(payments, filters, {
    searchFields: ["unit", "name"],
    statusField: "status",
    dongField: "dong",
  });

  const receiptLabel = selectedPayment ? "분양 잔금" : "";
  const receiptDate = paymentDateMap[receiptLabel] || "2026.02.14";
  const receiptNumber = receiptNumberMap[receiptLabel] || "RCP-2026-0001";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">잔금 납부 현황</h1>
        <p className="page-description">세대별 납부 상태 조회 · 미납 알림 · 승인 처리</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.label} className="kpi-card">
            <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <AdvancedFilterBar
        config={{
          searchPlaceholder: "세대 / 입주자명 검색",
          dongOptions,
          statusOptions: [
            { label: "전체", value: "전체" },
            { label: "납부완료", value: "납부완료" },
            { label: "미납", value: "미납" },
            { label: "연체", value: "연체" },
          ],
          statusLabel: "납부상태",
        }}
        values={filters}
        onChange={(v) => { setFilters(v); setPage(1); }}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md flex items-center gap-1" onClick={() => toast.success("미납 알림이 일괄 발송되었습니다.")}><Send className="w-4 h-4" /> 미납 알림 일괄발송</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => setUploadOpen(true)}><Upload className="w-4 h-4" /> 엑셀 업로드</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => {
            exportToExcel(filtered as any, [
              { key: "unit", label: "세대" }, { key: "name", label: "입주자" }, { key: "balance", label: "잔금" },
              { key: "mid", label: "중도금" }, { key: "option", label: "옵션비" }, { key: "ext", label: "확장비" },
              { key: "etc", label: "기타부담금" }, { key: "total", label: "합계" }, { key: "status", label: "납부상태" }, { key: "confirm", label: "납부확인" },
            ], "납부현황");
            toast.success("엑셀 파일이 다운로드되었습니다.");
          }}><Download className="w-4 h-4" /> 엑셀 다운로드</button>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={() => toast.success("납부가 승인되었습니다.")}>납부 승인</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>세대</th><th>입주자</th><th>잔금</th><th>중도금</th><th>옵션비</th><th>확장비</th><th>기타부담금</th><th>합계</th><th>납부상태</th><th>납부확인</th></tr></thead>
            <tbody>
              {paginate(filtered, page).map((p: any, i: number) => (
                <tr
                  key={i}
                  className={p.paid ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => { if (p.paid) setSelectedPayment(p); }}
                >
                  <td>{p.unit}</td><td className="font-medium">{p.name}</td>
                  <td className="text-right">{p.balance}</td><td>{p.mid}</td>
                  <td className="text-right">{p.option}</td><td className="text-right">{p.ext}</td>
                  <td className="text-right">{p.etc}</td><td className="text-right font-medium">{p.total}</td>
                  <td><span className={`status-badge ${getPaymentStatusBadge(p.status)}`}>{p.status}</span></td>
                  <td>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={`status-badge ${getPaymentStatusBadge(p.confirm)}`}>{p.confirm}</span>
                      {p.paid && <span className="text-xs text-blue-500 underline">영수증 보기</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <TablePagination currentPage={page} totalItems={filtered.length} onPageChange={(p) => setPage(p)} />
      <ExcelUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} config={uploadConfig} />

      {/* Payment Receipt Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => { if (!open) setSelectedPayment(null); }}>
        <DialogContent className="max-w-[340px] rounded-2xl p-5">
          {selectedPayment && (
            <>
              {/* Header */}
              <div className="bg-muted rounded-xl p-4 mb-4 text-center">
                <div className="text-base font-black text-foreground">납부 확인서</div>
                <div className="text-[10px] text-muted-foreground tracking-widest mt-0.5">PAYMENT RECEIPT</div>
                <div className="border-t border-dashed border-border mt-3 mb-3" />
                <div className="w-14 h-14 border-2 border-green-500 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2.5">
                {[
                  { label: "납부 항목", value: receiptLabel },
                  { label: "납부 금액", value: `${selectedPayment.totalRaw.toLocaleString()}원` },
                  { label: "납부 일자", value: receiptDate },
                  { label: "수납 기관", value: "힐스테이트 입주지원센터" },
                  { label: "납부자", value: `${selectedPayment.name} (${selectedPayment.unit})` },
                  { label: "확인번호", value: receiptNumber },
                ].map((row, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-xs text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-semibold text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-border my-3" />

              <p className="text-[10px] text-muted-foreground text-center">
                본 확인서는 전자 납부 기록을 기반으로 발급됩니다.
              </p>

              <DialogFooter className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedPayment(null)}>
                  닫기
                </Button>
                <Button
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => {
                    toast.success("영수증이 저장되었습니다");
                    setSelectedPayment(null);
                  }}
                >
                  저장하기
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
