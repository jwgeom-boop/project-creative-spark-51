import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  siteId: string | null;
}

const NoticeQuickModal = ({ open, onOpenChange, siteId }: Props) => {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("전체 세대");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim()) { toast.error("제목을 입력해주세요"); return; }
    if (!content.trim()) { toast.error("내용을 입력해주세요"); return; }
    setSending(true);
    const { error } = await supabase.from("notices").insert({
      title,
      content,
      site_id: siteId,
      status: "발송완료",
      target_type: target,
      send_method: "앱 푸시",
      target_count: 300,
      read_rate: 0,
    } as any);
    setSending(false);
    if (error) { toast.error(`발송 실패: ${error.message}`); return; }
    toast.success("안내문이 발송되었습니다");
    setTitle(""); setContent(""); setTarget("전체 세대");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>안내문 빠른 발송</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="공지 제목을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} />
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="전체 세대">전체 세대</SelectItem>
              <SelectItem value="미납 세대">미납 세대</SelectItem>
              <SelectItem value="미예약 세대">미예약 세대</SelectItem>
            </SelectContent>
          </Select>
          <Textarea rows={4} placeholder="내용을 입력하세요" value={content} onChange={e => setContent(e.target.value)} />
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>취소</Button>
          <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700" onClick={handleSend} disabled={sending}>
            {sending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}발송하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoticeQuickModal;
