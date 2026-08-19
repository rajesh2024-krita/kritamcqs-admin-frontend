import { useEffect, useRef, useState } from "react";
import { cn, ui } from "../../ui";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

export function DataTable({
  columns,
  rows,
  renderActions,
  selectable = false,
  selectedRowIds = [],
  onToggleRow,
  onToggleAllRows,
  compact = true,
  striped = true,
  hover = true,
  sortable = false,
  onSort,
  emptyMessage = "No records found",
}) {
  const selectAllRef = useRef(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const selectedSet = new Set((selectedRowIds || []).map(String));
  const selectedVisibleCount = rows.filter((row) => selectedSet.has(String(row.id))).length;
  const allSelected = rows.length > 0 && selectedVisibleCount === rows.length;
  const partiallySelected = selectedVisibleCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  const handleSort = (columnKey) => {
    if (!sortable || !onSort) return;
    
    if (sortColumn === columnKey) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      onSort(columnKey, newDirection);
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
      onSort(columnKey, 'asc');
    }
  };

  const checkboxClass = "h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer";

  return (
    <div className="bg-white rounded-lg border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              {selectable && (
                <th className="px-2 py-1.5 text-left">
                  <input
                    ref={selectAllRef}
                    className={checkboxClass}
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => onToggleAllRows?.(event.target.checked)}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className={cn(
                    "px-2 py-1.5 text-left whitespace-nowrap",
                    sortable && column.sortable !== false && "cursor-pointer hover:text-slate-700 select-none"
                  )}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {column.label}
                    </span>
                    {sortable && column.sortable !== false && (
                      <span className="text-slate-300">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? 
                            <ChevronUp size={12} /> : 
                            <ChevronDown size={12} />
                        ) : (
                          <ChevronsUpDown size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {renderActions && (
                <th className="px-2 py-1.5 text-right whitespace-nowrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)} 
                  className="px-4 py-6 text-center"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const isSelected = selectedSet.has(String(row.id));
                return (
                  <tr 
                    key={row.id}
                    className={cn(
                      "transition-colors duration-150",
                      striped && index % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                      hover && "hover:bg-indigo-50/50",
                      isSelected && "bg-indigo-50/70",
                      compact ? "text-xs" : "text-sm"
                    )}
                  >
                    {selectable && (
                      <td className="px-2 py-1.5 text-left">
                        <input
                          className={checkboxClass}
                          type="checkbox"
                          checked={isSelected}
                          onChange={(event) => onToggleRow?.(String(row.id), event.target.checked)}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td 
                        key={column.key} 
                        className={cn(
                          "px-2 py-1.5 text-slate-700",
                          compact ? "text-xs" : "text-sm"
                        )}
                      >
                        {column.render ? column.render(row) : (row[column.key] ?? "-")}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {renderActions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer with record count */}
      <div className="border-t border-slate-100 px-3 py-1.5 bg-slate-50/30">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {rows.length} record{rows.length !== 1 ? 's' : ''}
          </span>
          {selectable && selectedRowIds.length > 0 && (
            <span className="text-[10px] text-indigo-600">
              {selectedRowIds.length} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}