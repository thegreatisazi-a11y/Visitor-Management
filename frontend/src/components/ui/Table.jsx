import clsx from 'clsx';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

export default function Table({ columns, data, loading, rowKey = '_id', emptyMessage }) {
  if (loading) return <TableSkeleton cols={columns.length} />;
  if (!data || data.length === 0) return <EmptyState title={emptyMessage || 'No records found'} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
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
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
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
      </table>
    </div>
  );
}
