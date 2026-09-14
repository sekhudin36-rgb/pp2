import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Wifi, 
  WifiOff, 
  Camera, 
  Sparkles, 
  Menu, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  BookOpen
} from 'lucide-react';

interface TopbarProps {
  onOpenSearch?: () => void;
  onOpenScan?: () => void;
  onOpenAi?: () => void;
  onToggleMobileMenu?: () => void;
}

export default function Topbar({
  onOpenSearch,
  onOpenScan,
  onOpenAi,
  onToggleMobileMenu
}: TopbarProps) {
  const [libraryName, setLibraryName] = useState('E-Perpus');
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [overdueCount, setOverdueCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Load settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.libraryName) setLibraryName(data.libraryName);
      })
      .catch(console.error);

    // Load active user
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    // Check overdue loans for notification badge
    fetch('/api/transactions')
      .then(res => res.json())
      .then((txs: any[]) => {
        if (Array.isArray(txs)) {
          const today = new Date();
          const overdues = txs.filter(t => t.status === 'borrowed' && new Date(t.dueDate) < today);
          setOverdueCount(overdues.length);
        }
      })
      .catch(console.error);

    // Live clock
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Network listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-4 sm:px-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shrink-0 z-20 w-full relative">
      {/* Left: Mobile hamburger & Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl bg-white/5 text-slate-300 hover:text-white lg:hidden"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-50 tracking-tight">{libraryName}</h2>
            {/* Dapodik-style Online/Offline Badge */}
            <div 
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${
                isOnline 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
              title={isOnline ? 'Terhubung Online & Siap Sinkronisasi' : 'Mode Offline Siap (Data tersimpan di penyimpanan lokal)'}
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <Wifi className="w-3 h-3" /> Online / Dapodik Siap
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" /> Mode Offline Aktif
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block capitalize">
            {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>
      
      {/* Right: Quick actions, Search palette trigger, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global Spotlight / Quick Search Button */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs text-slate-300 transition-all shadow-sm group"
            title="Cari Cepat (Ctrl + K)"
          >
            <Search className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Cari cepat...</span>
            <kbd className="hidden md:inline px-1.5 py-0.5 text-[10px] font-mono bg-white/10 rounded text-slate-400 border border-white/5">Ctrl+K</kbd>
          </button>
        )}

        {/* Camera Barcode Scanner trigger */}
        {onOpenScan && (
          <button
            onClick={onOpenScan}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="Scan Barcode Kamera"
          >
            <Camera className="w-4 h-4 text-blue-400" />
            <span className="hidden lg:inline">Scan</span>
          </button>
        )}

        {/* AI Assistant trigger */}
        {onOpenAi && (
          <button
            onClick={onOpenAi}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="Tanya AI Pustakawan"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="hidden lg:inline">AI Pustakawan</span>
          </button>
        )}

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative p-2.5 text-slate-400 hover:text-white rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
            title="Pemberitahuan Sistem"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {overdueCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center shadow-lg">
                {overdueCount}
              </span>
            )}
          </button>

          {/* Notification Menu */}
          {showNotifications && (
            <div 
              className="absolute right-0 mt-3 w-80 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl p-4 z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-semibold text-white">Notifikasi Sistem</span>
                <span className="text-[10px] text-slate-400 font-mono">e-perpus live</span>
              </div>

              <div className="py-3 space-y-2 max-h-60 overflow-y-auto">
                {overdueCount > 0 ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-300">Peminjaman Terlambat</p>
                      <p className="text-[11px] text-rose-200/80 mt-0.5">
                        Terdapat {overdueCount} buku yang telah melewati batas waktu pengembalian.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Semua sirkulasi lancar dan tepat waktu.</span>
                  </div>
                )}

                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5 text-blue-200">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-300">Database Lokal Sinkron</p>
                    <p className="text-[11px] text-blue-200/80 mt-0.5">
                      Penyimpanan offline browser dan berkas data.json tersinkronisasi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Tutup Pemberitahuan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 border-l border-white/10 pl-3 sm:pl-4">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-100 leading-tight">
              {currentUser?.username || 'Admin Perpustakaan'}
            </p>
            <p className="text-[10px] text-blue-400 font-medium">
              {currentUser?.role || 'Pustakawan Ahli'}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm tracking-tight shadow-md shadow-blue-600/30">
            {(currentUser?.username || 'AD').substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
