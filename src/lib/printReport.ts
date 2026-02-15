export interface PrintOptions {
  title: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  htmlContent: string;
}

export function printReport({
  title,
  subtitle,
  orientation = 'landscape',
  htmlContent
}: PrintOptions): void {
  const printWindow = window.open('', '_blank', 'width=1100,height=700');
  if (!printWindow) return;

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @page { size: ${orientation}; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 16px; color: #222; }
    .report-header { margin-bottom: 16px; border-bottom: 2px solid #222; padding-bottom: 8px; }
    .report-header h1 { font-size: 16px; margin: 0 0 2px; font-weight: 700; }
    .report-header p { font-size: 10px; color: #555; margin: 2px 0 0; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 16px; }
    th { background: #f3f4f6; font-weight: 600; text-align: left;
         padding: 5px 8px; border: 1px solid #d1d5db; text-transform: uppercase;
         font-size: 8px; letter-spacing: 0.3px; color: #374151; }
    td { padding: 4px 8px; border: 1px solid #e5e7eb; color: #333; }
    tr:nth-child(even) td { background: #f9fafb; }
    .section-title { font-size: 12px; font-weight: 600; margin: 20px 0 6px;
                     padding-bottom: 4px; border-bottom: 1px solid #d1d5db; color: #111; }
    .machine-header { background: #f3f4f6; padding: 10px 12px; border-radius: 4px;
                      margin-bottom: 16px; font-size: 10px; }
    .machine-header strong { font-size: 13px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ''}
    <p>Printed on ${today}</p>
  </div>
  ${htmlContent}
</body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
