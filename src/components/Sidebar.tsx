import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Users, LayoutDashboard, SendToBack, Settings, Bookmark, FileText, LogOut, Code, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export default function Sidebar({ onLogout }: { onLogout?: () => void }) {
  const location = useLocation();
  const [libraryName, setLibraryName] = useState('E-Perpus');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.libraryName) setLibraryName(data.libraryName);
      })
      .catch(err => console.error('Error loading settings in Sidebar:', err));
  }, []);

  const links = [
    { name: 'Dashboard Utama', icon: LayoutDashboard, path: '/' },
    { name: 'Koleksi (KIB E)', icon: BookOpen, path: '/books' },
    { name: 'Katalog Pustaka', icon: Search, path: '/catalog' },
    { name: 'Data Anggota', icon: Users, path: '/members' },
    { name: 'Peminjaman', icon: SendToBack, path: '/transactions' },
    { name: 'Laporan', icon: FileText, path: '/reports' },
  ];

  return (
    <aside className="w-64 flex flex-col gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shrink-0 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
         <Code className="w-48 h-48 text-white" />
      </div>
      <div className="flex items-center gap-3 px-2 mb-4 relative z-10">
        <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Bookmark className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none tracking-tight">{libraryName}</h1>
          <p className="text-[10px] text-blue-400 font-bold tracking-widest mt-1 uppercase">Server Aktif</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto min-h-0 relative z-10">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-2">Menu Utama</div>
        {links.map((link) => {
          const active = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm",
                active 
                  ? "bg-white/10 text-white font-medium" 
                  : "text-slate-400 hover:bg-white/5"
              )}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto relative z-10">
        <Link 
          to="/settings" 
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm mb-2",
            location.pathname === '/settings'
              ? "bg-white/10 text-white font-medium" 
              : "text-slate-400 hover:bg-white/5"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Pengaturan</span>
        </Link>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm mb-4 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4">
          <p className="text-[11px] text-blue-300 uppercase tracking-wider font-bold mb-1">Status Server</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Koneksi Lokal Aktif</span>
          </div>
        </div>
        
        <div className="px-2 pb-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">
            Developed by <br/><span className="font-bold text-blue-400 text-xs">Khabibu Rohman</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
