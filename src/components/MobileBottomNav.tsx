import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Repeat, 
  QrCode, 
  Grid, 
  Users, 
  ClipboardList, 
  FileText, 
  Settings, 
  Search, 
  Sparkles, 
  Globe, 
  LogOut, 
  X,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileBottomNavProps {
  onOpenScan: () => void;
  onOpenSearch: () => void;
  onOpenAi: () => void;
  onLogout: () => void;
}

export default function MobileBottomNav({
  onOpenScan,
  onOpenSearch,
  onOpenAi,
  onLogout
}: MobileBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const moreMenuItems = [
    {
      name: 'Presensi Kunjungan',
      desc: 'Buku tamu & pengunjung',
      icon: ClipboardList,
      path: '/visitors',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      name: 'Data Anggota',
      desc: 'Kartu & profil siswa/guru',
      icon: Users,
      path: '/members',
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      name: 'Katalog Pencarian',
      desc: 'Eksplorasi rak & kategori',
      icon: Compass,
      path: '/catalog',
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    },
    {
      name: 'Laporan & Statistik',
      desc: 'KIB E & rekap peminjaman',
      icon: FileText,
      path: '/reports',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      name: 'Pengaturan Sistem',
      desc: 'Profil, denda & akun petugas',
      icon: Settings,
      path: '/settings',
      color: 'from-slate-700/50 to-slate-800/50 text-slate-300 border-slate-700'
    },
    {
      name: 'Pencarian Cepat',
      desc: 'Shortcut cari buku/anggota',
      icon: Search,
      action: () => {
        setIsMoreOpen(false);
        onOpenSearch();
      },
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30'
    },
    {
      name: 'Asisten AI',
      desc: 'Tanya rekomendasi pustaka',
      icon: Sparkles,
      action: () => {
        setIsMoreOpen(false);
        onOpenAi();
      },
      color: 'from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      name: 'Portal Publik (OPAC)',
      desc: 'Tampilan siswa & umum',
      icon: Globe,
      path: '/',
      color: 'from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/30'
    }
  ];

  return (
    <>
      {/* Docked Mobile Bottom Navigation Bar */}
      <nav 
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-2xl border-t border-white/10 z-40 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center justify-around relative max-w-md mx-auto">
          {/* 1. Dashboard */}
          <Link
            to="/dashboard"
            onClick={() => setIsMoreOpen(false)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive('/dashboard')
                ? 'text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive('/dashboard') ? 'bg-blue-600/20' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Dasbor</span>
          </Link>

          {/* 2. Koleksi Buku */}
          <Link
            to="/books"
            onClick={() => setIsMoreOpen(false)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive('/books')
                ? 'text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive('/books') ? 'bg-blue-600/20' : ''}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Koleksi</span>
          </Link>

          {/* 3. Center Elevated Action: Scan Barcode / QR */}
          <div className="relative -top-4 flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onOpenScan();
              }}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 border-2 border-slate-900 active:scale-95 transition-transform group"
              title="Pindai Barcode / QR Kamera"
            >
              <QrCode className="w-6 h-6 transition-transform group-hover:scale-110" />
            </button>
            <span className="text-[10px] font-semibold text-blue-400 tracking-tight mt-0.5">Scan</span>
          </div>

          {/* 4. Sirkulasi */}
          <Link
            to="/transactions"
            onClick={() => setIsMoreOpen(false)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive('/transactions')
                ? 'text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive('/transactions') ? 'bg-blue-600/20' : ''}`}>
              <Repeat className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Sirkulasi</span>
          </Link>

          {/* 5. Menu Lainnya (Bottom Sheet Drawer) */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isMoreOpen || ['/visitors', '/members', '/catalog', '/reports', '/settings'].includes(location.pathname)
                ? 'text-blue-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isMoreOpen ? 'bg-blue-600/20' : ''}`}>
              <Grid className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet Menu Drawer */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-45"
            />

            {/* Bottom Sheet Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 border-t border-white/10 rounded-t-3xl z-50 p-5 shadow-2xl max-h-[85vh] flex flex-col"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {/* Drag Pill Handle */}
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 shrink-0" />

              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Menu Perpustakaan</h3>
                  <p className="text-xs text-slate-400">Akses cepat seluruh fitur sistem</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Grid Items */}
              <div className="grid grid-cols-2 gap-2.5 overflow-y-auto py-1">
                {moreMenuItems.map((item) => {
                  const active = item.path ? isActive(item.path) : false;
                  const content = (
                    <div className={`p-3 rounded-2xl border transition-all text-left flex items-start gap-3 ${
                      active 
                        ? 'bg-blue-600/20 border-blue-500/50 shadow-md' 
                        : 'bg-slate-950/50 hover:bg-white/5 border-white/5'
                    }`}>
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 bg-gradient-to-br ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold leading-snug truncate ${active ? 'text-blue-300' : 'text-slate-200'}`}>
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );

                  if (item.action) {
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={item.action}
                        className="w-full text-left active:scale-98 transition-transform"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      to={item.path!}
                      onClick={() => setIsMoreOpen(false)}
                      className="block active:scale-98 transition-transform"
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-3 mt-2 border-t border-white/10 shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun Petugas</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
