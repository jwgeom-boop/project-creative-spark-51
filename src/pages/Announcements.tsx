import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Pin, Eye, Pencil, Trash2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TablePagination, { paginate } from "@/components/TablePagination";

type Announcement = {
  id: string;
  title: string;
  content: string | null;
  category: string | null;
  is_pinned: boolean | null;
  published_at: string;
  views: number | null;
  author: string | null;
  site_id: string;
};

const categoryColors: Record<string, string> = {
  "일반": "bg-muted text-muted-foreground",
  "긴급": "bg-destructive/10 text-destructive",
  "일정": "bg-primary/10 text-primary",
};

const Announcements = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Delete single
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Create form
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("일반");
  const [editPinned, setEditPinned] = useState(false);

  // Edit dialog
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [modTitle, setModTitle] = useState("");
  const [modContent, setModContent] = useState("");
  const [modCategory, setModCategory] = useState("일반");
  const [modPinned, setModPinned] = useState(false);
  const [urgentConfirmOpen, setUrgentConfirmOpen] = useState(false);

  // Detail dialog
  const [detailAnn, setDetailAnn] = useState<Announcement | null>(null);

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "전체": announcements.length, "일반": 0, "긴급": 0, "일정": 0 };
    announcements.forEach(a => { if (a.category && counts[a.category] !== undefined) counts[a.category]++; });
    return counts;
  }, [announcements]);

  // Filtered data
  const filtered = useMemo(() => {
    let result = announcements;
    if (categoryFilter !== "전체") result = result.filter(a => a.category === categoryFilter);
    if (search) result = result.filter(a => a.title.includes(search));
    return result;
  }, [announcements, categoryFilter, search]);

  const paged = paginate(filtered, page, pageSize);

  // Reset page on filter change
  const handleCategoryChange = (v: string) => { setCategoryFilter(v); setPage(1); setSelectedIds(new Set()); };
  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handlePageChange = (p: number) => { setPage(p); setSelectedIds(new Set()); };
  const handleResetFilters = () => { setSearch(""); setCategoryFilter("전체"); setPage(1); setSelectedIds(new Set()); };

  // Pinned count in selection
  const selectedPinnedCount = useMemo(() => {
    return announcements.filter(a => selectedIds.has(a.id) && a.is_pinned).length;
  }, [announcements, selectedIds]);

  // Mutations
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("announcements").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setBulkDeleteOpen(false);
      setSelectedIds(new Set());
      toast.success(`${ids.length}개 공지가 삭제되었습니다.`);
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
        title: editTitle, content: editContent, category: editCategory, is_pinned: editPinned,
        site_id: sites.id, author: "관리자",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("공지가 저장 및 공개되었습니다.");
      setEditTitle(""); setEditContent(""); setEditPinned(false); setEditCategory("일반");
    },
    onError: (e: Error) => toast.error("저장 실패: " + e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingAnn) return;
      const { error } = await supabase.from("announcements").update({
        title: modTitle, content: modContent, category: modCategory, is_pinned: modPinned,
      }).eq("id", editingAnn.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setEditingAnn(null);
      toast.success("공지가 수정되었습니다.");
    },
  });

  const openEditDialog = (ann: Announcement) => {
    setEditingAnn(ann);
    setModTitle(ann.title);
    setModContent(ann.content || "");
    setModCategory(ann.category || "일반");
    setModPinned(!!ann.is_pinned);
  };

  const handleSaveEdit = () => {
    if (modCategory === "긴급") {
      setUrgentConfirmOpen(true);
    } else {
      updateMutation.mutate();
    }
  };

  // Selection helpers
  const allPageSelected = paged.length > 0 && paged.every(a => selectedIds.has(a.id));
  const somePageSelected = paged.some(a => selectedIds.has(a.id)) && !allPageSelected;
  const headerCheckboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) {
      const input = el.querySelector("input") || el;
      if (input instanceof HTMLElement) {
        (input as any).indeterminate = somePageSelected;
      }
    }
  }, [somePageSelected]);

  const toggleAll = () => {
    if (allPageSelected) {
      const next = new Set(selectedIds);
      paged.forEach(a => next.delete(a.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paged.forEach(a => next.add(a.id));
      setSelectedIds(next);
    }
  };
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">공지사항 관리</h1>
        <p className="page-description">앱 내 공지 등록·수정·삭제 · 상단 고정 · 열람 수 확인</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Category tabs */}
          <div className="flex items-center border-b border-border mb-4">
            {(["전체", "일반", "긴급", "일정"] as const).map(c => {
              const active = categoryFilter === c;
              const isUrgent = c === "긴급";
              return (
                <button
                  key={c}
                  onClick={() => handleCategoryChange(c)}
                  className={`relative px-4 py-2.5 text-sm transition-colors ${active ? (isUrgent ? "text-destructive font-semibold" : "text-primary font-semibold") : "text-muted-foreground hover:text-foreground"}`}
                >
                  {c}
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${isUrgent ? (active ? "bg-destructive text-destructive-foreground" : "bg-destructive/10 text-destructive") : (active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}`}>
                    {categoryCounts[c] ?? 0}
                  </span>
                  {active && <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${isUrgent ? "bg-destructive" : "bg-primary"}`} />}
                </button>
              );
            })}
          </div>

          {/* Search + result count */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center border border-border rounded-md bg-card">
              <input type="text" placeholder="공지 제목 검색" value={search} onChange={e => handleSearchChange(e.target.value)} className="px-3 py-2 text-sm bg-transparent outline-none w-48" />
              <span className="px-3 py-2 text-muted-foreground"><Search className="w-4 h-4" /></span>
            </div>
            {(search || categoryFilter !== "전체") && (
              <button onClick={handleResetFilters} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" /> 필터 초기화
              </button>
            )}
            <span className="text-sm text-muted-foreground ml-auto">총 {filtered.length}건</span>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-3 p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
              <span className="text-sm font-medium">{selectedIds.size}개 선택됨</span>
              <button className="text-sm text-destructive hover:underline" onClick={() => setBulkDeleteOpen(true)}>선택 삭제</button>
              <button className="text-sm text-muted-foreground hover:underline" onClick={() => setSelectedIds(new Set())}>선택 해제</button>
            </div>
          )}

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10"><Checkbox ref={headerCheckboxRef} checked={allPageSelected} onCheckedChange={toggleAll} /></th>
                    <th>제목</th>
                    <th>카테고리</th>
                    <th>등록일</th>
                    <th>열람수</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(n => (
                    <tr key={n.id} className={`hover:bg-accent/50 ${selectedIds.has(n.id) ? "bg-primary/5" : ""}`}>
                      <td><Checkbox checked={selectedIds.has(n.id)} onCheckedChange={() => toggleOne(n.id)} /></td>
                      <td className="cursor-pointer" onClick={() => setDetailAnn(n)}>
                        <div className="flex items-center gap-2">
                          {n.is_pinned && <Pin className="w-3 h-3 text-warning shrink-0" />}
                          <span className="font-medium hover:underline">{n.title}</span>
                        </div>
                      </td>
                      <td><span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[n.category || "일반"] || categoryColors["일반"]}`}>{n.category || "일반"}</span></td>
                      <td>{new Date(n.published_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}</td>
                      <td><div className="flex items-center gap-1"><Eye className="w-3 h-3" /> {n.views ?? 0}회</div></td>
                      <td><span className="status-badge status-complete">공개</span></td>
                      <td>
                        <div className="flex gap-1.5">
                          <button className="p-1.5 rounded-md hover:bg-accent" title="수정" onClick={e => { e.stopPropagation(); openEditDialog(n); }}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button className="text-warning text-xs hover:underline px-1" onClick={e => { e.stopPropagation(); togglePinMutation.mutate({ id: n.id, pinned: !!n.is_pinned }); }}>{n.is_pinned ? "고정해제" : "고정"}</button>
                          <button className="p-1.5 rounded-md hover:bg-destructive/10" title="삭제" onClick={e => { e.stopPropagation(); setDeleteConfirmId(n.id); }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {Math.min((page - 1) * pageSize + 1, filtered.length)}-{Math.min(page * pageSize, filtered.length)} / 전체 {filtered.length}건
              </span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); setSelectedIds(new Set()); }} className="px-2 py-1 border border-border rounded text-sm bg-card">
                <option value={10}>10건</option><option value={20}>20건</option><option value={50}>50건</option>
              </select>
            </div>
            <TablePagination currentPage={page} totalItems={filtered.length} pageSize={pageSize} onPageChange={handlePageChange} />
          </div>

          <div className="mt-3 p-3 bg-accent rounded-lg text-sm text-muted-foreground">
            📌 상단 고정된 공지는 입주자 앱 공지사항 목록 최상단에 항상 표시됩니다. 최대 3개까지 고정 가능.
          </div>
        </div>

        {/* Create form */}
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
              <label className="text-sm font-medium text-muted-foreground mb-1 block">내용</label>
              <textarea rows={6} value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background resize-none" />
            </div>
            <button className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50" onClick={() => createMutation.mutate()} disabled={!editTitle}>저장 및 공개</button>
          </div>
        </div>
      </div>

      {/* Delete single confirm */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 공지를 정말 삭제하시겠습니까? 삭제된 공지는 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirm */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedIds.size}개의 공지를 삭제하면 복구할 수 없습니다.
              {selectedPinnedCount > 0 && (
                <span className="block mt-2 text-warning font-medium">
                  ⚠️ {selectedIds.size}개 중 {selectedPinnedCount}개는 상단 고정 공지입니다. 함께 삭제하시겠습니까?
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      <Dialog open={editingAnn !== null} onOpenChange={v => { if (!v) setEditingAnn(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>공지 수정</DialogTitle></DialogHeader>

          {modCategory === "긴급" && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm text-warning">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              긴급 공지는 수정 시 즉시 재발송됩니다.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">제목</label>
              <input type="text" value={modTitle} onChange={e => setModTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">카테고리</label>
              <select value={modCategory} onChange={e => setModCategory(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
                <option>일반</option><option>긴급</option><option>일정</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">상단고정</label>
              <div className="flex items-center gap-2"><input type="checkbox" checked={modPinned} onChange={e => setModPinned(e.target.checked)} className="rounded" /><span className="text-sm">고정 (ON)</span></div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">내용</label>
              <textarea rows={6} value={modContent} onChange={e => setModContent(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div>등록일: {editingAnn && new Date(editingAnn.published_at).toLocaleDateString("ko-KR")}</div>
              <div>열람수: {editingAnn?.views ?? 0}회</div>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-card" onClick={() => setEditingAnn(null)}>취소</button>
            <button className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md disabled:opacity-50" disabled={!modTitle} onClick={handleSaveEdit}>저장</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Urgent edit confirm */}
      <AlertDialog open={urgentConfirmOpen} onOpenChange={setUrgentConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>긴급 공지를 수정하고 재발송하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>수정된 내용이 즉시 입주민에게 재발송됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setUrgentConfirmOpen(false); updateMutation.mutate(); }}>수정 및 재발송</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail dialog */}
      <Dialog open={detailAnn !== null} onOpenChange={v => { if (!v) setDetailAnn(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[detailAnn?.category || "일반"]}`}>{detailAnn?.category || "일반"}</span>
              {detailAnn?.is_pinned && <Badge variant="outline" className="text-xs"><Pin className="w-3 h-3 mr-1" />고정</Badge>}
            </div>
            <DialogTitle className="text-lg">{detailAnn?.title}</DialogTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>등록일: {detailAnn && new Date(detailAnn.published_at).toLocaleDateString("ko-KR")}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{detailAnn?.views ?? 0}회</span>
            </div>
          </DialogHeader>
          <Separator />
          <div className="max-h-[400px] overflow-y-auto text-sm whitespace-pre-wrap leading-relaxed">
            {detailAnn?.content || "(내용 없음)"}
          </div>
          <Separator />
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm border border-border rounded-md bg-card hover:bg-accent" onClick={() => { if (detailAnn) { openEditDialog(detailAnn); setDetailAnn(null); } }}>수정</button>
            <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md" onClick={() => { if (detailAnn) { setDeleteConfirmId(detailAnn.id); setDetailAnn(null); } }}>삭제</button>
            <button className="ml-auto px-4 py-2 text-sm border border-border rounded-md bg-card hover:bg-accent" onClick={() => setDetailAnn(null)}>닫기</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Announcements;
