import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Lock, User, Compass, ArrowRight, ArrowLeft, Key, Delete, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login({ onLogin, onOpenPortal }: { onLogin: () => void; onOpenPortal?: () => void }) {
  const [loginMode, setLoginMode] = useState<'pin' | 'password'>('pin');
  
  // PIN State
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  
  // Password State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [error, setError] = useState('');
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Focus PIN input when in PIN mode
  useEffect(() => {
    if (loginMode === 'pin') {
      pinInputRef.current?.focus();
    }
  }, [loginMode]);

  // Handle Physical Keyboard for PIN
  useEffect(() => {
    if (loginMode !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if target is an input field already handling it
      if (document.activeElement === pinInputRef.current) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length >= 4) {
          executePinLogin(pin);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loginMode, pin]);

  // Execute PIN Login
  const executePinLogin = async (pinValue: string) => {
    if (!pinValue || pinValue.trim().length < 4) {
      setError('PIN minimal 4 angka');
      return;
    }
    setError('');
    setPinLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        onLogin();
      } else {
        setError(data.error || 'PIN petugas tidak cocok.');
        setPin('');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungkan ke server.');
    } finally {
      setPinLoading(false);
    }
  };

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    // Auto-submit on 4th digit if it's the standard 4-digit PIN
    if (newPin.length === 4) {
      executePinLogin(newPin);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  // Password Login Submit
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordLoading(true);
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
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans flex items-center justify-center relative overflow-hidden py-10 px-4">
      {/* Mesh Background Decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900/60 backdrop-blur-xl border border-white/10 p-7 rounded-3xl shadow-2xl relative z-10"
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

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
            <Bookmark className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">e-perpus</h1>
          <p className="text-xs text-slate-400 mt-0.5">Sistem Manajemen Perpustakaan</p>
        </div>

        {/* Tab Switcher: PIN vs Username */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-white/10 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setLoginMode('pin');
              setError('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              loginMode === 'pin'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>PIN Petugas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('password');
              setError('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              loginMode === 'password'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Username</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-xs text-center"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {loginMode === 'pin' ? (
            <motion.div
              key="pin-mode"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* PIN Visual Indicators & Hidden Input */}
              <div className="relative text-center py-2">
                <input
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPin(val);
                    setError('');
                    if (val.length === 4) {
                      executePinLogin(val);
                    }
                  }}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                  autoFocus
                />

                <div className="flex justify-center items-center gap-3">
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = pin.length > index;
                    return (
                      <div
                        key={index}
                        className={`w-11 h-12 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                          isFilled
                            ? 'bg-blue-600/20 border-blue-500 text-white font-mono font-bold text-xl scale-105 shadow-md shadow-blue-500/20'
                            : 'bg-slate-950/60 border-slate-800 text-slate-600'
                        }`}
                      >
                        {isFilled ? '•' : ''}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Ketik 4-6 digit angka di keyboard atau tombol keypad berikut
                </p>
              </div>

              {/* Numeric Keypad for Mobile / Screen */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigit(num)}
                    disabled={pinLoading}
                    className="h-12 bg-slate-950/60 hover:bg-slate-800 active:bg-blue-600 text-white font-bold text-lg rounded-xl border border-white/5 hover:border-white/15 transition-all active:scale-95 flex items-center justify-center shadow-sm disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={pinLoading || pin.length === 0}
                  className="h-12 bg-slate-950/40 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl border border-white/5 transition-all active:scale-95 flex items-center justify-center disabled:opacity-40"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  disabled={pinLoading}
                  className="h-12 bg-slate-950/60 hover:bg-slate-800 active:bg-blue-600 text-white font-bold text-lg rounded-xl border border-white/5 hover:border-white/15 transition-all active:scale-95 flex items-center justify-center shadow-sm disabled:opacity-50"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={pinLoading || pin.length === 0}
                  className="h-12 bg-slate-950/40 hover:bg-slate-800/80 text-slate-400 hover:text-red-400 rounded-xl border border-white/5 transition-all active:scale-95 flex items-center justify-center disabled:opacity-40"
                  title="Hapus"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Manual Submit Button if user has entered 4-6 digits */}
              <button
                type="button"
                onClick={() => executePinLogin(pin)}
                disabled={pinLoading || pin.length < 4}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {pinLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Masuk Petugas</span>
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="password-mode"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handlePasswordLogin}
              className="space-y-4"
            >
              {/* Akun Bawaan / Credentials Helper Box */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-center justify-between gap-2">
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
                disabled={passwordLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {passwordLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Masuk ke Sistem</span>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {onOpenPortal && (
          <div className="pt-4">
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

        <div className="mt-6 text-center border-t border-white/5 pt-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            Developed by <span className="font-bold text-blue-400">Khabibu Rohman</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
