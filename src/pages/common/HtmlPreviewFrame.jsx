import { useState } from "react";

const previewModes = [
  { key: "desktop", label: "Desktop", width: "100%" },
  { key: "tablet", label: "Tablet", width: 768 },
  { key: "mobile", label: "Mobile", width: 390 },
];

export function HtmlPreviewFrame({ html = "", css = "", scripts = "", height = 520 }) {
  const [mode, setMode] = useState("desktop");
  const active = previewModes.find((item) => item.key === mode) || previewModes[0];
  const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://cdn.tailwindcss.com"></script><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"><style>body{margin:0;font-family:Inter,Arial,sans-serif;color:#0f172a;background:#fff;} ${css || ""}</style></head><body>${html || "<div style='padding:24px;color:#64748b'>Preview content will appear here.</div>"}<script>${scripts || ""}</script></body></html>`;
  return (
    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Live Preview</div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {previewModes.map((item) => (
            <button key={item.key} type="button" onClick={() => setMode(item.key)} className={`rounded-md px-2 py-1 text-xs font-bold ${mode === item.key ? "bg-sky-600 text-white" : "text-slate-600"}`}>
              {item.label}
            </button>
          ))}
          <button type="button" onClick={() => {
            const preview = window.open("", "_blank");
            if (preview) preview.document.write(document);
          }} className="rounded-md px-2 py-1 text-xs font-bold text-slate-600">
            Full Screen
          </button>
        </div>
      </div>
      <div className="overflow-auto rounded-lg bg-slate-200 p-3">
        <iframe title="HTML preview" sandbox="allow-scripts allow-same-origin" srcDoc={document} className="mx-auto rounded-lg border border-slate-200 bg-white shadow-sm" style={{ height, width: active.width }} />
      </div>
    </div>
  );
}
