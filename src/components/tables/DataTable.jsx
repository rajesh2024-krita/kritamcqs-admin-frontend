import { useEffect, useRef } from "react";
import { ui } from "../../ui";

export function DataTable({
  columns,
  rows,
  renderActions,
  selectable = false,
  selectedRowIds = [],
  onToggleRow,
  onToggleAllRows,
}) {
  const selectAllRef = useRef(null);
  const selectedSet = new Set((selectedRowIds || []).map(String));
  const selectedVisibleCount = rows.filter((row) => selectedSet.has(String(row.id))).length;
  const allSelected = rows.length > 0 && selectedVisibleCount === rows.length;
  const partiallySelected = selectedVisibleCount > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected]);

  return (
    <div className={ui.tableWrap}>
      <div className={ui.tableScroll}>
        <table className={ui.table}>
          <thead>
            <tr>
              {selectable ? (
                <th className={ui.tableHead}>
                  <input
                    ref={selectAllRef}
                    className={ui.checkbox}
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => onToggleAllRows?.(event.target.checked)}
                  />
                </th>
              ) : null}
              {columns.map((column) => <th key={column.key} className={ui.tableHead}>{column.label}</th>)}
              {renderActions ? <th className={ui.tableHead}>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {selectable ? (
                  <td className={ui.tableCell}>
                    <input
                      className={ui.checkbox}
                      type="checkbox"
                      checked={selectedSet.has(String(row.id))}
                      onChange={(event) => onToggleRow?.(String(row.id), event.target.checked)}
                    />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column.key} className={ui.tableCell}>{column.render ? column.render(row) : row[column.key] ?? "-"}</td>
                ))}
                {renderActions ? <td className={ui.tableCell}>{renderActions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
