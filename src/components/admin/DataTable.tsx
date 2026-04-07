import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  pageSize?: number;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyField,
  searchPlaceholder = 'Buscar...',
  searchFilter,
  pageSize = 10,
  selectable = false,
  onSelectionChange,
  bulkActions,
  emptyMessage = 'Sin resultados',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = searchFilter
    ? data.filter((item) => !search || searchFilter(item, search.toLowerCase()))
    : data;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    onSelectionChange?.(Array.from(next));
  };

  const toggleAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const ids = paged.map((item) => String(item[keyField]));
      setSelected(new Set(ids));
      onSelectionChange?.(ids);
    }
  };

  return (
    <div>
      {/* Search + bulk actions bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        {selected.size > 0 && bulkActions && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
            <span className="text-xs font-medium text-primary">{selected.size} seleccionados</span>
            {bulkActions}
          </div>
        )}
        <span className="text-xs text-text-muted ml-auto">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {selectable && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.size === paged.length && paged.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-border bg-bg-secondary text-primary focus:ring-primary/40 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} className={`text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-4 py-3 ${col.className || ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((item) => {
                const id = String(item[keyField]);
                const isSelected = selected.has(id);
                return (
                  <tr
                    key={id}
                    className={`border-b border-border-light last:border-0 transition-colors ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(id)}
                          className="w-4 h-4 rounded border-border bg-bg-secondary text-primary focus:ring-primary/40 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                        {col.render(item)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paged.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">{emptyMessage}</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-text-muted">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
