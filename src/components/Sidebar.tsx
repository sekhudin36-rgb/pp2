import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  SendToBack, 
  Settings, 
  Bookmark, 
  FileText, 
  LogOut, 
  Search,
  ClipboardList,
  Sparkles,
  Wifi,
  X,
  Compass,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  onLogout?: () => void;
  onOpenAi?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ onLogout, onOpenAi }: SidebarProps) {
  const location = useLocation();
  const [libraryName, setLibraryName] = useState('E-Perpus');
  const [institutionName, setInstitutionName] = useState('SMP Negeri 1 Belajar');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.libraryName) setLibraryName(data.libraryName);
        if (data.institutionName) setInstitutionName(data.institutionName);
      })
      .catch(console.error);
  }, []);

  const links = [
    { name: 'Halaman Utama (Portal)', icon: Globe, path: '/', badge: 'Publik' },
    { name: 'Dashboard Petugas', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Buku Kunjungan', icon: ClipboardList, path: '/visitors', badge: 'Baru' },
    { name: 'Koleksi (KIB E)', icon: BookOpen, path: '/books' },
    { name: 'Katalog Pencarian', icon: Compass, path: '/catalog' },
    { name: 'Sirkulasi & Peminjaman', icon: SendToBack, path: '/transactions' },
    { name: 'Data Anggota', icon: Users, path: '/members' },
    { name: 'Laporan & Statistik', icon: FileText, path: '/reports' },
  ];

  return (
    <aside className={cn(
      "hidden lg:flex w-64 flex-col gap-4 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shrink-0 h-full relative overflow-hidden transition-transform duration-300 z-40"
    )}>
      {/* Background glow decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none"></div>

      {/* Brand Header */}
      <div className="flex items-center justify-between px-2 mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold leading-tight text-white tracking-tight truncate">{libraryName}</h1>
            <p className="text-[10px] text-blue-400 font-medium tracking-wide truncate">{institutionName}</p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col gap-1 overflow-y-auto min-h-0 relative z-10 pr-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1 mt-2">
          Menu Perpustakaan
        </div>
        {links.map((link) => {
          const active = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all text-xs font-medium group",
                active 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <link.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", active ? "text-white" : "text-slate-400")} />
                <span>{link.name}</span>
              </div>
              {link.badge && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-md font-semibold tracking-wider uppercase",
                  active ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                )}>
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* AI Assistant Button */}
        {onOpenAi && (
          <button
            onClick={onOpenAi}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all text-xs font-medium bg-gradient-to-r from-indigo-500/15 to-purple-500/15 hover:from-indigo-500/25 hover:to-purple-500/25 text-indigo-300 border border-indigo-500/20 mt-2"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Asisten Pustakawan AI</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 font-mono">GENAI</span>
          </button>
        )}
      </nav>

      {/* Footer info & Actions */}
      <div className="mt-auto relative z-10 space-y-2 pt-2 border-t border-white/5">
        <Link 
          to="/settings" 
          className={cn(
            "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all text-xs font-medium",
            location.pathname === '/settings'
              ? "bg-white/10 text-white font-semibold" 
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Sistem</span>
        </Link>

        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl transition-all text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>

        {/* Dapodik System Status Pill */}
        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-medium">Sistem Dapodik:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Siap Sinkron
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Penyimpanan lokal aktif & teruji offline/online otomatis.
          </p>
        </div>
      </div>
    </aside>
  );
}
