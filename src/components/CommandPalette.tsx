import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  Users, 
  Repeat, 
  FileText, 
  Settings, 
  Plus, 
  ExternalLink,
  Sparkles,
  ClipboardList,
  Compass,
  X,
  LayoutDashboard,
  Globe
} from 'lucide-react';
import { Book, Member } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAi?: () => void;
  onOpenScan?: () => void;
}

export default function CommandPalette({ isOpen, onClose, onOpenAi, onOpenScan }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
        fetch('/api/books').then(res => res.json()).catch(() => []),
        fetch('/api/members').then(res => res.json()).catch(() => [])
      ]).then(([booksData, membersData]) => {
        setBooks(Array.isArray(booksData) ? booksData : []);
        setMembers(Array.isArray(membersData) ? membersData : []);
        setLoading(false);
      });
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredBooks = query.trim()
    ? books.filter(b => 
        b.title?.toLowerCase().includes(query.toLowerCase()) ||
        b.author?.toLowerCase().includes(query.toLowerCase()) ||
        b.register?.toLowerCase().includes(query.toLowerCase()) ||
        b.isbn?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const filteredMembers = query.trim()
    ? members.filter(m =>
        m.name?.toLowerCase().includes(query.toLowerCase()) ||
        m.nisNip?.toLowerCase().includes(query.toLowerCase()) ||
        m.kelas?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4)
    : [];

  const quickNav = [
    { label: 'Halaman Utama (Portal Cari & Pinjam Online)', path: '/', icon: Globe, desc: 'Layanan publik siswa dan guru' },
    { label: 'Dashboard Utama Petugas', path: '/dashboard', icon: LayoutDashboard, desc: 'Statistik & ringkasan aktivitas' },
    { label: 'Buku Kunjungan / Presensi', path: '/visitors', icon: ClipboardList, desc: 'Daftar kehadiran harian' },
    { label: 'Koleksi Buku (KIB E)', path: '/books', icon: BookOpen, desc: 'Kelola inventaris perpustakaan' },
    { label: 'Katalog Pencarian', path: '/catalog', icon: Compass, desc: 'Jelajahi buku dan rak' },
    { label: 'Sirkulasi & Peminjaman', path: '/transactions', icon: Repeat, desc: 'Peminjaman dan pengembalian' },
    { label: 'Data Anggota', path: '/members', icon: Users, desc: 'Siswa, guru, dan staf' },
    { label: 'Laporan & Statistik', path: '/reports', icon: FileText, desc: 'Cetak KIB E & sirkulasi' },
    { label: 'Pengaturan Sistem', path: '/settings', icon: Settings, desc: 'Profil sekolah dan akun' },
  ].filter(item => !query.trim() || item.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelectNav = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div 
        className="w-full max-w-2xl bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari judul buku, pengarang, nomor register, nama siswa/guru, atau menu..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-white text-base placeholder-slate-500 focus:outline-none focus:ring-0"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-500 px-2 py-0.5 rounded bg-white/5 border border-white/10">ESC</span>
        </div>

        {/* Quick Action Badges */}
        <div className="p-3 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs">
          {onOpenAi && (
            <button
              onClick={() => { onClose(); onOpenAi(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Tanya AI Pustakawan
            </button>
          )}
          {onOpenScan && (
            <button
              onClick={() => { onClose(); onOpenScan(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition-all shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" /> Scanner Barcode Kamera
            </button>
          )}
          <button
            onClick={() => handleSelectNav('/visitors')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all shrink-0"
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-400" /> Presensi Pengunjung
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-4 flex-1">
          {/* Books Result */}
          {filteredBooks.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Koleksi Buku ({filteredBooks.length})
              </p>
              <div className="space-y-1">
                {filteredBooks.map(b => (
                  <div
                    key={b.id}
                    onClick={() => handleSelectNav('/catalog')}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{b.title}</h4>
                      <p className="text-xs text-slate-400">{b.author} • Reg: {b.register} • Rak: {b.shelfLocation || '-'}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Stok: {b.stock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Result */}
          {filteredMembers.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Anggota Perpustakaan ({filteredMembers.length})
              </p>
              <div className="space-y-1">
                {filteredMembers.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectNav('/members')}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{m.name}</h4>
                      <p className="text-xs text-slate-400">{m.role} {m.kelas ? `• Kelas ${m.kelas}` : ''} • NIS/NIP: {m.nisNip}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Navigasi Halaman
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quickNav.map(item => (
                <button
                  key={item.path}
                  onClick={() => handleSelectNav(item.path)}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 text-left transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-white truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-500 truncate">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-xs text-slate-500 px-5">
          <span>Gunakan <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[10px]">Ctrl + K</kbd> untuk membuka kapan saja</span>
          <span>e-perpus Modern Engine</span>
        </div>
      </div>
    </div>
  );
}
