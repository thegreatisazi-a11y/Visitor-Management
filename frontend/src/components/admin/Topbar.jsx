import { useState } from 'react';
import { FiMenu, FiChevronDown, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenuClick }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button onClick={onMenuClick} className="text-slate-500 hover:text-slate-700 lg:hidden">
        <FiMenu size={22} />
      </button>
      <div className="hidden lg:block" />
      <div className="relative">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {admin?.fullName?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="hidden text-sm font-medium text-slate-700 sm:block">{admin?.fullName}</span>
          <FiChevronDown size={16} className="text-slate-400" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-1 shadow-elevated ring-1 ring-slate-900/10">
            <div className="border-b border-slate-100 px-4 py-2">
              <p className="truncate text-sm font-medium text-slate-800">{admin?.fullName}</p>
              <p className="truncate text-xs text-slate-500">{admin?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-slate-50"
            >
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
