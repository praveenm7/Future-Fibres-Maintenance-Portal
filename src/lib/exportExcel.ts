import * as XLSX from 'xlsx';

export interface SheetConfig {
  name: string;
  headers: string[];
  rows: (string | number | boolean)[][];
  columnWidths?: number[];
}

export interface ExportOptions {
  filename: string;
  sheets: SheetConfig[];
}

export function exportToExcel({ filename, sheets }: ExportOptions): void {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const data = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(data);

    if (sheet.columnWidths) {
      ws['!cols'] = sheet.columnWidths.map(w => ({ wch: w }));
    } else {
      ws['!cols'] = sheet.headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...sheet.rows.map(r => String(r[i] ?? '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function formatDateForExport(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function getExportTimestamp(): string {
  return new Date().toISOString().slice(0, 10);
}
