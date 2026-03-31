import { useState } from "react";
import { Plus, Search, Pin, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const initialNoticeData = [
  { id: 5, title: "[필독] 입주 일정 최종 안내", date: "03.30", views: "248회", status: "공개", pinned: true },
  { id: 4, title: "사전점검 예약 안내", date: "03.28", views: "301회", status: "공개", pinned: false },
  { id: 3, title: "잔금 납부 계좌 안내", date: "03.25", views: "289회", status: "공개", pinned: false },
  { id: 2, title: "층간소음 동의서 서명", date: "03.20", views: "244회", status: "공개", pinned: false },
  { id: 1, title: "이사 차량 사전 등록 안내", date: "03.15", views: "178회", status: "공개", pinned: false },
];

const Announcements = () => {
  const [search, setSearch] = useState("");
  const [noticeData, setNoticeData] = useState(initialNoticeData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const filtered = noticeData.filter(n => !search || n.title.includes(search));

  const handleDelete = (id: number) => {
    setNoticeData(prev => prev.filter(n => n.id !== id));
    setDeleteConfirmId(null);
    toast.success("공지가 삭제되었습니다.");
  };

  const handleSave = () => {
    toast.success("공지가 저장 및 공개되었습니다.");
  };

  const handlePin = (id: number) => {
    setNoticeData(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    toast.success("상단 고정이 변경되었습니다.");
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">공지사항 관리</h1>
        <p className="page-description">앱 내 공지 등록·수정·삭제 · 상단 고정 · 열람 수 확인</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notice List */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-border rounded-md bg-card">
              <input type="text" placeholder="공지 제목 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
              <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
            </div>
            <select className="px-3 py-2 border border-border rounded-md text-sm bg-card"><option>전체</option></select>
            <button className="ml-auto px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1"><Plus className="w-4 h-4" /> 공지 등록</button>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="data-table">
              <thead>
                <tr><th>번호</th><th>제목</th><th>등록일</th><th>열람수</th><th>상태</th><th>관리</th></tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} className="cursor-pointer hover:bg-accent/50">
                    <td>{n.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {n.pinned && <Pin className="w-3 h-3 text-warning shrink-0" />}
                        <span className="font-medium">{n.title}</span>
                      </div>
                    </td>
                    <td>{n.date}</td>
                    <td className="flex items-center gap-1"><Eye className="w-3 h-3" /> {n.views}</td>
                    <td><span className="status-badge status-complete">{n.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="text-warning text-sm hover:underline" onClick={() => handlePin(n.id)}>{n.pinned ? "고정해제" : "고정"}</button>
                        <button className="text-primary text-sm hover:underline" onClick={() => toast.info("수정 모드로 전환되었습니다.")}>수정</button>
                        <button className="text-destructive text-sm hover:underline" onClick={() => setDeleteConfirmId(n.id)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-3 p-3 bg-accent rounded-lg text-sm text-muted-foreground">
            📌 상단 고정된 공지는 입주자 앱 공지사항 목록 최상단에 항상 표시됩니다. 최대 3개까지 고정 가능.
          </div>
        </div>

        {/* Notice Detail / Editor */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">공지 등록</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">제목</label>
              <input type="text" className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">카테고리</label>
              <select className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
                <option>일반</option><option>긴급</option><option>일정</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">상단고정</label>
              <div className="flex items-center gap-2"><input type="checkbox" className="rounded" /><span className="text-sm">고정 (ON)</span></div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">공개설정</label>
              <div className="flex gap-2 flex-wrap">
                {["전체 공개", "특정 동만", "미납 세대만"].map(opt => (
                  <button key={opt} className="px-3 py-1.5 text-xs border border-border rounded-md bg-background hover:bg-accent">{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">내 용</label>
              <textarea rows={6} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background resize-none"
                defaultValue="안녕하세요. 입주 최종 일정을 안내드립니다.

■ 사전점검: 4월 1일~5일
■ 이사 기간: 4월 10일~30일
■ 입주지원센터 운영: 09:00~17:00" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">첨부파일</label>
              <input type="text" placeholder="📎 파일 선택" className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" readOnly />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => toast.info("미리보기")}>미리보기</button>
              <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={handleSave}>저장 및 공개</button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>공지 삭제</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">이 공지를 정말 삭제하시겠습니까?</p>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setDeleteConfirmId(null)}>취소</button>
            <button className="flex-1 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>삭제</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
