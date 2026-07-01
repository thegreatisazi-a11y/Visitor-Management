import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Button from './Button';

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (!total) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}</span> to{' '}
        <span className="font-medium text-slate-700">{to}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span> results
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <FiChevronLeft size={16} /> Prev
        </Button>
        <span className="flex items-center px-2 text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <FiChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
