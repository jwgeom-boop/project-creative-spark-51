import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export default function TablePagination({ currentPage, totalItems, pageSize = 20, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <span className="text-sm text-muted-foreground">
        총 {totalItems}건 중 {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)}건
      </span>
      <div className="flex items-center gap-1">
        <button
          className="p-1.5 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-2 text-sm text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              className={`min-w-[32px] h-8 rounded-md text-sm ${p === currentPage ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-accent"}`}
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="p-1.5 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function paginate<T>(data: T[], page: number, pageSize = 20): T[] {
  return data.slice((page - 1) * pageSize, page * pageSize);
}
