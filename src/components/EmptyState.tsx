import { LucideIcon, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="w-12 h-12 text-muted-foreground/50 mb-4" />
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/70 mb-4">{subtitle}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

export function SearchEmpty({ query, onReset }: { query?: string; onReset?: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      title="검색 결과가 없습니다"
      subtitle={query ? `'${query}'에 대한 결과를 찾을 수 없습니다` : undefined}
      actionLabel={onReset ? "필터 초기화" : undefined}
      onAction={onReset}
    />
  );
}
