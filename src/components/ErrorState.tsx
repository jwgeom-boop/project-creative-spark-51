import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = "데이터를 불러오지 못했습니다", onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <p className="text-sm font-medium text-foreground mb-1">{message}</p>
      <p className="text-xs text-muted-foreground mb-4">잠시 후 다시 시도해주세요.</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>다시 시도</Button>}
    </div>
  );
}
