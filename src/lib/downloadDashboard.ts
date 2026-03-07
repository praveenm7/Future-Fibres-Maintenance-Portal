// ============================================================
// Dashboard HTML Download — captures the live dashboard as a
// self-contained HTML file with embedded JS for proper sizing
// ============================================================

export interface DownloadDashboardOptions {
  title: string;
  subtitle?: string;
  contentEl: HTMLElement;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function downloadDashboard({ title, subtitle, contentEl }: DownloadDashboardOptions): void {
  const now = new Date();
  const generatedOn = now.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) + ' ' + now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  });

  const logoUrl = `${window.location.origin}/logo.jpg`;

  // 1. Clone the live DOM
  const clone = contentEl.cloneNode(true) as HTMLElement;

  // 2. Remove interactive-only elements and dialogs
  clone.querySelectorAll(
    '.no-print, [title="View fullscreen"], [role="dialog"], [data-radix-portal]'
  ).forEach(el => el.remove());

  // 3. Measure original rendered dimensions (before any modifications)
  const originalWidth = contentEl.offsetWidth;

  // 4. Walk the live DOM and clone, mapping each recharts chart with its actual pixel size
  //    For each chart: bake the SVG at its rendered size and let CSS handle scaling
  const liveWrappers = contentEl.querySelectorAll('.recharts-wrapper');
  const cloneWrappers = clone.querySelectorAll('.recharts-wrapper');
  liveWrappers.forEach((liveWrapper, i) => {
    const cloneWrapper = cloneWrappers[i] as HTMLElement | undefined;
    if (!cloneWrapper) return;
    const rect = liveWrapper.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    // Set wrapper to its exact rendered size
    cloneWrapper.style.cssText = `position:relative;width:${w}px;height:${h}px;`;
    // Fix the SVG — set viewBox and make it fill the wrapper
    const svg = cloneWrapper.querySelector('svg.recharts-surface');
    if (svg) {
      const svgW = svg.getAttribute('width') || String(w);
      const svgH = svg.getAttribute('height') || String(h);
      if (!svg.getAttribute('viewBox')) {
        svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
      }
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
    }
  });

  // 5. Fix responsive containers too
  const liveContainers = contentEl.querySelectorAll('.recharts-responsive-container');
  const cloneContainers = clone.querySelectorAll('.recharts-responsive-container');
  liveContainers.forEach((liveCont, i) => {
    const cloneCont = cloneContainers[i] as HTMLElement | undefined;
    if (!cloneCont) return;
    const rect = liveCont.getBoundingClientRect();
    cloneCont.style.cssText = `width:${Math.round(rect.width)}px;height:${Math.round(rect.height)}px;`;
  });

  // 6. Collect ALL stylesheets (includes Tailwind, CSS variables, component styles)
  let collectedCSS = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        collectedCSS += rule.cssText + '\n';
      }
    } catch {
      // Cross-origin — skip
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    ${collectedCSS}
  </style>
  <style>
    /* ===== Download layout — override app's overflow:hidden ===== */
    html, body, #root {
      height: auto !important;
      overflow: visible !important;
      overflow-x: auto !important;
    }
    html { background: hsl(210 40% 98%); }
    body { margin: 0 !important; padding: 0 !important; background: hsl(210 40% 98%) !important; }

    .dl-page {
      width: ${originalWidth}px;
      padding: 28px 32px;
    }

    /* Header */
    .dl-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #1a1a1a;
    }
    .dl-header-left h1 { font-size: 17px; font-weight: 700; letter-spacing: 0.5px; margin: 0; }
    .dl-header-left p { font-size: 11px; color: #666; margin: 3px 0 0; }
    .dl-header img { height: 42px; object-fit: contain; }

    /* Footer */
    .dl-footer {
      margin-top: 32px; padding-top: 12px; border-top: 1px solid #d1d5db;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 10px; color: #999;
    }
    .dl-footer .watermark {
      font-size: 11px; font-weight: 600; color: #bbb;
      letter-spacing: 1px; text-transform: uppercase;
    }

    /* Hide cloned dialogs/overlays */
    [role="dialog"], [data-radix-portal], [data-state="open"] { display: none !important; }

    @media print {
      .dl-page { width: 100% !important; }
      body { background: #fff; }
    }
  </style>
</head>
<body>
  <div class="dl-page">
    <div class="dl-header">
      <div class="dl-header-left">
        <h1>${escapeHtml(title)}</h1>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        <p>Generated on ${generatedOn}</p>
      </div>
      <img src="${logoUrl}" alt="Future Fibres" />
    </div>
    <div class="dl-content">
      ${clone.innerHTML}
    </div>
    <div class="dl-footer">
      <span class="watermark">Powered by North Technology Group Data Team</span>
      <span>Generated on ${generatedOn}</span>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = now.toISOString().slice(0, 10);
  a.download = `${safeTitle}_${timestamp}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
