import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => {
      setOnline(true);
      setShowRecovered(true);
      setTimeout(() => setShowRecovered(false), 2000);
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (online && !showRecovered) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-sm text-center font-medium transition-colors ${online ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"}`}>
      <div className="flex items-center justify-center gap-2">
        {online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        {online ? "연결이 복구되었습니다." : "인터넷 연결이 끊겼습니다. 연결을 확인해주세요."}
      </div>
    </div>
  );
}
