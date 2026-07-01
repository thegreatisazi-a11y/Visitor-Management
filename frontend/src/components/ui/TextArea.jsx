import { forwardRef } from 'react';
import clsx from 'clsx';

const TextArea = forwardRef(function TextArea(
  { label, error, required, className, containerClassName, rows = 3, ...props },
  ref
) {
  return (
    <div className={containerClassName}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'block w-full rounded-lg border-0 px-3.5 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300',
          'placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600',
          error && 'ring-rose-400 focus:ring-rose-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
    </div>
  );
});

export default TextArea;
