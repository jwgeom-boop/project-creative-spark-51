import { Search, Download, Send, ArrowRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusFilterOptions = ["전체", "발급완료", "승인대기", "미발급"];

const getStatusBadge = (s: string) => {
  if (s.includes("완료")) return "status-complete";
  if (s.includes("대기")) return "status-pending";
  return "status-error";
};

const Permits = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") || "전체";
  const [statusFilter, setStatusFilter] = useState(filterParam);

  useEffect(() => { setStatusFilter(filterParam); }, [filterParam]);

  const { data: permits = [], isLoading } = useQuery({
    queryKey: ["permits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permits")
        .select("*, units(dong, ho)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-for-permits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("residents").select("unit_id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments-for-permits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("unit_id, status, confirm_status");
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permits").update({ status: "발급완료", issued_at: new Date().toISOString(), qr_code: `QR-${Date.now()}` }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permits"] });
      toast.success("입주증이 발급되었습니다.");
    },
  });

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value === "전체") { searchParams.delete("filter"); } else { searchParams.set("filter", value); }
    setSearchParams(searchParams, { replace: true });
  };

  const filteredData = permits.filter((p: any) => {
    if (statusFilter === "전체") return true;
    return p.status === statusFilter;
  });

  const summary = [
    { label: "전체 세대", value: `${permits.length}세대` },
    { label: "발급 완료", value: `${permits.filter((p: any) => p.status === "발급완료").length}세대`, color: "text-success" },
    { label: "승인 대기", value: `${permits.filter((p: any) => p.status === "승인대기").length}세대`, color: "text-warning" },
    { label: "미발급", value: `${permits.filter((p: any) => p.status === "미발급").length}세대`, color: "text-destructive" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">입주증 발급 현황</h1>
        <p className="page-description">납부확인 → 승인 → 자동 발급 프로세스 · 미발급 세대 일괄 처리</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <h2 className="text-sm font-semibold mb-3">입주증 발급 프로세스</h2>
        <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
          {["잔금 납부", "담당자 납부 확인", "앱 승인 처리", "입주증 QR 자동 생성", "입주자 앱 수신"].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="px-3 py-2 bg-primary/10 text-primary rounded-md text-center"><div className="font-medium">{s}</div></div>
              {i < 4 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
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
          {statusFilterOptions.map(o => <option key={o} value={o}>발급상태: {o}</option>)}
        </select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 입력" className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md flex items-center gap-1"><Send className="w-4 h-4" /> 미발급 알림 발송</button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>세대</th><th>입주자</th><th>잔금납부</th><th>납부확인</th><th>발급상태</th><th>발급일</th><th>QR</th><th>관리</th></tr></thead>
            <tbody>
              {filteredData.map((p: any) => {
                const resident = residents.find((r: any) => r.unit_id === p.unit_id);
                const payment = payments.find((pm: any) => pm.unit_id === p.unit_id);
                return (
                  <tr key={p.id}>
                    <td>{p.units?.dong}동 {p.units?.ho}</td>
                    <td className="font-medium">{resident?.name || "—"}</td>
                    <td><span className={`status-badge ${getStatusBadge(payment?.status || "미납")}`}>{payment?.status || "미납"}</span></td>
                    <td>{payment?.confirm_status || "—"}</td>
                    <td><span className={`status-badge ${getStatusBadge(p.status)}`}>{p.status}</span></td>
                    <td>{p.issued_at ? new Date(p.issued_at).toLocaleDateString("ko-KR") : "—"}</td>
                    <td>{p.qr_code ? <button className="text-primary text-sm hover:underline">QR보기</button> : "—"}</td>
                    <td>
                      {p.status === "승인대기" ? (
                        <button className="text-primary text-sm hover:underline" onClick={() => approveMutation.mutate(p.id)}>승인</button>
                      ) : p.status === "발급완료" ? (
                        <button className="text-muted-foreground text-sm hover:underline">재발급</button>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Permits;
