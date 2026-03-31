import { useState } from "react";
import { Send, Paperclip } from "lucide-react";

const chatList = [
  { name: "홍길동", unit: "101동 0101호", status: "미처리", content: "잔금 납부 계좌번호가 어디 있나요?", time: "11:32" },
  { name: "김철수", unit: "101동 0102", status: "처리중", content: "QR코드가 안 열려요", time: "11:15" },
  { name: "이영희", unit: "102동 0201", status: "완료", content: "이사날짜 변경 가능한가요?", time: "11:32" },
  { name: "박민준", unit: "102동 0302", status: "미처리", content: "하자 사진 다시 올려도 되나요", time: "10:22" },
  { name: "최수연", unit: "103동 1503", status: "처리중", content: "입주증이 안 나와요", time: "09:58" },
  { name: "정우성", unit: "103동 0804", status: "완료", content: "주차 등록은 어디서 하나요", time: "09:30" },
];

const getStatusColor = (status: string) => {
  if (status === "미처리") return "status-error";
  if (status === "처리중") return "status-pending";
  return "status-complete";
};

const messages = [
  { from: "resident", text: "잔금 납부 계좌번호가 어디 있나요?", time: "11:32" },
  { from: "admin", text: "앱 하단 [납부내역] 탭에서 확인하실 수 있습니다. 혹시 앱 접속에 문제가 있으신가요?", time: "11:33" },
  { from: "resident", text: "아 네 감사합니다. 찾았습니다!", time: "11:35" },
];

const CSChat = () => {
  const [selectedChat, setSelectedChat] = useState(0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">CS 채팅 상담</h1>
        <p className="page-description">인앱 텍스트 상담 · 세대별 민원 이력 · AI FAQ 자동응답 설정</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
        {/* Chat List */}
        <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold">상담 목록</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatList.map((chat, i) => (
              <div key={i}
                onClick={() => setSelectedChat(i)}
                className={`px-4 py-3 border-b border-border cursor-pointer transition-colors ${selectedChat === i ? "bg-accent" : "hover:bg-accent/50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{chat.name}</span>
                    <span className="text-xs text-muted-foreground">{chat.unit}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate mr-2">{chat.content}</p>
                  <span className={`status-badge ${getStatusColor(chat.status)} shrink-0`}>{chat.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">{chatList[selectedChat].name[0]}</span>
            </div>
            <div>
              <div className="text-sm font-medium">{chatList[selectedChat].name}</div>
              <div className="text-xs text-muted-foreground">{chatList[selectedChat].unit}</div>
            </div>
            <span className={`status-badge ${getStatusColor(chatList[selectedChat].status)} ml-auto`}>{chatList[selectedChat].status}</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                  msg.from === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}>
                  <p>{msg.text}</p>
                  <div className={`text-xs mt-1 ${msg.from === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{msg.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-border flex items-center gap-2">
            <input type="text" placeholder="메시지 입력..." className="flex-1 px-3 py-2 border border-border rounded-md text-sm bg-background" />
            <button className="p-2 text-muted-foreground hover:text-foreground"><Paperclip className="w-4 h-4" /></button>
            <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md flex items-center gap-1"><Send className="w-4 h-4" /> 전 송</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSChat;
