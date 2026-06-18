export function HtmlPreviewFrame({ html = "", css = "", scripts = "", height = 360 }) {
  const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"><style>body{margin:0;font-family:Inter,Arial,sans-serif;color:#0f172a;background:#fff;} ${css || ""}</style></head><body>${html || "<div style='padding:24px;color:#64748b'>Preview content will appear here.</div>"}<script>${scripts || ""}</script></body></html>`;
  return (
    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Preview</div>
      <iframe title="HTML preview" sandbox="allow-scripts allow-same-origin" srcDoc={document} className="w-full rounded-lg border border-slate-200 bg-white" style={{ height }} />
    </div>
  );
}
