import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ title = 'No records found', description, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <div className="rounded-full bg-slate-100 p-4 text-slate-400">{icon || <FiInbox size={28} />}</div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  );
}
