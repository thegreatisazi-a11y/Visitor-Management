import clsx from 'clsx';
import Card from './Card';
import Skeleton from './Skeleton';

export default function StatCard({ label, value, icon, accent = 'brand', loading }) {
  const accentClass = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }[accent];

  return (
    <Card className="flex items-center gap-4">
      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', accentClass)}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        {loading ? <Skeleton className="mt-1 h-6 w-16" /> : <p className="mt-0.5 text-2xl font-semibold text-slate-900">{value}</p>}
      </div>
    </Card>
  );
}
