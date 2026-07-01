import clsx from 'clsx';

export default function Card({ className, children, padded = true, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl2 bg-white shadow-card ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10',
        padded && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
