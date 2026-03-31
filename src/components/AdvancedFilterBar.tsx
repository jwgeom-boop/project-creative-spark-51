import { useState } from "react";
import { Search, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

export interface FilterConfig {
  searchPlaceholder?: string;
  dongOptions?: string[];
  statusOptions?: { label: string; value: string }[];
  statusLabel?: string;
  showDateRange?: boolean;
}

export interface FilterValues {
  search: string;
  dong: string;
  status: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface Props {
  config: FilterConfig;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}

export function applyCommonFilters<T extends Record<string, any>>(
  data: T[],
  filters: FilterValues,
  opts: {
    searchFields: (keyof T)[];
    statusField: keyof T;
    dongField?: keyof T;
    dateField?: keyof T;
  }
): T[] {
  return data.filter((item) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match = opts.searchFields.some((f) =>
        String(item[f] ?? "").toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    if (filters.dong && filters.dong !== "전체") {
      const dongVal = opts.dongField ? String(item[opts.dongField] ?? "") : "";
      if (!dongVal.includes(filters.dong)) return false;
    }
    if (filters.status && filters.status !== "전체") {
      const sv = String(item[opts.statusField] ?? "");
      if (filters.status === "미처리") {
        if (sv === "완료") return false;
      } else if (!sv.includes(filters.status)) return false;
    }
    if (opts.dateField && (filters.dateFrom || filters.dateTo)) {
      const raw = item[opts.dateField];
      if (raw) {
        const d = new Date(raw as string);
        if (filters.dateFrom && d < filters.dateFrom) return false;
        if (filters.dateTo) {
          const end = new Date(filters.dateTo);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }
    }
    return true;
  });
}

export default function AdvancedFilterBar({ config, values, onChange }: Props) {
  const update = (partial: Partial<FilterValues>) => onChange({ ...values, ...partial });
  const hasActive = values.search || values.dong !== "전체" || values.status !== "전체" || values.dateFrom || values.dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex items-center border border-border rounded-md bg-card">
        <input
          type="text"
          placeholder={config.searchPlaceholder || "검색"}
          value={values.search}
          onChange={(e) => update({ search: e.target.value })}
          className="px-3 py-2 text-sm bg-transparent outline-none w-40"
        />
        <span className="px-2 text-muted-foreground"><Search className="w-4 h-4" /></span>
      </div>

      {config.dongOptions && config.dongOptions.length > 0 && (
        <select
          className="px-3 py-2 border border-border rounded-md text-sm bg-card"
          value={values.dong}
          onChange={(e) => update({ dong: e.target.value })}
        >
          <option value="전체">동: 전체</option>
          {config.dongOptions.map((d) => (
            <option key={d} value={d}>{d}동</option>
          ))}
        </select>
      )}

      {config.statusOptions && (
        <select
          className="px-3 py-2 border border-border rounded-md text-sm bg-card"
          value={values.status}
          onChange={(e) => update({ status: e.target.value })}
        >
          {config.statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{config.statusLabel || "상태"}: {o.label}</option>
          ))}
        </select>
      )}

      {config.showDateRange && (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-sm gap-1", !values.dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {values.dateFrom ? format(values.dateFrom, "yy.MM.dd", { locale: ko }) : "시작일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={values.dateFrom} onSelect={(d) => update({ dateFrom: d || undefined })} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">~</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-sm gap-1", !values.dateTo && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {values.dateTo ? format(values.dateTo, "yy.MM.dd", { locale: ko }) : "종료일"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={values.dateTo} onSelect={(d) => update({ dateTo: d || undefined })} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </>
      )}

      {hasActive && (
        <button
          className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          onClick={() => onChange({ search: "", dong: "전체", status: "전체", dateFrom: undefined, dateTo: undefined })}
        >
          <X className="w-3 h-3" /> 초기화
        </button>
      )}
    </div>
  );
}
