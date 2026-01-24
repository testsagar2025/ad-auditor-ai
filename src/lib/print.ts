type PrintOptions = {
  title: string;
  html: string;
  showWatermark?: boolean;
  coverPage?: {
    title: string;
    subtitle?: string;
    logo?: string;
    generatedAt?: string;
    stats?: { label: string; value: string | number }[];
  };
};

// Professional PDF export with cover page, page breaks, and watermark
export function openPrintWindow({ title, html, showWatermark = true, coverPage }: PrintOptions) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  const watermarkStyles = showWatermark
    ? `
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 120px;
        font-weight: bold;
        opacity: 0.03;
        pointer-events: none;
        z-index: 0;
        color: #000;
        white-space: nowrap;
      }
    `
    : "";

  const coverPageHtml = coverPage
    ? `
      <div class="cover-page">
        ${coverPage.logo ? `<img src="${escapeHtml(coverPage.logo)}" alt="Logo" class="cover-logo" />` : ""}
        <h1 class="cover-title">${escapeHtml(coverPage.title)}</h1>
        ${coverPage.subtitle ? `<p class="cover-subtitle">${escapeHtml(coverPage.subtitle)}</p>` : ""}
        ${coverPage.generatedAt ? `<p class="cover-date">Generated: ${escapeHtml(coverPage.generatedAt)}</p>` : ""}
        ${
          coverPage.stats
            ? `
          <div class="cover-stats">
            ${coverPage.stats
              .map(
                (s) => `
              <div class="cover-stat">
                <span class="cover-stat-value">${escapeHtml(String(s.value))}</span>
                <span class="cover-stat-label">${escapeHtml(s.label)}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
        <div class="cover-footer">
          <p>UnMask — Transparency in Coaching Claims</p>
          <p class="muted">This document is auto-generated for informational purposes.</p>
        </div>
      </div>
    `
    : "";

  w.document.open();
  w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      
      body { 
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; 
        margin: 0; 
        padding: 0;
        background: #fff; 
        color: #111; 
        line-height: 1.6;
      }
      
      /* Hide nav, footer, and other UI elements */
      header, footer, nav, .no-print { display: none !important; }
      
      /* Cover Page Styles */
      .cover-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px;
        page-break-after: always;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      }
      
      .cover-logo {
        width: 80px;
        height: 80px;
        border-radius: 16px;
        object-fit: cover;
        margin-bottom: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      
      .cover-title {
        font-size: 36px;
        font-weight: 800;
        margin: 0 0 12px;
        color: #111;
      }
      
      .cover-subtitle {
        font-size: 18px;
        color: #555;
        margin: 0 0 8px;
      }
      
      .cover-date {
        font-size: 14px;
        color: #888;
        margin: 0 0 32px;
      }
      
      .cover-stats {
        display: flex;
        gap: 32px;
        margin: 32px 0;
      }
      
      .cover-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 24px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      
      .cover-stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #111;
      }
      
      .cover-stat-label {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .cover-footer {
        margin-top: auto;
        padding-top: 48px;
      }
      
      .cover-footer p {
        margin: 4px 0;
        font-size: 14px;
      }
      
      /* Main Content Styles */
      .content {
        padding: 48px;
        position: relative;
        z-index: 1;
      }
      
      h1, h2, h3 { margin: 0 0 12px; font-weight: 600; }
      h1 { font-size: 28px; }
      h2 { font-size: 20px; margin-top: 24px; }
      h3 { font-size: 16px; }
      
      p { margin: 0 0 12px; }
      .muted { color: #666; font-size: 14px; }
      
      .row { display: flex; gap: 16px; align-items: center; }
      
      .card { 
        border: 1px solid #e0e0e0; 
        border-radius: 12px; 
        padding: 20px; 
        margin: 16px 0; 
        background: #fafafa;
        page-break-inside: avoid;
      }
      
      .grid { display: grid; gap: 16px; }
      .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      
      .badge { 
        display: inline-block; 
        padding: 4px 10px; 
        border-radius: 999px; 
        border: 1px solid #ddd; 
        font-size: 11px; 
        font-weight: 500;
      }
      .badge-danger { border-color: #f1b4b4; background: #ffecec; color: #c53030; }
      .badge-ok { border-color: #bfe8d0; background: #edfff4; color: #276749; }
      
      img { max-width: 100%; }
      .logo { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 1px solid #eee; }
      .thumb { width: 160px; height: 96px; border-radius: 10px; object-fit: cover; border: 1px solid #eee; }
      
      .section { 
        margin-bottom: 32px; 
        page-break-inside: avoid;
      }
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        padding-bottom: 8px;
        border-bottom: 2px solid #111;
        margin-bottom: 16px;
      }
      
      .page-break { page-break-after: always; }
      
      ${watermarkStyles}
      
      @media print {
        body { padding: 0; }
        .cover-page { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .card { break-inside: avoid; }
        .section { break-inside: avoid; }
        .page-break { break-after: page; }
      }
    </style>
  </head>
  <body>
    ${showWatermark ? '<div class="watermark">UnMask</div>' : ""}
    ${coverPageHtml}
    <div class="content">
      ${html}
    </div>
    <script>
      window.onload = () => setTimeout(() => window.print(), 200);
    </script>
  </body>
</html>`);
  w.document.close();
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export { escapeHtml };
