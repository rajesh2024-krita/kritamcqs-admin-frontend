import { cn, ui } from "../../ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ meta, onChange }) {
  if (!meta) return null;

  const { page, totalPages, total } = meta;
  const maxVisiblePages = 5;

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      {/* Info */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-slate-400">
          {total} {total === 1 ? 'record' : 'records'}
        </span>
        <span className="text-[10px] text-slate-300">•</span>
        <span className="text-[10px] text-slate-400">
          Page {page} of {totalPages}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
            page <= 1 
              ? "text-slate-300" 
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
        >
          <ChevronLeft size={14} />
        </button>

        {pageNumbers.map((item, index) => {
          if (item === '...') {
            return (
              <span 
                key={`ellipsis-${index}`} 
                className="text-slate-400 text-[10px] px-0.5"
              >
                …
              </span>
            );
          }

          const isActive = item === page;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
            page >= totalPages 
              ? "text-slate-300" 
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}