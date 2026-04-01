import { useState, useRef, useCallback } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export interface ColumnMapping {
  excelHeader: string;
  dbField: string;
  label: string;
  required?: boolean;
}

export interface ExcelUploadConfig {
  title: string;
  tableName: string;
  columns: { dbField: string; label: string; required?: boolean }[];
  /** Transform a mapped row before insert. Return null to skip. */
  transformRow?: (row: Record<string, any>) => Record<string, any> | null | Promise<Record<string, any> | null>;
  /** Query keys to invalidate after successful upload */
  invalidateKeys?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ExcelUploadConfig;
}

const ExcelUploadDialog = ({ open, onOpenChange, config }: Props) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sheetData, setSheetData] = useState<Record<string, any>[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "result">("upload");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });

  const reset = () => {
    setFile(null);
    setSheetData([]);
    setExcelHeaders([]);
    setMappings({});
    setStep("upload");
    setResult({ success: 0, failed: 0, errors: [] });
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleFile = useCallback((f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        if (json.length === 0) {
          toast.error("데이터가 없는 파일입니다.");
          return;
        }
        const headers = Object.keys(json[0]);
        setFile(f);
        setSheetData(json);
        setExcelHeaders(headers);

        // Auto-map by label match
        const autoMap: Record<string, string> = {};
        config.columns.forEach((col) => {
          const match = headers.find((h) => h.trim() === col.label || h.trim().toLowerCase() === col.dbField);
          if (match) autoMap[col.dbField] = match;
        });
        setMappings(autoMap);
        setStep("mapping");
      } catch {
        toast.error("파일을 읽을 수 없습니다. xlsx/xls 형식인지 확인해주세요.");
      }
    };
    reader.readAsArrayBuffer(f);
  }, [config.columns]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const requiredMissing = config.columns
    .filter((c) => c.required)
    .filter((c) => !mappings[c.dbField]);

  const mappedPreview = sheetData.slice(0, 5).map((row) => {
    const mapped: Record<string, any> = {};
    config.columns.forEach((col) => {
      const excelCol = mappings[col.dbField];
      mapped[col.label] = excelCol ? row[excelCol] ?? "" : "";
    });
    return mapped;
  });

  const handleUpload = async () => {
    setUploading(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    const rows: Record<string, any>[] = [];
    for (let i = 0; i < sheetData.length; i++) {
      const raw: Record<string, any> = {};
      config.columns.forEach((col) => {
        const excelCol = mappings[col.dbField];
        if (excelCol) raw[col.dbField] = sheetData[i][excelCol] ?? null;
      });

      try {
        const transformed = config.transformRow ? await config.transformRow(raw) : raw;
        if (transformed) rows.push(transformed);
        else errors.push(`행 ${i + 2}: 변환 실패 (스킵)`);
      } catch (e: any) {
        failed++;
        errors.push(`행 ${i + 2}: ${e.message}`);
      }
    }

    // Batch insert
    if (rows.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from(config.tableName as any).insert(batch as any);
        if (error) {
          failed += batch.length;
          errors.push(`배치 ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          success += batch.length;
        }
      }
    }

    setResult({ success, failed, errors });
    setStep("result");
    setUploading(false);

    if (config.invalidateKeys) {
      config.invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            {config.title}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">엑셀 파일을 드래그하거나 클릭하여 선택</p>
            <p className="text-xs text-muted-foreground">.xlsx, .xls 형식 지원</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{file?.name} — {sheetData.length}행 감지</span>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">컬럼 매핑</h3>
              {config.columns.map((col) => (
                <div key={col.dbField} className="flex items-center gap-3">
                  <span className="text-sm w-28 shrink-0">
                    {col.label} {col.required && <span className="text-destructive">*</span>}
                  </span>
                  <Select
                    value={mappings[col.dbField] || "__none__"}
                    onValueChange={(v) => setMappings((m) => ({ ...m, [col.dbField]: v === "__none__" ? "" : v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="엑셀 컬럼 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— 선택 안 함 —</SelectItem>
                      {excelHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {requiredMissing.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                필수 항목 미매핑: {requiredMissing.map((c) => c.label).join(", ")}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>취소</Button>
              <Button disabled={requiredMissing.length > 0} onClick={() => setStep("preview")}>
                미리보기
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">처음 5행 미리보기 (총 {sheetData.length}행)</p>
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    {config.columns.filter((c) => mappings[c.dbField]).map((c) => (
                      <th key={c.dbField}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappedPreview.map((row, i) => (
                    <tr key={i}>
                      {config.columns.filter((c) => mappings[c.dbField]).map((c) => (
                        <td key={c.dbField}>{String(row[c.label] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>뒤로</Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "업로드 중..." : `${sheetData.length}건 업로드`}
              </Button>
            </div>
          </div>
        )}

        {step === "result" && (
          <div className="space-y-4 text-center py-4">
            {result.failed === 0 ? (
              <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
            ) : (
              <AlertCircle className="w-12 h-12 mx-auto text-warning" />
            )}
            <div>
              <p className="text-lg font-semibold">업로드 완료</p>
              <p className="text-sm text-muted-foreground mt-1">
                성공: <span className="text-success font-medium">{result.success}건</span>
                {result.failed > 0 && <> · 실패: <span className="text-destructive font-medium">{result.failed}건</span></>}
              </p>
            </div>
            {result.errors.length > 0 && (
              <div className="text-left bg-muted rounded-lg p-3 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive">{e}</p>
                ))}
              </div>
            )}
            <Button onClick={() => handleClose(false)}>닫기</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExcelUploadDialog;
