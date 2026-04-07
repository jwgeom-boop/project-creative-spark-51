import { useState, useMemo } from "react";
import { Download, Send, Upload, CheckCircle2, Loader2 } from "lucide-react";
import ExcelUploadDialog, { ExcelUploadConfig } from "@/components/ExcelUploadDialog";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { exportToExcel } from "@/lib/exportExcel";
import AdvancedFilterBar, { FilterValues, applyCommonFilters } from "@/components/AdvancedFilterBar";
import TablePagination, { paginate } from "@/components/TablePagination";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PaymentReceiptModal from "@/components/payments/PaymentReceiptModal";
import PaymentKpiCards from "@/components/payments/PaymentKpiCards";

interface PaymentItem {
  id: string;
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

const getPaymentStatusBadge = (status: string) => {
  if (status === "납부완료" || status === "승인완료") return "status-complete";
  if (status.includes("연체")) return "status-error";
  return "status-pending";
};

const formatAmount = (n: number) => n > 0 ? n.toLocaleString() : "미선택";

const Payments = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterValues>({
    search: "", dong: "전체", status: searchParams.get("filter") || "전체",
  });
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [approveTarget, setApproveTarget] = useState<PaymentItem | null>(null);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

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
        id: p.id,
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

  const filtered = applyCommonFilters(payments, filters, {
    searchFields: ["unit", "name"],
    statusField: "status",
    dongField: "dong",
  });

  const currentPageItems = paginate(filtered, page) as PaymentItem[];
  const unpaidOnPage = currentPageItems.filter(p => !p.paid);
  const allUnpaidChecked = unpaidOnPage.length > 0 && unpaidOnPage.every(p => checkedIds.has(p.id));

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllPage = () => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (allUnpaidChecked) {
        unpaidOnPage.forEach(p => next.delete(p.id));
      } else {
        unpaidOnPage.forEach(p => next.add(p.id));
      }
      return next;
    });
  };

  const handleApprove = async (ids: string[]) => {
    setIsApproving(true);
    try {
      for (const id of ids) {
        const { error } = await supabase
          .from("payments")
          .update({ status: "납부완료", confirm_status: "승인완료", paid_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      setCheckedIds(new Set());
      toast.success(ids.length === 1 ? "납부 승인이 완료되었습니다." : `${ids.length}건 납부 승인이 완료되었습니다.`);
    } catch (e: any) {
      toast.error(`승인 실패: ${e.message}`);
    } finally {
      setIsApproving(false);
      setApproveTarget(null);
      setBulkApproveOpen(false);
    }
  };

  const selectedCount = [...checkedIds].filter(id => payments.find(p => p.id === id && !p.paid)).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">잔금 납부 현황</h1>
        <p className="page-description">세대별 납부 상태 조회 · 미납 알림 · 승인 처리</p>
      </div>

      <PaymentKpiCards payments={payments} />

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

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-accent/50 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium">{selectedCount}건 선택됨</span>
            <Button size="sm" onClick={() => setBulkApproveOpen(true)}>일괄 승인</Button>
            <Button size="sm" variant="ghost" onClick={() => setCheckedIds(new Set())}>선택 해제</Button>
          </div>
        )}
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10"><Checkbox checked={allUnpaidChecked && unpaidOnPage.length > 0} onCheckedChange={toggleAllPage} /></th>
                <th>세대</th><th>입주자</th><th>잔금</th><th>중도금</th><th>옵션비</th><th>확장비</th><th>기타부담금</th><th>합계</th><th>납부상태</th><th>납부확인</th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.map((p, i) => (
                <tr key={i} className={`${checkedIds.has(p.id) ? "bg-accent/30" : ""} ${p.paid ? "cursor-pointer hover:bg-muted/50" : ""}`}>
                  <td>
                    {!p.paid ? (
                      <Checkbox checked={checkedIds.has(p.id)} onCheckedChange={() => toggleCheck(p.id)} />
                    ) : null}
                  </td>
                  <td onClick={() => { if (p.paid) setSelectedPayment(p); }}>{p.unit}</td>
                  <td className="font-medium" onClick={() => { if (p.paid) setSelectedPayment(p); }}>{p.name}</td>
                  <td className="text-right">{p.balance}</td><td>{p.mid}</td>
                  <td className="text-right">{p.option}</td><td className="text-right">{p.ext}</td>
                  <td className="text-right">{p.etc}</td><td className="text-right font-medium">{p.total}</td>
                  <td><span className={`status-badge ${getPaymentStatusBadge(p.status)}`}>{p.status}</span></td>
                  <td>
                    <div className="flex flex-col items-end gap-0.5">
                      {p.paid ? (
                        <>
                          <span className={`status-badge ${getPaymentStatusBadge(p.confirm)}`}>{p.confirm}</span>
                          <span className="text-xs text-blue-500 underline cursor-pointer" onClick={() => setSelectedPayment(p)}>영수증 보기</span>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setApproveTarget(p)}>승인</Button>
                      )}
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

      {/* Receipt Modal */}
      <PaymentReceiptModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />

      {/* Single Approve Dialog */}
      <AlertDialog open={!!approveTarget} onOpenChange={(open) => { if (!open) setApproveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>납부를 승인하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {approveTarget && `${approveTarget.unit} | ${approveTarget.name} | 잔금 ${approveTarget.total}원`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>취소</AlertDialogCancel>
            <AlertDialogAction disabled={isApproving} onClick={() => approveTarget && handleApprove([approveTarget.id])}>
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}승인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Approve Dialog */}
      <AlertDialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택한 {selectedCount}건의 납부를 승인하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>승인 후 납부상태가 "납부완료"로 변경됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApproving}>취소</AlertDialogCancel>
            <AlertDialogAction disabled={isApproving} onClick={() => {
              const ids = [...checkedIds].filter(id => payments.find(p => p.id === id && !p.paid));
              handleApprove(ids);
            }}>
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}일괄 승인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Payments;
