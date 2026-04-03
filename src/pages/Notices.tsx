import { useState } from "react";
import { Send, FileText, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const templates = [
  "잔금 납부 안내", "동의서 서명 요청", "사전점검 일정", "하자보수 일정 안내", "이사 차량 등록", "공지 — 엘리베이터"
];

const defaultContent = `안녕하세요, {{입주자명}} 세대주님.\n\n잔금 납부 기한이 2026년 4월 7일(화)로 다가왔습니다.\n\n납부 계좌 및 금액은 앱 내 납부 내역에서 확인하시기 바랍니다.\n\n문의: 입주지원센터 02-1234-5678`;

const Notices = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("잔금 납부 기한 안내");
  const [content, setContent] = useState(defaultContent);
  const [targetType, setTargetType] = useState("전체 세대");
  const [sendMethod, setSendMethod] = useState("앱 푸시 (권장)");
  const [scheduledAt, setScheduledAt] = useState("2026-04-01T09:00");
  const [isImmediate, setIsImmediate] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("sent_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTargetType("전체 세대");
    setSendMethod("앱 푸시 (권장)");
    setScheduledAt("");
    setIsImmediate(false);
  };

  const handleSend = async () => {
    if (!title.trim()) { toast.error("제목을 입력해주세요"); return; }
    if (!content.trim()) { toast.error("내용을 입력해주세요"); return; }
    if (!isImmediate && !scheduledAt) { toast.error("발송 예정 시간을 선택해주세요"); return; }

    setIsSending(true);
    const { data: site } = await supabase.from("sites").select("id").limit(1).single();
    if (!site) { toast.error("현장 정보가 없습니다."); setIsSending(false); return; }

    const useSchedule = !isImmediate && scheduledAt;

    const { error } = await supabase.from("notices").insert({
      title,
      content,
      site_id: site.id,
      status: useSchedule ? "예약발송" : "발송완료",
      target_count: 300,
      read_rate: 0,
    } as any);

    setIsSending(false);
    if (error) { toast.error(`발송 실패: ${error.message}`); return; }
    toast.success(useSchedule ? "공지사항이 예약 등록되었습니다." : "공지사항이 등록되었습니다.");
    resetForm();
    queryClient.invalidateQueries({ queryKey: ["notices"] });
  };

  const statusBadge = (status: string) => {
    if (status === "발송완료") return "bg-green-50 text-green-600";
    if (status === "예약발송") return "bg-blue-50 text-blue-600";
    if (status === "발송실패") return "bg-red-50 text-red-500";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">안내문 발송</h1>
        <p className="page-description">우편·문자 대체 — 앱 푸시로 세대별 안내문 발송 · 템플릿 관리 · 이력 확인</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Notice Form */}
        <div className="bg-card rounded-lg border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">새 안내문 발송</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0">제 목</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" placeholder="공지 제목을 입력하세요" />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0">발송 대상</label>
              <div className="flex gap-2 flex-wrap">
                {["전체 세대", "특정 동", "미납 세대", "미예약 세대", "사용자 정의"].map(t => (
                  <button key={t} onClick={() => setTargetType(t)}
                    className={`px-3 py-1.5 text-xs rounded-md border ${targetType === t ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0">발송 방식</label>
              <div className="flex gap-2">
                {["앱 푸시 (권장)", "문자(SMS)", "앱+문자"].map(m => (
                  <button key={m} onClick={() => setSendMethod(m)}
                    className={`px-3 py-1.5 text-xs rounded-md border ${sendMethod === m ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0">예약 발송</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => { setScheduledAt(e.target.value); setIsImmediate(false); }} className="px-3 py-2 border border-border rounded-md text-sm bg-background" />
              <button className={`px-3 py-1.5 text-xs border rounded-md ${isImmediate ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`} onClick={() => setIsImmediate(true)}>즉시발송</button>
            </div>

            <div className="flex gap-3">
              <label className="text-sm font-medium w-20 shrink-0 pt-2">내 용</label>
              <textarea rows={6} value={content} onChange={e => setContent(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background resize-none" placeholder="안내문 내용을 입력하세요" />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-20 shrink-0">첨부파일</label>
              <div className="flex-1 flex items-center gap-2">
                <input type="text" placeholder="📎 파일 선택 (PDF, 이미지)" className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" readOnly />
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1"><Upload className="w-4 h-4" /> 업로드</button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="px-4 py-2 text-sm border border-border rounded-md bg-card">미리보기</button>
              <button className="px-4 py-2 text-sm border border-border rounded-md bg-card">임시저장</button>
              <button
                className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center justify-center gap-1"
                disabled={isSending}
                onClick={handleSend}
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isSending ? "발송 중..." : "발 송"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Send History */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">발송 이력</h2>
              <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md">템플릿 관리</button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">발송 이력이 없습니다.</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>제목</th><th>발송대상</th><th>발송방식</th><th>상태</th><th>발송일시</th></tr></thead>
                <tbody>
                  {notices.map((h: any) => (
                    <tr key={h.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedNotice(h)}>
                      <td className="text-primary font-medium">{h.title}</td>
                      <td>{h.target_count}세대</td>
                      <td>{(h as any).send_method || "앱 푸시"}</td>
                      <td><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusBadge(h.status)}`}>{h.status}</span></td>
                      <td>{new Date(h.sent_date).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Templates */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold mb-3">자주 쓰는 템플릿</h2>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(t => (
                <button key={t} className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md bg-background hover:bg-accent text-left"
                  onClick={() => setTitle(t)}>
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" /> {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notice Detail Modal */}
      <Dialog open={!!selectedNotice} onOpenChange={(open) => { if (!open) setSelectedNotice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selectedNotice?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>발송일시</span>
              <span className="text-foreground">{selectedNotice ? new Date(selectedNotice.sent_date).toLocaleString("ko-KR") : ""}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>발송대상</span>
              <span className="text-foreground">{(selectedNotice as any)?.target_type || "전체 세대"} · {selectedNotice?.target_count}세대</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>발송방식</span>
              <span className="text-foreground">{(selectedNotice as any)?.send_method || "앱 푸시"}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>상태</span>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusBadge(selectedNotice?.status || "")}`}>{selectedNotice?.status}</span>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-muted-foreground mb-1">내용</p>
              <p className="whitespace-pre-wrap text-foreground bg-muted/50 rounded-md p-3 text-xs leading-relaxed">{selectedNotice?.content || "내용 없음"}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notices;
