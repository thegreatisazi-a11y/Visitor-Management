import { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import clsx from 'clsx';
import { OPERATORS_BY_TYPE } from '../../constants';

const NO_VALUE_OPERATORS = ['today', 'yesterday', 'this_week', 'this_month', 'this_year'];
const TWO_VALUE_OPERATORS = ['between'];
const BLANK = { operator: '', value: '', value2: '' };

// The Excel-style value checklist (ColumnFilterMenu) doesn't work well for columns
// where nearly every row has its own unique value - timestamps, durations, etc.
// This is Excel's other filter mode for those columns: an operator (Before/After/
// Between, or Greater/Less/Between for numbers) plus one or two values.
export default function ColumnRangeFilter({ label, fieldType, value = BLANK, onApply }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const operators = OPERATORS_BY_TYPE[fieldType] || [];
  const isActive = !!value.operator;

  const handleOpen = () => {
    setDraft(value);
    setOpen(true);
  };

  const apply = () => {
    onApply(draft);
    setOpen(false);
  };

  const clear = () => {
    onApply(BLANK);
    setOpen(false);
  };

  const needsValue = draft.operator && !NO_VALUE_OPERATORS.includes(draft.operator);
  const needsSecondValue = TWO_VALUE_OPERATORS.includes(draft.operator);
  const inputType = fieldType === 'number' ? 'number' : 'date';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        title={`Filter ${label}`}
        onClick={handleOpen}
        className={clsx('rounded p-0.5 transition-colors', isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600')}
      >
        <FiFilter size={12} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg bg-white p-3 text-left shadow-elevated ring-1 ring-slate-900/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Filter: {label}</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
              <FiX size={14} />
            </button>
          </div>

          <select
            value={draft.operator}
            onChange={(e) => setDraft({ ...draft, operator: e.target.value, value: '', value2: '' })}
            className="mb-2 w-full rounded-md border-0 px-2 py-1.5 text-xs ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
          >
            <option value="">No filter</option>
            {operators.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          {needsValue && (
            <input
              type={inputType}
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
              className="mb-2 w-full rounded-md border-0 px-2 py-1.5 text-xs ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
            />
          )}
          {needsSecondValue && (
            <input
              type={inputType}
              value={draft.value2}
              onChange={(e) => setDraft({ ...draft, value2: e.target.value })}
              className="mb-2 w-full rounded-md border-0 px-2 py-1.5 text-xs ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-brand-600"
            />
          )}

          <div className="mt-1 flex justify-end gap-2">
            <button onClick={clear} className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Clear
            </button>
            <button onClick={apply} className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
