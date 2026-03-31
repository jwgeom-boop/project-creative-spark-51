import { useState } from "react";
import { Plus, Search, Shield } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const initialAccountData = [
  { name: "홍길동 (본인)", phone: "010-1234-5678", role: "슈퍼관리자", site: "전체 현장", lastLogin: "오늘 08:45", status: "활성", self: true },
  { name: "김과장", phone: "010-9999-1111", role: "관리자", site: "101현장", lastLogin: "오늘 09:12", status: "활성", self: false },
  { name: "이대리", phone: "010-7777-2222", role: "일반", site: "101현장", lastLogin: "03.29", status: "활성", self: false },
  { name: "박주임", phone: "010-5555-3333", role: "일반", site: "102현장", lastLogin: "03.28", status: "활성", self: false },
  { name: "최인턴", phone: "010-3333-4444", role: "읽기전용", site: "101현장", lastLogin: "03.25", status: "비활성", self: false },
];

const rolePermissions = [
  { perm: "모든 현장 접근, 계정 관리, 설정 변경", super: true, admin: false, normal: false, readonly: false },
  { perm: "담당 현장 전체 기능, 계정 생성", super: false, admin: true, normal: false, readonly: false },
  { perm: "담당 현장 조회·처리, 설정 변경 불가", super: false, admin: false, normal: true, readonly: false },
  { perm: "조회만 가능, 수정·삭제·발송 불가", super: false, admin: false, normal: false, readonly: true },
];

const loginHistory = [
  { name: "홍길동", time: "04.01 08:45", ip: "192.168.1.1", browser: "Chrome / Windows", result: "성공" },
  { name: "김과장", time: "04.01 09:12", ip: "192.168.1.5", browser: "Chrome / Mac", result: "성공" },
  { name: "최인턴", time: "03.31 17:30", ip: "210.1.2.3", browser: "Safari / iPhone", result: "실패(3회)" },
];

const getRoleBadge = (role: string) => {
  if (role === "슈퍼관리자") return "bg-destructive/10 text-destructive";
  if (role === "관리자") return "bg-primary/10 text-primary";
  if (role === "일반") return "bg-success/10 text-success";
  return "bg-muted text-muted-foreground";
};

const Accounts = () => {
  const [search, setSearch] = useState("");
  const [accountData, setAccountData] = useState(initialAccountData);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = accountData.filter(a => !search || a.name.includes(search) || a.phone.includes(search));

  const handleAdd = () => {
    toast.success("계정이 추가되었습니다.");
    setAddOpen(false);
  };

  const handleDelete = (name: string) => {
    setAccountData(prev => prev.filter(a => a.name !== name));
    setDeleteTarget(null);
    toast.success(`${name} 계정이 삭제되었습니다.`);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">담당자 계정 관리</h1>
        <p className="page-description">계정 생성·수정·권한 설정 · 로그인 이력 · 현장별 접근 제어</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center border border-border rounded-md bg-card">
          <input type="text" placeholder="이름·연락처 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
          <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
        </div>
        <button className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> 계정 추가</button>
      </div>

      {/* Account Table */}
      <div className="bg-card rounded-lg border border-border overflow-x-auto mb-6">
        <table className="data-table">
          <thead>
            <tr><th>이름</th><th>연락처</th><th>권한</th><th>담당현장</th><th>최근로그인</th><th>상태</th><th>관리</th></tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i}>
                <td className="font-medium">{a.name}</td>
                <td>{a.phone}</td>
                <td><span className={`status-badge ${getRoleBadge(a.role)}`}>{a.role}</span></td>
                <td>{a.site}</td>
                <td>{a.lastLogin}</td>
                <td><span className={`status-badge ${a.status === "활성" ? "status-complete" : "status-error"}`}>{a.status}</span></td>
                <td>
                  <div className="flex gap-2">
                    <button className="text-primary text-sm hover:underline" onClick={() => toast.info("수정 모드로 전환되었습니다.")}>수정</button>
                    {!a.self && <button className="text-destructive text-sm hover:underline" onClick={() => setDeleteTarget(a.name)}>삭제</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Permissions */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">권한 등급 안내</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>권한</th><th>슈퍼관리자</th><th>관리자</th><th>일반</th><th>읽기전용</th></tr></thead>
            <tbody>
              {rolePermissions.map((r, i) => (
                <tr key={i}>
                  <td className="text-xs">{r.perm}</td>
                  <td className="text-center">{r.super ? <span className="text-success">✔</span> : "□"}</td>
                  <td className="text-center">{r.admin ? <span className="text-success">✔</span> : "□"}</td>
                  <td className="text-center">{r.normal ? <span className="text-success">✔</span> : "□"}</td>
                  <td className="text-center">{r.readonly ? <span className="text-success">✔</span> : "□"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Login History */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">최근 로그인 이력</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>계정</th><th>일시</th><th>IP주소</th><th>브라우저</th><th>결과</th></tr></thead>
            <tbody>
              {loginHistory.map((l, i) => (
                <tr key={i}>
                  <td className="font-medium">{l.name}</td>
                  <td>{l.time}</td>
                  <td className="text-xs">{l.ip}</td>
                  <td className="text-xs">{l.browser}</td>
                  <td><span className={`status-badge ${l.result === "성공" ? "status-complete" : "status-error"}`}>{l.result}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>계정 추가</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {[{ l: "이름", p: "이름 입력" }, { l: "연락처", p: "010-0000-0000" }, { l: "담당현장", p: "현장 선택" }].map(item => (
              <div key={item.l} className="flex items-center gap-3">
                <label className="text-sm font-medium w-20 shrink-0 text-muted-foreground">{item.l}</label>
                <input type="text" className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder={item.p} />
              </div>
            ))}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0 text-muted-foreground">권한</label>
              <select className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background">
                <option>관리자</option><option>일반</option><option>읽기전용</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setAddOpen(false)}>취소</button>
              <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={handleAdd}>추가</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>계정 삭제</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{deleteTarget} 계정을 정말 삭제하시겠습니까?</p>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setDeleteTarget(null)}>취소</button>
            <button className="flex-1 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md" onClick={() => deleteTarget && handleDelete(deleteTarget)}>삭제</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;
