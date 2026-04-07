import { useState } from "react";
import { Plus, Search, Shield, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const roleOptions = [
  { value: "super_admin", label: "총관리자" },
  { value: "developer", label: "시행사" },
  { value: "contractor", label: "시공사" },
  { value: "cs_center", label: "입주지원센터" },
];

const roleMenuAccess: Record<string, string> = {
  super_admin: "모든 메뉴 접근 가능",
  developer: "입주자관리, 납부관리, 안내·공지",
  contractor: "하자보수",
  cs_center: "사전점검, 이사관리, CS·민원",
};

const rolePermissions = [
  { perm: "모든 현장 접근, 계정 관리, 설정 변경", super: true, dev: false, con: false, cs: false },
  { perm: "납부 현황, 입주자 관리, 안내·공지", super: false, dev: true, con: false, cs: false },
  { perm: "하자 접수·처리, 하자 통계 리포트", super: false, dev: false, con: true, cs: false },
  { perm: "사전점검, 이사관리, 차량·입주증, CS·민원", super: false, dev: false, con: false, cs: true },
];

const getRoleBadge = (role: string) => {
  if (role === "super_admin") return "bg-destructive/10 text-destructive";
  if (role === "developer") return "bg-primary/10 text-primary";
  if (role === "contractor") return "bg-warning/10 text-warning";
  if (role === "cs_center") return "bg-success/10 text-success";
  return "bg-muted text-muted-foreground";
};

const getRoleLabel = (role: string) => roleOptions.find(r => r.value === role)?.label || role;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Accounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editUserId, setEditUserId] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPasswordConfirm, setFormPasswordConfirm] = useState("");
  const [formRole, setFormRole] = useState("super_admin");
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteAccount, setDeleteAccount] = useState<any>(null);

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
    return { ...p, role: roles[0]?.role || "—", isSelf: p.user_id === user?.id };
  });

  const filtered = accountData.filter((a: any) => !search || a.name.includes(search) || (a.email || "").includes(search));

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormPhone("");
    setFormPassword(""); setFormPasswordConfirm(""); setFormRole("super_admin");
    setEditMode(false); setEditUserId("");
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (account: any) => {
    setEditMode(true);
    setEditUserId(account.user_id);
    setFormName(account.name);
    setFormEmail(account.email);
    setFormPhone(account.phone || "");
    setFormRole(account.role !== "—" ? account.role : "super_admin");
    setFormPassword("");
    setFormPasswordConfirm("");
    setModalOpen(true);
  };

  // Validation
  const emailError = formEmail && !emailRegex.test(formEmail) ? "올바른 이메일 형식이 아닙니다." : "";
  const pwError = !editMode && formPassword && formPassword.length < 8 ? "비밀번호는 8자 이상이어야 합니다." :
    editMode && formPassword && formPassword.length > 0 && formPassword.length < 8 ? "비밀번호는 8자 이상이어야 합니다." : "";
  const pwMatchError = formPasswordConfirm && formPassword !== formPasswordConfirm ? "비밀번호가 일치하지 않습니다." : "";

  const canSave = editMode
    ? formName && !emailError && !pwError && !pwMatchError && (formPassword === "" || (formPassword.length >= 8 && formPassword === formPasswordConfirm))
    : formName && formEmail && formPassword && formPasswordConfirm && !emailError && !pwError && !pwMatchError;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editMode) {
        const { data, error } = await supabase.functions.invoke("manage-account", {
          body: {
            action: "update",
            user_id: editUserId,
            name: formName,
            phone: formPhone,
            role: formRole,
            ...(formPassword ? { password: formPassword } : {}),
          },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        toast.success("계정이 수정되었습니다.");
      } else {
        const { data, error } = await supabase.functions.invoke("manage-account", {
          body: {
            action: "create",
            email: formEmail,
            password: formPassword,
            name: formName,
            phone: formPhone,
            role: formRole,
          },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        toast.success("계정이 등록되었습니다.");
      }
      setModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user_roles_all"] });
    } catch (err: any) {
      toast.error(err.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAccount) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-account", {
        body: { action: "delete", user_id: deleteAccount.user_id },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast.success("계정이 삭제되었습니다.");
      setDeleteAccount(null);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["user_roles_all"] });
    } catch (err: any) {
      toast.error(err.message || "삭제 중 오류가 발생했습니다.");
    }
  };

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
        <button className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={openAdd}><Plus className="w-4 h-4" /> 계정 추가</button>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto mb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>이름</th><th>이메일</th><th>연락처</th><th>권한</th><th>가입일</th><th className="text-center">관리</th></tr></thead>
            <tbody>
              {filtered.map((a: any) => (
                <tr key={a.id}>
                  <td className="font-medium">{a.name} {a.isSelf && <span className="text-xs text-muted-foreground">(본인)</span>}</td>
                  <td>{a.email}</td>
                  <td>{a.phone || "—"}</td>
                  <td><span className={`status-badge ${getRoleBadge(a.role)}`}>{getRoleLabel(a.role)}</span></td>
                  <td>{new Date(a.created_at).toLocaleDateString("ko-KR")}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(a)} title="수정">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {a.isSelf ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-30 cursor-not-allowed" disabled>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>본인 계정은 삭제할 수 없습니다.</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteAccount(a)} title="삭제">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Role permissions table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">권한 등급 안내</h2>
        </div>
        <table className="data-table">
          <thead><tr><th>권한</th><th>총관리자</th><th>시행사</th><th>시공사</th><th>입주지원센터</th></tr></thead>
          <tbody>
            {rolePermissions.map((r, i) => (
              <tr key={i}>
                <td className="text-xs">{r.perm}</td>
                <td className="text-center">{r.super ? <span className="text-success">✔</span> : "—"}</td>
                <td className="text-center">{r.dev ? <span className="text-success">✔</span> : "—"}</td>
                <td className="text-center">{r.con ? <span className="text-success">✔</span> : "—"}</td>
                <td className="text-center">{r.cs ? <span className="text-success">✔</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(v) => { if (!v) resetForm(); setModalOpen(v); }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>{editMode ? "계정 수정" : "계정 추가"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">이름 <span className="text-destructive">*</span></label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="담당자 이름" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">이메일 <span className="text-destructive">*</span></label>
              <Input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="example@email.com" disabled={editMode} className={editMode ? "bg-muted cursor-not-allowed" : ""} />
              {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">연락처</label>
              <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="010-0000-0000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                비밀번호 {!editMode && <span className="text-destructive">*</span>}
              </label>
              <Input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder={editMode ? "변경 시에만 입력하세요" : "8자 이상 입력"} />
              {pwError && <p className="text-xs text-destructive mt-1">{pwError}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                비밀번호 확인 {!editMode && <span className="text-destructive">*</span>}
              </label>
              <Input type="password" value={formPasswordConfirm} onChange={e => setFormPasswordConfirm(e.target.value)} placeholder="비밀번호 재입력" />
              {pwMatchError && <p className="text-xs text-destructive mt-1">{pwMatchError}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">역할 <span className="text-destructive">*</span></label>
              <Select value={formRole} onValueChange={setFormRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formRole && (
                <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded px-2 py-1">
                  접근 가능: {roleMenuAccess[formRole]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>취소</Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editMode ? "저장" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteAccount} onOpenChange={(v) => { if (!v) setDeleteAccount(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteAccount?.name} 계정을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>삭제된 계정은 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Accounts;
