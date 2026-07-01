import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiLogOut,
  FiCode,
  FiFileText,
  FiShield,
  FiUserPlus,
  FiSettings,
  FiX,
} from 'react-icons/fi';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Admin Dashboard', icon: FiGrid },
  { to: '/admin/visitor-entries', label: 'Visitor Entries', icon: FiUsers },
  { to: '/admin/currently-inside', label: 'Currently Inside', icon: FiUserCheck },
  { to: '/admin/out-sessions', label: 'OUT Sessions', icon: FiLogOut },
  { to: '/admin/qr-management', label: 'QR Management', icon: FiCode },
  { to: '/admin/reports', label: 'Reports', icon: FiFileText },
  { to: '/admin/audit-trail', label: 'Audit Trail', icon: FiShield },
  { to: '/admin/admin-users', label: 'Admin Users', icon: FiUserPlus },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} />}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform bg-slate-900 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div>
            <p className="text-sm font-bold tracking-wide text-white">ISAZI VISITOR PORTAL</p>
            <p className="text-xs text-slate-400">Admin Console</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <FiX size={20} />
          </button>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
