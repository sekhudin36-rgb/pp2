import { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';

export default function Topbar() {
  const [libraryName, setLibraryName] = useState('Sistem Manajemen Perpustakaan');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.libraryName) setLibraryName(data.libraryName);
    }).catch(console.error);

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shrink-0 z-10 w-full relative">
      <div className="flex flex-col">
        <h2 className="text-xl font-semibold text-slate-50 tracking-tight">{libraryName}</h2>
        <p className="text-xs text-slate-400 capitalize">
          {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-slate-900"></span>
        </button>
        <div className="flex items-center gap-3 border-l border-white/10 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-50 leading-tight">Admin Master</p>
            <p className="text-[10px] text-slate-400">Pustakawan</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-400 flex items-center justify-center text-white font-bold tracking-tight shadow-md">
            AM
          </div>
        </div>
      </div>
    </header>
  );
}
