import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Bookmark, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  Filter, 
  User, 
  FileText, 
  Layers, 
  MapPin, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  RefreshCw, 
  Printer, 
  ChevronRight, 
  Info, 
  Library, 
  BookMarked,
  Phone,
  ShieldCheck,
  QrCode,
  Eye,
  ExternalLink,
  LogIn,
  Download
} from 'lucide-react';
import { Book, Member, BorrowRequest, SettingsData } from '../types';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { downloadBorrowRequestPdf } from '../utils/borrowPdf';

interface PortalProps {
  onBackToApp?: () => void;
  isAuthenticated?: boolean;
}

export default function Portal({ onBackToApp, isAuthenticated = false }: PortalProps) {
  const { showToast } = useToast();

  // Tab navigation: 'search' | 'request' | 'track'
  const [activeTab, setActiveTab] = useState<'search' | 'request' | 'track'>('search');

  // Data
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'ebook'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'stock'>('title');

  // Selected book for details modal or borrowing request
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [readingBook, setReadingBook] = useState<Book | null>(null);

  // Form State for Request
  const [requestBook, setRequestBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({
    nisNip: '',
    requesterName: '',
    requesterRole: 'Siswa' as 'Siswa' | 'Guru' | 'Staf' | 'Umum',
    requesterClass: '',
    phone: '',
    pickupDate: new Date().toISOString().split('T')[0],
    durationDays: 7,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<BorrowRequest | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tracking state
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackingResults, setTrackingResults] = useState<BorrowRequest[]>([]);
  const [isSearchingTracking, setIsSearchingTracking] = useState(false);
  const [hasSearchedTracking, setHasSearchedTracking] = useState(false);

  // Initial Load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [bRes, mRes, sRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/members'),
        fetch('/api/settings')
      ]);

      if (bRes.ok) setBooks(await bRes.json());
      if (mRes.ok) setMembers(await mRes.json());
      if (sRes.ok) {
        const sData = await sRes.json();
        setSettings(sData);
        if (sData.maxBorrowDays) {
          setFormData(prev => ({ ...prev, durationDays: sData.maxBorrowDays }));
        }
      }
    } catch (err) {
      console.error('Error loading portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill member details by NIS/NIP
  const handleNisLookup = (val: string) => {
    setFormData(prev => ({ ...prev, nisNip: val }));
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return;

    const matched = members.find(m => 
      m.nisNip?.toLowerCase() === trimmed || 
      m.id?.toLowerCase() === trimmed
    );

    if (matched) {
      setFormData(prev => ({
        ...prev,
        requesterName: matched.name,
        requesterRole: matched.role || 'Siswa',
        requesterClass: matched.kelas || '',
        phone: matched.phone || prev.phone
      }));
      showToast(`Data anggota ditemukan: ${matched.name}`, 'info');
    }
  };

  // Select a book to request
  const handleSelectBookToBorrow = (book: Book) => {
    setRequestBook(book);
    setActiveTab('request');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Buku "${book.title}" dipilih untuk pengajuan`, 'info');
  };

  // Handle submit request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestBook) {
      showToast('Silakan pilih buku yang ingin dipinjam terlebih dahulu', 'error');
      return;
    }
    if (!formData.nisNip.trim() || !formData.requesterName.trim()) {
      showToast('Mohon lengkapi NIS/NIP dan Nama Pemohon', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/borrow-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: requestBook.id,
          nisNip: formData.nisNip.trim(),
          requesterName: formData.requesterName.trim(),
          requesterRole: formData.requesterRole,
          requesterClass: formData.requesterClass.trim(),
          phone: formData.phone.trim(),
          pickupDate: formData.pickupDate,
          durationDays: formData.durationDays,
          notes: formData.notes.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengirim pengajuan');
      }

      const createdTicket: BorrowRequest = await res.json();
      setSubmittedTicket(createdTicket);
      setIsTicketModalOpen(true);
      showToast('Pengajuan peminjaman berhasil dikirim!', 'success');

      // Reset form
      setRequestBook(null);
      setFormData({
        nisNip: '',
        requesterName: '',
        requesterRole: 'Siswa',
        requesterClass: '',
        phone: '',
        pickupDate: new Date().toISOString().split('T')[0],
        durationDays: settings?.maxBorrowDays || 7,
        notes: ''
      });
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Search tracking requests
  const handleTrackSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackingQuery.trim()) {
      showToast('Masukkan kode pengajuan atau NIS/NIP Anda', 'info');
      return;
    }

    setIsSearchingTracking(true);
    setHasSearchedTracking(true);
    try {
      const q = encodeURIComponent(trackingQuery.trim());
      const res = await fetch(`/api/borrow-requests?query=${q}`);
      if (res.ok) {
        const list = await res.json();
        setTrackingResults(list);
      }
    } catch (err) {
      showToast('Gagal memuat status pengajuan', 'error');
    } finally {
      setIsSearchingTracking(false);
    }
  };

  // Copy Ticket Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('Kode pengajuan disalin ke clipboard', 'success');
  };

  // Filter Categories
  const categories = ['Semua', ...Array.from(new Set(books.map(b => b.category).filter(Boolean)))];

  // Filtered Books for OPAC Search
  const filteredBooks = books.filter(book => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || (
      (book.title || '').toLowerCase().includes(q) ||
      (book.author || '').toLowerCase().includes(q) ||
      (book.publisher || '').toLowerCase().includes(q) ||
      (book.isbn || '').toLowerCase().includes(q) ||
      (book.register || '').toLowerCase().includes(q) ||
      (book.category || '').toLowerCase().includes(q) ||
      (book.shelfLocation || '').toLowerCase().includes(q)
    );

    const matchCategory = selectedCategory === 'Semua' || book.category === selectedCategory;

    let matchAvailability = true;
    if (selectedAvailability === 'available') {
      matchAvailability = (book.stock ?? 0) > 0;
    } else if (selectedAvailability === 'ebook') {
      matchAvailability = !!book.ebookUrl;
    }

    return matchQuery && matchCategory && matchAvailability;
  }).sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'year') return (b.year || '').localeCompare(a.year || '');
    if (sortBy === 'stock') return (b.stock || 0) - (a.stock || 0);
    return 0;
  });

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-1/4 w-[45%] h-[400px] bg-blue-600/15 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-5%] w-[35%] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-[-5%] w-[40%] h-[350px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white shrink-0">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">e-perpus</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                Halaman Utama
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-md">
              {settings?.institutionName || 'SMP Negeri 1 Belajar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={onBackToApp}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Library className="w-4 h-4" />
              <span className="hidden sm:inline">Panel Petugas Perpustakaan</span>
              <span className="sm:hidden">Panel Petugas</span>
            </button>
          ) : (
            <button
              onClick={onBackToApp}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-4 h-4 text-blue-400" />
              <span>Masuk Petugas / Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Banner with Navigation Tabs */}
      <section className="relative px-4 sm:px-8 pt-8 pb-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Layanan Katalog Terpadu & Peminjaman Mandiri
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Cari Koleksi Buku & Ajukan Pinjam Online
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Temukan ribuan referensi buku pelajaran, fiksi, dan sains di perpustakaan sekolah. Ajukan peminjaman langsung dari gadget Anda tanpa antre.
          </p>
        </div>

        {/* Tab Buttons Switcher */}
        <div className="flex items-center justify-center">
          <div className="p-1.5 bg-slate-900/90 border border-white/10 rounded-2xl flex items-center gap-1.5 shadow-2xl backdrop-blur-md max-w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Pencarian Buku (OPAC)</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md ml-1 font-mono">
                {books.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('request')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'request'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Form Pengajuan Pinjam</span>
              {requestBook && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                activeTab === 'track'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Lacak Status Pengajuan</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 pb-16">
        
        {/* ===================== TAB 1: PENCARIAN BUKU (OPAC) ===================== */}
        {activeTab === 'search' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search Input Bar */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul buku, penulis, penerbit, nomor ISBN, atau nomor register rak..."
                  className="w-full pl-12 pr-10 py-3.5 bg-slate-950/70 border border-white/10 rounded-2xl text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded-lg"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:max-w-2xl">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Secondary Select Filters */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selectedAvailability}
                    onChange={(e: any) => setSelectedAvailability(e.target.value)}
                    className="bg-slate-800 border border-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Semua Ketersediaan</option>
                    <option value="available">Tersedia untuk Dipinjam</option>
                    <option value="ebook">Hanya E-Book Digital</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-slate-800 border border-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="title">Urutkan: Judul (A-Z)</option>
                    <option value="year">Urutkan: Tahun Terbaru</option>
                    <option value="stock">Urutkan: Stok Terbanyak</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count & Notification */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Menampilkan <strong className="text-white">{filteredBooks.length}</strong> buku dari total {books.length} koleksi perpustakaan
              </span>
              {selectedCategory !== 'Semua' && (
                <button 
                  onClick={() => { setSelectedCategory('Semua'); setSearchQuery(''); setSelectedAvailability('all'); }}
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Books Grid Cards */}
            {loading ? (
              <div className="p-16 text-center">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Memuat katalog perpustakaan...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-white/5">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-200">Tidak ada buku yang cocok</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  Silakan coba gunakan kata kunci judul atau penulis lain, atau ubah filter kategori.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); setSelectedAvailability('all'); }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow"
                >
                  Tampilkan Semua Buku
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredBooks.map((book) => {
                  const isAvailable = (book.stock ?? 0) > 0;
                  return (
                    <div 
                      key={book.id}
                      className="group bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-blue-500/40 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 relative overflow-hidden"
                    >
                      {/* Top Accent Strip */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500/40 via-indigo-500/40 to-transparent group-hover:from-blue-500 group-hover:to-indigo-500 transition-all"></div>

                      <div>
                        {/* Header Badges */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                            {book.category || 'Umum'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 ${
                            isAvailable 
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' 
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                            {isAvailable ? `Sisa ${book.stock} Eks` : 'Habis Dipinjam'}
                          </span>
                        </div>

                        {/* Title & Author */}
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors mb-1.5">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium truncate mb-3">
                          Penulis: <span className="text-slate-200">{book.author || 'Tidak dicantumkan'}</span>
                        </p>

                        {/* Metadata Snippet */}
                        <div className="space-y-1 text-[11px] text-slate-400 bg-black/20 p-2.5 rounded-xl border border-white/5 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Penerbit & Tahun</span>
                            <span className="font-medium text-slate-300 truncate max-w-[130px]">{book.publisher || '-'} ({book.year || '-'})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Lokasi Rak</span>
                            <span className="font-semibold text-indigo-300 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-indigo-400" />
                              {book.shelfLocation || 'Rak Koleksi'}
                            </span>
                          </div>
                          {book.isbn && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">ISBN</span>
                              <span className="font-mono text-slate-300">{book.isbn}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleSelectBookToBorrow(book)}
                          disabled={!isAvailable}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                            isAvailable
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-98'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isAvailable ? 'Ajukan Pinjam Buku Ini' : 'Stok Sedang Kosong'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setDetailBook(book); setIsDetailOpen(true); }}
                            className="flex-1 py-1.5 px-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold border border-white/5 flex items-center justify-center gap-1"
                          >
                            <Info className="w-3.5 h-3.5 text-blue-400" />
                            <span>Info & Sinopsis</span>
                          </button>

                          {book.ebookUrl && (
                            <button
                              onClick={() => setReadingBook(book)}
                              className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl text-[11px] font-semibold border border-indigo-500/30 flex items-center gap-1"
                              title="Buka E-Book Digital"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>E-Book</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: FORM PENGAJUAN PINJAM ===================== */}
        {activeTab === 'request' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Form Container */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Send className="w-6 h-6 text-blue-400" />
                  Formulir Pengajuan Peminjaman Buku
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Isi data identitas pemohon dan buku yang ingin dipinjam. Petugas perpustakaan akan memproses dan menyiapkan buku Anda di meja piket sirkulasi.
                </p>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-6">
                
                {/* 1. Buku Yang Dipilih */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      1. Buku yang Diajukan
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('search')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                    >
                      Cari dari Katalog <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {requestBook ? (
                    <div className="flex items-start justify-between gap-3 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                          {requestBook.category}
                        </span>
                        <h4 className="font-bold text-white text-sm mt-1 truncate">{requestBook.title}</h4>
                        <p className="text-xs text-slate-400 truncate">
                          Penulis: {requestBook.author} • Lokasi: {requestBook.shelfLocation || 'Rak Koleksi'}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                          Stok Tersedia: {requestBook.stock} Eksemplar
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRequestBook(null)}
                        className="text-xs text-slate-400 hover:text-rose-400 p-1 rounded-lg"
                      >
                        Ganti
                      </button>
                    </div>
                  ) : (
                    <div>
                      <select
                        required
                        value=""
                        onChange={(e) => {
                          const b = books.find(item => item.id === e.target.value);
                          if (b) setRequestBook(b);
                        }}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Pilih Buku dari Koleksi Perpustakaan --</option>
                        {books.map(b => (
                          <option key={b.id} value={b.id} disabled={(b.stock ?? 0) <= 0}>
                            {b.title} - {b.author} (Stok: {b.stock})
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Tips: Anda juga dapat mengklik tombol "Ajukan Pinjam" langsung dari halaman Pencarian Buku (OPAC).
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Identitas Pemohon */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-400" />
                      2. Identitas Pemohon (Siswa / Guru)
                    </label>
                    <span className="text-[11px] text-slate-500">Auto-deteksi via NIS/NIP</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Nomor Induk (NIS / NISN / NIP) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nisNip}
                        onChange={(e) => handleNisLookup(e.target.value)}
                        placeholder="Contoh: 2024001 atau 1985..."
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Ketikkan nomor anggota/NIS untuk melengkapi nama secara otomatis.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Nama Lengkap Pemohon *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.requesterName}
                        onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                        placeholder="Masukkan nama lengkap Anda"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Peran / Status Pemohon
                      </label>
                      <select
                        value={formData.requesterRole}
                        onChange={(e: any) => setFormData({ ...formData, requesterRole: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Siswa">Siswa</option>
                        <option value="Guru">Guru / Tenaga Pendidik</option>
                        <option value="Staf">Staf Tata Usaha</option>
                        <option value="Umum">Masyarakat / Alumni</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Kelas / Departemen
                      </label>
                      <input
                        type="text"
                        value={formData.requesterClass}
                        onChange={(e) => setFormData({ ...formData, requesterClass: e.target.value })}
                        placeholder="Contoh: 7-A, 8-B, atau Guru Mapel IPA"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Nomor WhatsApp / HP (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Contoh: 081234567890 (untuk info pengambilan)"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Waktu & Rencana Pengambilan */}
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    3. Rencana Pengambilan & Durasi
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Tanggal Rencana Pengambilan di Perpustakaan
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.pickupDate}
                        onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Buku akan disiapkan di loker/meja sirkulasi sesuai tanggal ini.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Durasi Peminjaman
                      </label>
                      <select
                        value={formData.durationDays}
                        onChange={(e) => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={3}>3 Hari (Tugas Singkat)</option>
                        <option value={7}>7 Hari (Standar Perpustakaan)</option>
                        <option value={14}>14 Hari (Kajian & Ujian)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Catatan Tambahan / Keperluan Peminjaman (Opsional)
                      </label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Contoh: Untuk referensi tugas kelompok IPS bab 2 atau persiapan lomba literasi"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !requestBook}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengirim Pengajuan...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Pengajuan Peminjaman</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: LACAK STATUS PENGAJUAN ===================== */}
        {activeTab === 'track' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Search Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                  <Clock className="w-6 h-6 text-blue-400" />
                  Lacak Status Pengajuan Peminjaman
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Ketikkan <strong>Kode Pengajuan</strong> (contoh: <code>REQ-2609-001</code>) atau <strong>Nomor Induk (NIS/NIP)</strong> Anda untuk memantau apakah buku sudah disetujui dan siap diambil.
                </p>
              </div>

              <form onSubmit={handleTrackSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    placeholder="Masukkan Kode Pengajuan (REQ-...) atau NIS/NIP Anda..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingTracking}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
                >
                  {isSearchingTracking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Lacak Status</span>
                </button>
              </form>
            </div>

            {/* Results List */}
            {hasSearchedTracking && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Hasil Pelacakan Pengajuan ({trackingResults.length})</span>
                  <button 
                    onClick={() => handleTrackSearch()} 
                    className="text-blue-400 text-xs flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Perbarui
                  </button>
                </h3>

                {trackingResults.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-white/5">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-200 text-sm">Tidak ditemukan pengajuan dengan kata kunci tersebut</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Pastikan Anda memasukkan Kode Pengajuan atau NIS/NIP yang benar saat mengajukan peminjaman.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trackingResults.map((req) => {
                      let statusBadge = (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                          Menunggu Persetujuan Petugas
                        </span>
                      );

                      if (req.status === 'approved') {
                        statusBadge = (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Disetujui & Siap Diambil di Perpustakaan!
                          </span>
                        );
                      } else if (req.status === 'fulfilled') {
                        statusBadge = (
                          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-blue-400" />
                            Buku Sudah Diambil (Aktif Dipinjam)
                          </span>
                        );
                      } else if (req.status === 'rejected') {
                        statusBadge = (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            Pengajuan Ditolak
                          </span>
                        );
                      }

                      return (
                        <div 
                          key={req.id}
                          className="p-5 rounded-2xl bg-slate-900/70 border border-white/10 space-y-4 shadow-lg relative overflow-hidden"
                        >
                          {/* Status Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-blue-400">{req.requestCode}</span>
                                <span className="text-xs text-slate-500">•</span>
                                <span className="text-xs text-slate-400">
                                  {new Date(req.requestedAt).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-white mt-1">
                                {req.bookTitle}
                              </h4>
                            </div>
                            <div>{statusBadge}</div>
                          </div>

                          {/* Detail Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-white/5">
                            <div>
                              <span className="text-slate-500 block">Pemohon:</span>
                              <span className="font-semibold text-slate-200">
                                {req.requesterName} ({req.requesterRole} {req.requesterClass ? `- ${req.requesterClass}` : ''})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Nomor Induk:</span>
                              <span className="font-mono text-slate-300">{req.nisNip}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Rencana Ambil:</span>
                              <span className="font-semibold text-slate-200">{req.pickupDate}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Durasi Pinjam:</span>
                              <span className="font-semibold text-slate-200">{req.durationDays} Hari</span>
                            </div>
                          </div>

                          {/* Admin Notes If any */}
                          {req.adminNotes && (
                            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs">
                              <span className="font-bold text-blue-400 flex items-center gap-1 mb-1">
                                <Info className="w-3.5 h-3.5" /> Catatan Petugas Perpustakaan:
                              </span>
                              <p className="text-slate-300 leading-relaxed">{req.adminNotes}</p>
                            </div>
                          )}

                          {/* Instructions when Approved */}
                          {req.status === 'approved' && (
                            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 text-emerald-300 font-medium">
                                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span>Buku Anda telah siap! Silakan tunjukkan Kode Pengajuan atau Kartu Pelajar kepada petugas di meja sirkulasi.</span>
                              </div>
                              <button
                                onClick={() => handleCopyCode(req.requestCode)}
                                className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 border border-emerald-500/30"
                              >
                                <Copy className="w-3 h-3" /> Salin Kode
                              </button>
                            </div>
                          )}

                          {/* Tombol Unduh PDF Bukti Pengajuan Sementara */}
                          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>Dokumen Bukti Pengajuan Resmi</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                downloadBorrowRequestPdf(req, settings);
                                showToast('Mengunduh bukti pengajuan PDF...', 'info');
                              }}
                              className="px-3.5 py-1.5 bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-300 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/10 hover:border-emerald-500/30 transition-all shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Unduh Bukti PDF</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-slate-900/60 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {settings?.libraryName || 'E-Perpus'} - {settings?.institutionName || 'SMP Negeri 1 Belajar'}</p>
        <p className="mt-1 text-[11px] text-slate-600">Sistem Informasi Perpustakaan Terpadu Mandiri (OPAC & Peminjaman Online)</p>
      </footer>

      {/* ===================== MODAL BUKTI PENGAJUAN (TIKET RESMI) ===================== */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title="Tiket Bukti Pengajuan Peminjaman"
      >
        {submittedTicket && (
          <div className="space-y-5 text-slate-200">
            {/* Header Notification */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="font-bold text-white text-base">Pengajuan Anda Berhasil Terkirim!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Simpan atau catat Kode Pengajuan di bawah ini untuk ditunjukkan kepada petugas perpustakaan sekolah.
              </p>
            </div>

            {/* Ticket Card View */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-white/10 space-y-3 font-sans relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">KODE TIKET PENGAJUAN</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                  Status: Menunggu Persetujuan
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="font-mono text-xl sm:text-2xl font-black text-blue-400 tracking-wider">
                  {submittedTicket.requestCode}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(submittedTicket.requestCode)}
                  className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-500/30"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Judul Buku:</span>
                  <span className="font-bold text-white text-right max-w-[200px] truncate">{submittedTicket.bookTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Pemohon:</span>
                  <span className="font-medium text-slate-200">{submittedTicket.requesterName} ({submittedTicket.nisNip})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rencana Pengambilan:</span>
                  <span className="font-medium text-emerald-400">{submittedTicket.pickupDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Durasi Peminjaman:</span>
                  <span className="font-medium text-slate-200">{submittedTicket.durationDays} Hari</span>
                </div>
              </div>
            </div>

            {/* Tombol Unduh PDF Bukti Pengajuan Sementara */}
            <button
              type="button"
              onClick={() => {
                downloadBorrowRequestPdf(submittedTicket, settings);
                showToast('Bukti pengajuan peminjaman PDF berhasil diunduh', 'success');
              }}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Bukti Pengajuan Sementara (Format PDF)</span>
            </button>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsTicketModalOpen(false);
                  setTrackingQuery(submittedTicket.requestCode);
                  setActiveTab('track');
                  handleTrackSearch();
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold text-center transition-colors"
              >
                Lihat di Status Pelacak
              </button>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-md"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================== MODAL DETAIL BUKU & SINOPSIS ===================== */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail & Informasi Buku"
      >
        {detailBook && (
          <div className="space-y-4 text-slate-200 max-h-[80vh] overflow-y-auto pr-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-md">
                  {detailBook.category || 'Umum'}
                </span>
                <h3 className="text-lg font-black text-white mt-1.5 leading-snug">
                  {detailBook.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Karya: <strong className="text-slate-200">{detailBook.author || 'Tidak dicantumkan'}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 block">Stok Perpustakaan:</span>
                <span className={`text-sm font-black ${(detailBook.stock ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {detailBook.stock} Eksemplar
                </span>
              </div>
            </div>

            {/* Book Meta Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3.5 rounded-xl border border-white/10">
              <div>
                <span className="text-slate-500 block">Penerbit:</span>
                <span className="font-medium text-slate-200">{detailBook.publisher || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tahun Terbit:</span>
                <span className="font-medium text-slate-200">{detailBook.year || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Nomor ISBN:</span>
                <span className="font-mono text-slate-200">{detailBook.isbn || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Lokasi Rak:</span>
                <span className="font-semibold text-indigo-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {detailBook.shelfLocation || 'Koleksi Utama'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Nomor Register:</span>
                <span className="font-mono text-slate-200">{detailBook.register || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kondisi Fisik:</span>
                <span className="font-medium text-slate-200">{detailBook.condition || 'Baik'}</span>
              </div>
            </div>

            {/* Synopsis / Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Sinopsis & Ringkasan Buku
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto">
                {detailBook.description || 'Sinopsis buku belum tersedia di sistem.'}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={(detailBook.stock ?? 0) <= 0}
                onClick={() => {
                  setIsDetailOpen(false);
                  handleSelectBookToBorrow(detailBook);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ajukan Pinjam Buku Ini</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================== MODAL DIGITAL READER PREVIEW ===================== */}
      <Modal
        isOpen={!!readingBook}
        onClose={() => setReadingBook(null)}
        title={`E-Book Reader: ${readingBook?.title || ''}`}
      >
        {readingBook && (
          <div className="space-y-4 text-slate-200">
            <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Format Digital</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">Tersedia Online</span>
              </div>
              <p className="text-xs text-slate-400">
                Anda dapat membaca cuplikan e-book atau membuka tautan materi literasi resmi:
              </p>
              {readingBook.ebookUrl ? (
                <a
                  href={readingBook.ebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all mt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Dokumen / Link E-Book ({readingBook.ebookUrl})</span>
                </a>
              ) : (
                <p className="text-xs text-slate-500 italic">Tautan PDF e-book belum dikaitkan.</p>
              )}
            </div>

            <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">Sinopsis Cepat:</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {readingBook.description || 'Tidak ada deskripsi teks.'}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setReadingBook(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
