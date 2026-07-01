import { useState } from 'react';
import { FiSearch, FiSliders, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import clsx from 'clsx';
import Button from './Button';
import Input from './Input';
import { FILTERABLE_FIELDS, OPERATORS_BY_TYPE } from '../../constants';

const NO_VALUE_OPERATORS = ['empty', 'not_empty', 'today', 'yesterday', 'this_week', 'this_month', 'this_year'];
const TWO_VALUE_OPERATORS = ['between'];

function emptyRow() {
  const first = FILTERABLE_FIELDS[0];
  return { field: first.field, operator: OPERATORS_BY_TYPE[first.type][0].value, value: '', value2: '' };
}

export default function FilterBar({
  search,
  onSearchChange,
  quickFilters = [],
  activeQuickFilter,
  onQuickFilterChange,
  filters,
  onApplyFilters,
  extraActions,
}) {
  const [open, setOpen] = useState(false);
  const [draftRows, setDraftRows] = useState(filters?.length ? filters : [emptyRow()]);

  const fieldType = (field) => FILTERABLE_FIELDS.find((f) => f.field === field)?.type || 'text';

  const updateRow = (idx, patch) => {
    setDraftRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const addRow = () => setDraftRows((rows) => [...rows, emptyRow()]);
  const removeRow = (idx) => setDraftRows((rows) => rows.filter((_, i) => i !== idx));

  const apply = () => {
    const cleaned = draftRows.filter((r) => r.field && r.operator);
    onApplyFilters(cleaned);
    setOpen(false);
  };

  const clearAll = () => {
    setDraftRows([emptyRow()]);
    onApplyFilters([]);
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Search visitor ID, name, mobile, company..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative">
          <Button variant="secondary" onClick={() => setOpen((o) => !o)}>
            <FiSliders size={16} />
            Filters
            {filters?.length > 0 && (
              <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white">{filters.length}</span>
            )}
          </Button>
          {open && (
            <div className="absolute right-0 z-30 mt-2 w-[480px] rounded-xl2 bg-white p-4 shadow-elevated ring-1 ring-slate-900/10">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Advanced Filters</h4>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <FiX size={16} />
                </button>
              </div>
              <div className="max-h-72 space-y-3 overflow-y-auto">
                {draftRows.map((row, idx) => {
                  const type = fieldType(row.field);
                  const operators = OPERATORS_BY_TYPE[type] || OPERATORS_BY_TYPE.text;
                  const needsValue = !NO_VALUE_OPERATORS.includes(row.operator);
                  const needsSecondValue = TWO_VALUE_OPERATORS.includes(row.operator);
                  const field = FILTERABLE_FIELDS.find((f) => f.field === row.field);

                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <select
                        className="w-32 rounded-lg border-0 px-2 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
                        value={row.field}
                        onChange={(e) => {
                          const newType = fieldType(e.target.value);
                          updateRow(idx, { field: e.target.value, operator: OPERATORS_BY_TYPE[newType][0].value, value: '', value2: '' });
                        }}
                      >
                        {FILTERABLE_FIELDS.map((f) => (
                          <option key={f.field} value={f.field}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="w-32 rounded-lg border-0 px-2 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
                        value={row.operator}
                        onChange={(e) => updateRow(idx, { operator: e.target.value })}
                      >
                        {operators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                      {needsValue &&
                        (field?.type === 'dropdown' ? (
                          <select
                            className="flex-1 rounded-lg border-0 px-2 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
                            value={row.value}
                            onChange={(e) => updateRow(idx, { value: e.target.value })}
                          >
                            <option value="">Select...</option>
                            {field.options.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={type.includes('date') ? 'date' : 'text'}
                            className="flex-1 rounded-lg border-0 px-2 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
                            value={row.value}
                            onChange={(e) => updateRow(idx, { value: e.target.value })}
                          />
                        ))}
                      {needsSecondValue && (
                        <input
                          type={type.includes('date') ? 'date' : 'text'}
                          className="flex-1 rounded-lg border-0 px-2 py-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
                          value={row.value2}
                          onChange={(e) => updateRow(idx, { value2: e.target.value })}
                        />
                      )}
                      <button onClick={() => removeRow(idx)} className="mt-2 text-slate-400 hover:text-rose-500">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button onClick={addRow} className="mt-3 flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
                <FiPlus size={14} /> Add condition
              </button>
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear
                </Button>
                <Button size="sm" onClick={apply}>
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
        {extraActions}
      </div>

      {quickFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((qf) => (
            <button
              key={qf.value}
              onClick={() => onQuickFilterChange(activeQuickFilter === qf.value ? '' : qf.value)}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
                activeQuickFilter === qf.value
                  ? 'bg-brand-600 text-white ring-brand-600'
                  : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
              )}
            >
              {qf.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
