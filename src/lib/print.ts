type PrintOptions = {
  title: string;
  html: string;
};

// Simple, dependency-free “Export PDF” by opening a print window.
// Users can Save as PDF from the print dialog.
export function openPrintWindow({ title, html }: PrintOptions) {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  w.document.open();
  w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 0; padding: 24px; background: #fff; color: #111; }
      h1, h2, h3 { margin: 0 0 8px; }
      p { margin: 0 0 10px; line-height: 1.5; }
      .muted { color: #555; }
      .row { display: flex; gap: 16px; align-items: center; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; margin: 12px 0; }
      .grid { display: grid; gap: 12px; }
      .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; border: 1px solid #ddd; font-size: 12px; }
      .badge-danger { border-color: #f1b4b4; background: #ffecec; }
      .badge-ok { border-color: #bfe8d0; background: #edfff4; }
      img { max-width: 100%; }
      .logo { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 1px solid #eee; }
      .thumb { width: 160px; height: 96px; border-radius: 10px; object-fit: cover; border: 1px solid #eee; }
      @media print {
        body { padding: 0; }
        .card { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    ${html}
    <script>
      window.onload = () => setTimeout(() => window.print(), 150);
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
