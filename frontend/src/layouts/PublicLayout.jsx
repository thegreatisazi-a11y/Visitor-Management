import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 via-white to-white">
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-slate-400">
        Powered by ISAZI Pharma and Techno Consultancy Pvt. Ltd.
      </footer>
    </div>
  );
}
