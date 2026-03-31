import { Search, Download, Send } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { exportToExcel } from "@/lib/exportExcel";

const getPaymentStatusBadge = (status: string) => {
  if (status === "납부완료" || status === "승인완료") return "status-complete";
  if (status.includes("연체")) return "status-error";
  return "status-pending";
};

const statusFilterOptions = ["전체", "납부완료", "미납", "연체"];

const formatAmount = (n: number) => n > 0 ? n.toLocaleString() : "미선택";

const Payments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") || "전체";
  const [statusFilter, setStatusFilter] = useState(filterParam);

  useEffect(() => { setStatusFilter(filterParam); }, [filterParam]);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, units(dong, ho, residents(name))")
        .order("created_at");
      if (error) throw error;
      return data.map((p: any) => ({
        unit: `${p.units?.dong} ${p.units?.ho}`,
        name: p.units?.residents?.[0]?.name || "—",
        balance: p.balance?.toLocaleString() || "0",
        mid: p.mid_payment_status || "—",
        option: formatAmount(p.option_amount || 0),
        ext: formatAmount(p.extension_amount || 0),
        etc: formatAmount(p.etc_amount || 0),
        total: p.total_amount?.toLocaleString() || "0",
        status: p.status, confirm: p.confirm_status,
      }));
    },
  });

  const summary = [
    { label: "전체 세대", value: `${payments.length}세대` },
    { label: "납부완료", value: `${payments.filter((p: any) => p.status === "납부완료").length}세대`, color: "text-success" },
    { label: "미납", value: `${payments.filter((p: any) => p.status === "미납").length}세대`, color: "text-warning" },
    { label: "연체", value: `${payments.filter((p: any) => p.status.includes("연체")).length}세대`, color: "text-destructive" },
  ];

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "전체") { searchParams.delete("filter"); } else { searchParams.set("filter", value); }
    setSearchParams(searchParams, { replace: true });
  };

  const filteredData = payments.filter((p: any) => {
    if (statusFilter === "전체") return true;
    if (statusFilter === "미납") return p.status === "미납";
    if (statusFilter === "연체") return p.status.includes("연체");
    if (statusFilter === "납부완료") return p.status === "납부완료";
    return true;
  });

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

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card" value={statusFilter} onChange={(e) => handleFilterChange(e.target.value)}>
          {statusFilterOptions.map(o => <option key={o} value={o}>납부상태: {o}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md flex items-center gap-1" onClick={() => toast.success("미납 알림이 일괄 발송되었습니다.")}><Send className="w-4 h-4" /> 미납 알림 일괄발송</button>
<button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1" onClick={() => {
                exportToExcel(filteredData, [
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
              {filteredData.map((p: any, i: number) => (
                <tr key={i}>
                  <td>{p.unit}</td><td className="font-medium">{p.name}</td>
                  <td className="text-right">{p.balance}</td><td>{p.mid}</td>
                  <td className="text-right">{p.option}</td><td className="text-right">{p.ext}</td>
                  <td className="text-right">{p.etc}</td><td className="text-right font-medium">{p.total}</td>
                  <td><span className={`status-badge ${getPaymentStatusBadge(p.status)}`}>{p.status}</span></td>
                  <td><span className={`status-badge ${getPaymentStatusBadge(p.confirm)}`}>{p.confirm}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Payments;
