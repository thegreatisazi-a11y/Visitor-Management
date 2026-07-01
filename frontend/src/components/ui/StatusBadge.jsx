import clsx from 'clsx';
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from '../../constants';

export default function StatusBadge({ status }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        STATUS_BADGE_CLASSES[status] || 'bg-slate-100 text-slate-700 ring-slate-600/20'
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
