import * as XLSX from "xlsx";

export function exportToExcel(
  data: Record<string, string | number>[],
  headers: { key: string; label: string }[],
  filename: string
) {
  const rows = data.map((row) =>
    headers.reduce((acc, h) => {
      acc[h.label] = row[h.key] ?? "";
      return acc;
    }, {} as Record<string, string | number>)
  );

  const ws = XLSX.utils.json_to_sheet(rows);
  // Auto column widths
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.label.length * 2, 12) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
