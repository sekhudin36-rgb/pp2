import { useEffect, useState } from 'react';
import { BookOpen, Users, Clock, ArrowRight, BookPlus, UserPlus, Repeat, FileText, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalTitles: 0, totalBooks: 0, totalMembers: 0, activeBorrows: 0, chartData: [] });

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">Dashboard Utama</h1>
        <p className="text-sm text-slate-400 mt-1">Sistem Terpadu Manajemen Perpustakaan</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Koleksi" value={stats.totalTitles} sub={`${stats.totalBooks} Eksemplar`} subColor="text-blue-400" icon={BookOpen} color="blue" />
        <StatCard title="Total Anggota" value={stats.totalMembers} sub="Siswa & Guru Terdaftar" subColor="text-emerald-400" icon={Users} color="emerald" />
        <StatCard title="Modul Sirkulasi" value={stats.activeBorrows} sub="Peminjaman Aktif" subColor="text-amber-400" icon={Repeat} color="amber" />
        
        {/* Quick Actions Panel */}
        <div className="bg-gradient-to-br from-indigo-600/30 to-blue-600/30 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col justify-between shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-blue-400/20 blur-[60px] rounded-full pointer-events-none"></div>
          <h3 className="text-sm font-semibold text-white mb-4 relative z-10 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400"/> Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            <Link to="/transactions" className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-white/15 transition-all outline outline-1 outline-white/5 hover:outline-white/20 group">
              <Repeat className="w-5 h-5 text-indigo-300 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-medium text-slate-200">Sirkulasi</span>
            </Link>
            <Link to="/books" className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-white/15 transition-all outline outline-1 outline-white/5 hover:outline-white/20 group">
              <BookPlus className="w-5 h-5 text-blue-300 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-medium text-slate-200">Tambah Buku</span>
            </Link>
            <Link to="/members" className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-white/15 transition-all outline outline-1 outline-white/5 hover:outline-white/20 group">
              <UserPlus className="w-5 h-5 text-emerald-300 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-medium text-slate-200">Tambah Anggota</span>
            </Link>
            <Link to="/reports" className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-white/15 transition-all outline outline-1 outline-white/5 hover:outline-white/20 group">
              <FileText className="w-5 h-5 text-amber-300 mb-1.5 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-medium text-slate-200">Laporan</span>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <motion.div variants={itemVariants} className="col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-50 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-400" /> Trend Sirkulasi (7 Hari)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="peminjaman" name="Peminjaman" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorPem)" activeDot={{ r: 6, strokeWidth: 0, fill: '#60a5fa' }} />
                <Area type="monotone" dataKey="pengembalian" name="Pengembalian" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorPeng)" activeDot={{ r: 6, strokeWidth: 0, fill: '#34d399' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-span-1 bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>
          <h3 className="text-lg font-semibold mb-2 relative z-10 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Sistem Database
          </h3>
          <p className="text-slate-400 text-xs mb-6 relative z-10">Status konektivitas layanan operasional aplikasi ini berjalan dengan lancar tanpa ada error.</p>
          
          <div className="space-y-4 relative z-10 font-mono text-sm mt-auto mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-xs text-left">DB Engine</span>
              <span className="text-emerald-400 font-bold text-right text-xs">Terhubung Aktif</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-slate-400 text-xs text-left">Server Port</span>
              <span className="text-white bg-white/10 px-2 rounded text-xs text-right">3000 (Internal)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 text-xs text-left">Versi Server</span>
              <span className="text-indigo-300 text-xs text-right tracking-wider">v2.5.0-PRO</span>
            </div>
          </div>

          <Link to="/reports" className="w-full bg-blue-600/80 hover:bg-blue-500 text-white rounded-xl py-3 px-4 text-sm font-semibold transition-all flex items-center justify-center relative z-10 hover:shadow-lg hover:shadow-blue-500/20 outline outline-1 outline-blue-500">
            Pusat Cetak Laporan <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

// @ts-ignore
const Zap = ({className}: {className?: string}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

function StatCard({ title, value, sub, subColor, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} backdrop-blur-md border p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-${color}-500/10 group relative overflow-hidden`}>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${color}-500/10 rounded-full blur-[20px] transition-transform duration-500 group-hover:scale-150`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
         <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">{title}</p>
         <Icon className="w-5 h-5 opacity-80" />
      </div>
      <h3 className="text-4xl font-bold text-white relative z-10">{value}</h3>
      <p className={`text-[10px] uppercase tracking-wider pt-3 ${subColor} mt-2 font-bold border-t border-white/5 relative z-10`}>{sub}</p>
    </div>
  );
}
