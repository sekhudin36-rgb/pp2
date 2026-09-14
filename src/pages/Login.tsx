import React, { useState } from 'react';
import { Bookmark, Lock, User, Compass, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login({ onLogin, onOpenPortal }: { onLogin: () => void; onOpenPortal?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        onLogin();
      } else {
        setError(data.error || 'Username atau password salah.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungkan ke server.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans flex items-center justify-center relative overflow-hidden">
      {/* Mesh Background Decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        {onOpenPortal && (
          <button
            type="button"
            onClick={onOpenPortal}
            className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Bookmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">e-perpus</h1>
          <p className="text-sm text-slate-400 mt-1">Sistem Manajemen Perpustakaan</p>
        </div>

        {/* Akun Bawaan / Credentials Helper Box */}
        <div className="mb-5 p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">Akun Bawaan (Default):</span>
            <div className="text-slate-200 mt-0.5 font-mono text-xs flex items-center gap-2">
              <span>User: <strong className="text-white">admin</strong></span>
              <span>•</span>
              <span>Pass: <strong className="text-white">admin</strong></span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setUsername('admin');
              setPassword('admin');
            }}
            className="text-[10px] font-bold bg-blue-600/40 hover:bg-blue-600/60 text-blue-200 border border-blue-500/40 px-2.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
          >
            Gunakan Akun
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-white/5 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-600"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 bg-slate-950/50 border border-white/5 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-600"
                placeholder="Masukkan password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 mt-6"
          >
            Masuk ke Sistem
          </button>

          {onOpenPortal && (
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">atau</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button
                type="button"
                onClick={onOpenPortal}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400 group-hover:rotate-45 transition-transform" />
                  <span>Portal Siswa & Pencarian Buku (OPAC)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            Developed by <span className="font-bold text-blue-400">Khabibu Rohman</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
