import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  ArrowRight, 
  BookPlus, 
  UserPlus, 
  Repeat, 
  FileText, 
  Database,
  ClipboardList,
  Sparkles,
  Camera,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { Book, Member, Transaction, Visitor } from '../types';

interface DashboardProps {
  onOpenScan?: () => void;
  onOpenAi?: () => void;
}

export default function Dashboard({ onOpenScan, onOpenAi }: DashboardProps) {
  const [stats, setStats] = useState({ 
    totalTitles: 0, 
    totalBooks: 0, 
    totalMembers: 0, 
    activeBorrows: 0, 
    chartData: [] 
  });
  const [visitorsToday, setVisitorsToday] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [overdueList, setOverdueList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(res => res.json()).catch(() => ({})),
      fetch('/api/visitors').then(res => res.json()).catch(() => []),
      fetch('/api/transactions').then(res => res.json()).catch(() => [])
    ]).then(([dashData, visitorsData, txsData]) => {
      setStats(dashData || {});
      
      // Calculate visitors today
      if (Array.isArray(visitorsData)) {
        const todayStr = new Date().toISOString().split('T')[0];
        const count = visitorsData.filter(v => v.visitedAt && v.visitedAt.startsWith(todayStr)).length;
        setVisitorsToday(count);
      }

      // Process recent & overdue transactions
      if (Array.isArray(txsData)) {
        setRecentTransactions(txsData.slice(0, 4));
        const today = new Date();
        const overdues = txsData.filter(t => t.status === 'borrowed' && new Date(t.dueDate) < today);
        setOverdueList(overdues.slice(0, 3));
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header with quick overview */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            Dashboard Utama
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistem Informasi Perpustakaan Sekolah Digital (Standar Dapodik & Akreditasi)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenAi && (
            <button
              onClick={onOpenAi}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Asisten AI</span>
            </button>
          )}
          {onOpenScan && (
            <button
              onClick={onOpenScan}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all shadow-sm"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>Scan Barcode</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Main KPI Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <ModernStatCard 
          title="Koleksi Pustaka (KIB E)" 
          value={stats.totalTitles || 0} 
          sub={`${stats.totalBooks || 0} Total Eksemplar`} 
          subColor="text-blue-400" 
          icon={BookOpen} 
          theme="blue"
          href="/books"
        />
        <ModernStatCard 
          title="Anggota Terdaftar" 
          value={stats.totalMembers || 0} 
          sub="Siswa, Guru & Tenaga Pendidik" 
          subColor="text-emerald-400" 
          icon={Users} 
          theme="emerald"
          href="/members"
        />
        <ModernStatCard 
          title="Peminjaman Aktif" 
          value={stats.activeBorrows || 0} 
          sub={overdueList.length > 0 ? `${overdueList.length} Perlu Pengembalian` : 'Sirkulasi Berjalan Lancar'} 
          subColor={overdueList.length > 0 ? 'text-rose-400' : 'text-amber-400'} 
          icon={Repeat} 
          theme="amber"
          href="/transactions"
        />
        <ModernStatCard 
          title="Pengunjung Hari Ini" 
          value={visitorsToday} 
          sub="Buku Tamu / Presensi Digital" 
          subColor="text-indigo-400" 
          icon={ClipboardList} 
          theme="indigo"
          href="/visitors"
        />
      </motion.div>

      {/* Action Shortcut Bar */}
      <motion.div variants={itemVariants} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white px-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Aksi Cepat Perpustakaan:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/visitors"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-medium transition-all"
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-400" /> Presensi Masuk
          </Link>
          <Link
            to="/transactions"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-xs font-medium transition-all"
          >
            <Repeat className="w-3.5 h-3.5 text-blue-400" /> Pinjam / Kembalikan
          </Link>
          <Link
            to="/books"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium transition-all"
          >
            <BookPlus className="w-3.5 h-3.5 text-indigo-400" /> Input Buku KIB E
          </Link>
          <Link
            to="/members"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-medium transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 text-purple-400" /> Tambah Anggota
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-medium transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" /> Cetak Laporan
          </Link>
        </div>
      </motion.div>

      {/* Chart & Dapodik Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Circulation Chart */}
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Trend Sirkulasi & Kunjungan (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik transaksi peminjaman buku dan pengembalian</p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 w-fit">
              Real-Time Metrics
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPeng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    color: '#f8fafc', 
                    boxShadow: '0 20px 30px -10px rgba(0,0,0,0.5)' 
                  }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="peminjaman" name="Peminjaman" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorPem)" activeDot={{ r: 6, strokeWidth: 0, fill: '#60a5fa' }} />
                <Area type="monotone" dataKey="pengembalian" name="Pengembalian" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorPeng)" activeDot={{ r: 6, strokeWidth: 0, fill: '#34d399' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right 1 Col: Dapodik Engine & Server Health */}
        <motion.div variants={itemVariants} className="col-span-1 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Sistem & Sinkronisasi
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Arsitektur hibrida Dapodik Style: aplikasi berfungsi optimal dalam kondisi offline tanpa internet, dan dapat disinkronkan kapan saja.
            </p>

            <div className="space-y-2.5 my-5 bg-black/30 p-4 rounded-2xl border border-white/5 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Mode Sistem</span>
                <span className="text-emerald-400 font-bold">Offline & Online</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Penyimpanan Lokal</span>
                <span className="text-blue-300 font-medium">data.json / SQLite Ready</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Enkripsi & Sesi</span>
                <span className="text-indigo-300">Aktif Terproteksi</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Versi Engine</span>
                <span className="text-slate-200">v3.0 (Smart Dapodik)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Link 
              to="/settings" 
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Database className="w-4 h-4 text-blue-400" /> Cadangkan & Sinkronkan Data
            </Link>
            <Link 
              to="/reports" 
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20"
            >
              Cetak Laporan KIB E & Sirkulasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Overdue Alert Table & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Warnings Card */}
        <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Peringatan Jatuh Tempo ({overdueList.length})
            </h3>
            <Link to="/transactions" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              Lihat Sirkulasi <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {overdueList.length === 0 ? (
            <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs text-slate-300 font-medium">Bagus! Tidak ada buku yang melewati batas tenggat.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Semua peminjaman tercatat dalam status aktif aman.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueList.map(t => (
                <div key={t.id} className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-rose-200">{t.book?.title || 'Judul Buku'}</h4>
                    <p className="text-[11px] text-rose-300/80 mt-0.5">Peminjam: {t.member?.name || 'Siswa'}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                      Jatuh Tempo: {t.dueDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Transactions Feed */}
        <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Aktivitas Sirkulasi Terkini
            </h3>
            <Link to="/transactions" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
              Semua Riwayat <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-white/5 rounded-2xl">
              Belum ada transaksi peminjaman tercatat.
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(t => (
                <div key={t.id} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between text-xs transition-colors">
                  <div className="min-w-0 pr-3">
                    <h4 className="font-semibold text-white truncate">{t.book?.title || 'Judul Buku'}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.member?.name} • Pinjam: {new Date(t.borrowDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    t.status === 'returned' 
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                      : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                  }`}>
                    {t.status === 'returned' ? 'Dikembalikan' : 'Dipinjam'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

function ModernStatCard({ title, value, sub, subColor, icon: Icon, theme, href }: any) {
  const themeMap: any = {
    blue: 'from-blue-600/20 to-indigo-600/5 text-blue-400 border-blue-500/25 hover:border-blue-500/40',
    emerald: 'from-emerald-600/20 to-teal-600/5 text-emerald-400 border-emerald-500/25 hover:border-emerald-500/40',
    amber: 'from-amber-600/20 to-orange-600/5 text-amber-400 border-amber-500/25 hover:border-amber-500/40',
    indigo: 'from-indigo-600/20 to-purple-600/5 text-indigo-400 border-indigo-500/25 hover:border-indigo-500/40'
  };

  return (
    <Link 
      to={href}
      className={`block bg-gradient-to-br ${themeMap[theme]} backdrop-blur-xl border p-5 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-3 relative z-10">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</p>
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-4 h-4 opacity-90" />
        </div>
      </div>
      <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight relative z-10">{value}</h3>
      <p className={`text-[11px] font-semibold pt-2.5 mt-2 border-t border-white/5 relative z-10 flex items-center justify-between ${subColor}`}>
        <span>{sub}</span>
        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </p>
    </Link>
  );
}
