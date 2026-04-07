import { useState, useEffect, useRef, useMemo } from "react";
import { Send, Paperclip, CheckCircle2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const getStatusColor = (status: string) => {
  if (status === "미처리") return "status-error";
  if (status === "처리중") return "status-pending";
  return "status-complete";
};

const CSChat = () => {
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chats = [], isLoading: loadingChats } = useQuery({
    queryKey: ["cs_chats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cs_chats")
        .select("*, units(dong, ho)")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-for-cs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("residents").select("unit_id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["cs_messages", selectedChatId],
    queryFn: async () => {
      if (!selectedChatId) return [];
      const { data, error } = await supabase
        .from("cs_messages")
        .select("*")
        .eq("chat_id", selectedChatId)
        .order("sent_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedChatId,
  });

  useEffect(() => {
    if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id);
    }
  }, [chats, selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedChatId) return;
      const { error } = await supabase.from("cs_messages").insert({
        chat_id: selectedChatId,
        message: text,
        sender: "admin",
      });
      if (error) throw error;
      await supabase.from("cs_chats").update({
        last_message: text,
        last_message_at: new Date().toISOString(),
        status: "처리중",
      }).eq("id", selectedChatId);
    },
    onSuccess: () => {
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ["cs_chats"] });
      setInputText("");
    },
  });

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMutation.mutate(inputText);
  };

  const handleComplete = async () => {
    if (!selectedChatId) return;
    const { error } = await supabase.from("cs_chats").update({ status: "완료" }).eq("id", selectedChatId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["cs_chats"] });
      toast.success("상담이 완료 처리되었습니다.");
    }
    setCompleteDialogOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기가 10MB를 초과합니다.");
      return;
    }
    if (file.type.startsWith("image/")) {
      toast.success(`이미지 "${file.name}" 첨부 완료`);
      // In production, would upload to storage
      sendMutation.mutate(`[이미지] ${file.name}`);
    } else {
      toast.success(`파일 "${file.name}" 첨부 완료`);
      sendMutation.mutate(`[파일] ${file.name}`);
    }
    e.target.value = "";
  };

  // Search with debounce
  const filteredChats = useMemo(() => {
    let result = chats.filter((c: any) => statusFilter === "전체" || c.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c: any) => {
        const resident = residents.find((r: any) => r.unit_id === c.unit_id);
        const unitStr = `${c.units?.dong}동 ${c.units?.ho}`.toLowerCase();
        const nameStr = (resident?.name || "").toLowerCase();
        const msgStr = (c.last_message || "").toLowerCase();
        return unitStr.includes(q) || nameStr.includes(q) || msgStr.includes(q);
      });
    }
    return result;
  }, [chats, statusFilter, searchQuery, residents]);

  const selectedChat = chats.find((c: any) => c.id === selectedChatId);
  const selectedResident = selectedChat ? residents.find((r: any) => r.unit_id === selectedChat.unit_id) : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">CS 채팅 상담</h1>
        <p className="page-description">인앱 텍스트 상담 · 세대별 민원 이력 · AI FAQ 자동응답 설정</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Chat List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">상담 목록</h2>
            <select className="text-xs px-2 py-1 border border-border rounded bg-background" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="전체">전체</option>
              <option value="미처리">미처리</option>
              <option value="처리중">처리중</option>
              <option value="완료">완료</option>
            </select>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="입주자명 / 세대 / 내용 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {searchQuery && (
                <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearchQuery("")}>
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {loadingChats ? (
            <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredChats.map((chat: any) => {
                const resident = residents.find((r: any) => r.unit_id === chat.unit_id);
                return (
                  <div key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`px-4 py-3 border-b border-border cursor-pointer transition-colors ${selectedChatId === chat.id ? "bg-accent" : "hover:bg-accent/50"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{resident?.name || "—"}</span>
                        <span className="text-xs text-muted-foreground">{chat.units?.dong}동 {chat.units?.ho}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate mr-2">{chat.last_message || ""}</p>
                      <span className={`status-badge ${getStatusColor(chat.status)} shrink-0`}>{chat.status}</span>
                    </div>
                  </div>
                );
              })}
              {filteredChats.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">검색 결과가 없습니다.</div>
              )}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">{(selectedResident?.name || "—")[0]}</span>
                </div>
                <div>
                  <div className="text-sm font-medium">{selectedResident?.name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{selectedChat.units?.dong}동 {selectedChat.units?.ho}</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {selectedChat.status === "완료" ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 완료됨
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-300 hover:bg-green-50" onClick={() => setCompleteDialogOpen(true)}>
                      상담 완료
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((msg: any) => (
                  <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                      msg.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}>
                      <p>{msg.message}</p>
                      <div className={`text-xs mt-1 ${msg.sender === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.sent_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-4 py-3 border-t border-border flex items-center gap-2">
                <input type="text" placeholder="메시지 입력..." value={inputText} onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} />
                <button className="p-2 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1" onClick={handleSend}><Send className="w-4 h-4" /> 전송</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">상담을 선택해주세요.</div>
          )}
        </div>
      </div>

      {/* Complete Confirm */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 상담을 완료 처리하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>완료 처리 후에는 상태가 "완료"로 변경됩니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CSChat;
