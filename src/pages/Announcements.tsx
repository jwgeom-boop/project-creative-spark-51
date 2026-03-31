import { useState } from "react";
import { Plus, Search, Pin, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Announcements = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("일반");
  const [editPinned, setEditPinned] = useState(false);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteConfirmId(null);
      toast.success("공지가 삭제되었습니다.");
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("announcements").update({ is_pinned: !pinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("상단 고정이 변경되었습니다.");
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: sites } = await supabase.from("sites").select("id").limit(1).single();
      if (!sites) throw new Error("현장 없음");
      const { error } = await supabase.from("announcements").insert({
        title: editTitle,
        content: editContent,
        category: editCategory,
        is_pinned: editPinned,
        site_id: sites.id,
        author: "관리자",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("공지가 저장 및 공개되었습니다.");
      setEditTitle(""); setEditContent(""); setEditPinned(false);
    },
    onError: (e) => toast.error("저장 실패: " + e.message),
  });

  const filtered = announcements.filter(n => !search || n.title.includes(search));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">공지사항 관리</h1>
        <p className="page-description">앱 내 공지 등록·수정·삭제 · 상단 고정 · 열람 수 확인</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-border rounded-md bg-card">
              <input type="text" placeholder="공지 제목 검색" value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none" />
              <button className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></button>
            </div>
            <select className="px-3 py-2 border border-border rounded-md text-sm bg-card"><option>전체</option></select>
          </div>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>제목</th><th>등록일</th><th>열람수</th><th>상태</th><th>관리</th></tr></thead>
                <tbody>
                  {filtered.map(n => (
                    <tr key={n.id} className="cursor-pointer hover:bg-accent/50">
                      <td>
                        <div className="flex items-center gap-2">
                          {n.is_pinned && <Pin className="w-3 h-3 text-warning shrink-0" />}
                          <span className="font-medium">{n.title}</span>
                        </div>
                      </td>
                      <td>{new Date(n.published_at).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}</td>
                      <td className="flex items-center gap-1"><Eye className="w-3 h-3" /> {n.views}회</td>
                      <td><span className="status-badge status-complete">공개</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="text-warning text-sm hover:underline" onClick={() => togglePinMutation.mutate({ id: n.id, pinned: !!n.is_pinned })}>{n.is_pinned ? "고정해제" : "고정"}</button>
                          <button className="text-destructive text-sm hover:underline" onClick={() => setDeleteConfirmId(n.id)}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-3 p-3 bg-accent rounded-lg text-sm text-muted-foreground">
            📌 상단 고정된 공지는 입주자 앱 공지사항 목록 최상단에 항상 표시됩니다. 최대 3개까지 고정 가능.
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">공지 등록</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">제목</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">카테고리</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
                <option>일반</option><option>긴급</option><option>일정</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">상단고정</label>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editPinned} onChange={e => setEditPinned(e.target.checked)} className="rounded" /><span className="text-sm">고정 (ON)</span></div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">내 용</label>
              <textarea rows={6} value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background resize-none" />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md" onClick={() => createMutation.mutate()} disabled={!editTitle}>저장 및 공개</button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>공지 삭제</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">이 공지를 정말 삭제하시겠습니까?</p>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setDeleteConfirmId(null)}>취소</button>
            <button className="flex-1 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md" onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}>삭제</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
