import clsx from 'clsx';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import ColumnFilterMenu from './ColumnFilterMenu';
import ColumnRangeFilter from './ColumnRangeFilter';

// A column opts into an Excel-style header filter by providing `filter`, in one of two shapes:
//   values checklist (default): { selectedValues, fetchOptions: () => Promise<Array<string|{value,label}>>, onApply }
//   operator + range (kind: 'range'): { kind: 'range', fieldType: 'date'|'number', value: {operator,value,value2}, onApply }
function HeaderFilter({ label, filter }) {
  if (!filter) return null;
  if (filter.kind === 'range') {
    return <ColumnRangeFilter label={label} fieldType={filter.fieldType} value={filter.value} onApply={filter.onApply} />;
  }
  return (
    <ColumnFilterMenu label={label} selectedValues={filter.selectedValues} fetchOptions={filter.fetchOptions} onApply={filter.onApply} />
  );
}

export default function Table({ columns, data, loading, rowKey = '_id', emptyMessage }) {
  if (loading) return <TableSkeleton cols={columns.length} />;

  const isEmpty = !data || data.length === 0;

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className="w-full min-w-max divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                  col.headerClassName
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.label}
                  <HeaderFilter label={col.label} filter={col.filter} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        {!isEmpty && (
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((row) => (
              <tr key={row[rowKey]} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className={clsx('whitespace-nowrap px-4 py-3 text-sm text-slate-700', col.cellClassName)}>
                    {col.render ? col.render(row) : row[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>
      {isEmpty && <EmptyState title={emptyMessage || 'No records found'} />}
    </div>
  );
}
