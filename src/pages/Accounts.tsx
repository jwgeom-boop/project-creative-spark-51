import { useState } from "react";
import { Plus, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const rolePermissions = [
  { perm: "모든 현장 접근, 계정 관리, 설정 변경", super: true, admin: false, normal: false },
  { perm: "담당 현장 전체 기능", super: false, admin: true, normal: false },
  { perm: "CS·하자 조회·처리만 가능", super: false, admin: false, normal: true },
];

const getRoleBadge = (role: string) => {
  if (role === "super_admin") return "bg-destructive/10 text-destructive";
  if (role === "site_manager") return "bg-primary/10 text-primary";
  return "bg-success/10 text-success";
};

const getRoleLabel = (role: string) => {
  if (role === "super_admin") return "슈퍼관리자";
  if (role === "site_manager") return "현장관리자";
  if (role === "cs_agent") return "CS담당자";
  return role;
};

const Accounts = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ["user_roles_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const accountData = profiles.map((p: any) => {
    const roles = userRoles.filter((r: any) => r.user_id === p.user_id);
    const mainRole = roles[0]?.role || "—";
    return {
      ...p,
      role: mainRole,
      isSelf: p.user_id === user?.id,
    };
  });

  const filtered = accountData.filter((a: any) => !search || a.name.includes(search) || (a.email || "").includes(search));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">담당자 계정 관리</h1>
        <p className="page-description">계정 생성·수정·권한 설정 · 현장별 접근 제어</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="이름·이메일 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <button className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> 계정 추가</button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>이름</th><th>이메일</th><th>연락처</th><th>권한</th><th>가입일</th><th>관리</th></tr></thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.name} {a.isSelf && <span className="text-xs text-muted-foreground">(본인)</span>}</td>
                  <td>{a.email}</td>
                  <td>{a.phone || "—"}</td>
                  <td><span className={`status-badge ${getRoleBadge(a.role)}`}>{getRoleLabel(a.role)}</span></td>
                  <td>{new Date(a.created_at).toLocaleDateString("ko-KR")}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="text-primary text-sm hover:underline" onClick={() => toast.info("수정 모드")}>수정</button>
                      {!a.isSelf && <button className="text-destructive text-sm hover:underline" onClick={() => toast.info("삭제 기능")}>삭제</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">권한 등급 안내</h2>
        </div>
        <table className="data-table">
          <thead><tr><th>권한</th><th>슈퍼관리자</th><th>현장관리자</th><th>CS담당자</th></tr></thead>
          <tbody>
            {rolePermissions.map((r, i) => (
              <tr key={i}>
                <td className="text-xs">{r.perm}</td>
                <td className="text-center">{r.super ? <span className="text-success">✔</span> : "—"}</td>
                <td className="text-center">{r.admin ? <span className="text-success">✔</span> : "—"}</td>
                <td className="text-center">{r.normal ? <span className="text-success">✔</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>계정 추가</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">새 담당자에게 이메일 초대를 보내 계정을 생성합니다. (추후 구현 예정)</p>
          <div className="flex gap-2 pt-4">
            <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setAddOpen(false)}>닫기</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
