import { Search, Send, Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const signFilterOptions = ["전체", "미서명", "완료", "일부"];

const Agreements = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") || "전체";
  const [signFilter, setSignFilter] = useState(filterParam);

  useEffect(() => { setSignFilter(filterParam); }, [filterParam]);

  const { data: agreements = [], isLoading: loadingAgreements } = useQuery({
    queryKey: ["agreements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agreements").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: signatures = [], isLoading: loadingSigs } = useQuery({
    queryKey: ["agreement_signatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agreement_signatures")
        .select("*, units(dong, ho), agreements(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-for-agreements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("residents").select("unit_id, name");
      if (error) throw error;
      return data;
    },
  });

  const handleFilterChange = (value: string) => {
    setSignFilter(value);
    if (value === "전체") { searchParams.delete("filter"); } else { searchParams.set("filter", value); }
    setSearchParams(searchParams, { replace: true });
  };

  // Build per-unit signing summary
  const unitMap = new Map<string, { dong: string; ho: string; name: string; signed: Record<string, boolean>; lastDate: string | null }>();
  signatures.forEach((sig: any) => {
    const unitId = sig.unit_id;
    if (!unitMap.has(unitId)) {
      const resident = residents.find((r: any) => r.unit_id === unitId);
      unitMap.set(unitId, {
        dong: sig.units?.dong || "",
        ho: sig.units?.ho || "",
        name: resident?.name || "—",
        signed: {},
        lastDate: null,
      });
    }
    const entry = unitMap.get(unitId)!;
    entry.signed[sig.agreements?.name || sig.agreement_id] = !!sig.signed;
    if (sig.signed_at && (!entry.lastDate || sig.signed_at > entry.lastDate)) {
      entry.lastDate = sig.signed_at;
    }
  });

  const agreementNames = agreements.map(a => a.name);
  const unitRows = Array.from(unitMap.entries()).map(([, v]) => {
    const allSigned = agreementNames.every(n => v.signed[n]);
    const noneSigned = agreementNames.every(n => !v.signed[n]);
    return { ...v, allSigned, noneSigned };
  });

  const filteredRows = unitRows.filter(r => {
    if (signFilter === "전체") return true;
    if (signFilter === "완료") return r.allSigned;
    if (signFilter === "미서명") return r.noneSigned;
    if (signFilter === "일부") return !r.allSigned && !r.noneSigned;
    return true;
  });

  const isLoading = loadingAgreements || loadingSigs;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">전자 동의서 관리</h1>
        <p className="page-description">서명 현황 조회 · 미서명 알림 발송 · PDF 다운로드 · 항목별 관리</p>
      </div>

      {/* Agreement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {agreements.map((a) => {
          const percent = a.total_count ? Math.round(((a.signed_count || 0) / a.total_count) * 100) : 0;
          return (
            <div key={a.id} className="kpi-card">
              <div className="text-xs text-muted-foreground mb-1">{a.name}</div>
              <div className="text-lg font-bold text-foreground">{a.signed_count}/{a.total_count} <span className="text-sm font-normal text-muted-foreground">({percent}%)</span></div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div className={`h-1.5 rounded-full ${percent >= 90 ? "bg-success" : percent >= 75 ? "bg-primary" : "bg-warning"}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card"><option>동의서 종류: 전체</option></select>
        <select className="px-3 py-2 border border-border rounded-md text-sm bg-card" value={signFilter} onChange={(e) => handleFilterChange(e.target.value)}>
          {signFilterOptions.map(o => <option key={o} value={o}>서명상태: {o}</option>)}
        </select>
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="세대·이름 입력" className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md flex items-center gap-1"><Send className="w-4 h-4" /> 미서명 알림 발송</button>
          <button className="px-4 py-2 text-sm border border-border rounded-md bg-card flex items-center gap-1"><Download className="w-4 h-4" /> PDF 일괄 다운로드</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>세대</th><th>입주자</th>
                {agreementNames.map(n => <th key={n}>{n.length > 4 ? n.slice(0, 4) : n}</th>)}
                <th>서명일시</th><th>미서명 알림</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i}>
                  <td>{r.dong}동 {r.ho}</td>
                  <td className="font-medium">{r.name}</td>
                  {agreementNames.map(n => (
                    <td key={n}>{r.signed[n] ? <span className="text-success">✔</span> : <span className="text-destructive">✗</span>}</td>
                  ))}
                  <td>{r.lastDate ? new Date(r.lastDate).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—"}</td>
                  <td>
                    {r.allSigned ? <span className="text-success text-sm">✔</span> : (
                      <button className="text-primary text-sm hover:underline" onClick={() => toast.info("미서명 알림 발송")}>발송</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 p-3 bg-accent rounded-lg text-sm text-muted-foreground">
        💡 현장 설정에서 동의서 항목을 추가·수정할 수 있습니다. 변경 후 미서명 세대에 자동으로 재서명 요청이 발송됩니다.
      </div>
    </div>
  );
};

export default Agreements;
