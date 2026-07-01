import { useEffect, useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import clsx from 'clsx';
import Spinner from './Spinner';

// Excel-style column filter: a funnel icon that opens a checklist of the column's
// actual distinct values (fetched fresh each time, so it reflects whatever other
// filters are currently active elsewhere in the table). Multiple values can be
// checked at once, and this composes with every other column's own filter menu.
export default function ColumnFilterMenu({ label, selectedValues = [], fetchOptions, onApply }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(selectedValues);

  useEffect(() => {
    if (!open) return;
    setDraft(selectedValues);
    setSearch('');
    setLoading(true);
    fetchOptions()
      .then((values) => setOptions(values.map((v) => (typeof v === 'object' ? v : { value: v, label: v }))))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  const toggleValue = (value) => {
    setDraft((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const selectAllVisible = () => {
    const visibleValues = filteredOptions.map((o) => o.value);
    setDraft((prev) => Array.from(new Set([...prev, ...visibleValues])));
  };

  const clearAll = () => setDraft([]);

  const apply = () => {
    onApply(draft);
    setOpen(false);
  };

  const cancel = () => {
    setDraft(selectedValues);
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        title={`Filter ${label}`}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'rounded p-0.5 transition-colors',
          selectedValues.length > 0 ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
        )}
      >
        <FiFilter size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg bg-white p-3 text-left shadow-elevated ring-1 ring-slate-900/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Filter: {label}</span>
            <button onClick={cancel} className="text-slate-400 hover:text-slate-600">
              <FiX size={14} />
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search values..."
            className="mb-2 w-full rounded-md border-0 px-2 py-1.5 text-xs ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
          />

          <div className="mb-2 flex justify-between text-xs">
            <button onClick={selectAllVisible} className="font-medium text-brand-600 hover:text-brand-700">
              Select all
            </button>
            <button onClick={clearAll} className="font-medium text-slate-500 hover:text-slate-700">
              Clear
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-md border border-slate-100">
            {loading ? (
              <div className="flex justify-center py-4">
                <Spinner size={16} />
              </div>
            ) : filteredOptions.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-slate-400">No values found</p>
            ) : (
              filteredOptions.map((o) => (
                <label
                  key={o.value}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={draft.includes(o.value)}
                    onChange={() => toggleValue(o.value)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                  />
                  <span className="truncate">{o.label}</span>
                </label>
              ))
            )}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button onClick={cancel} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button onClick={apply} className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700">
              Apply ({draft.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
