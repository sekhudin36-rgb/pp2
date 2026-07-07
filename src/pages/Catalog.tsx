import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Bookmark, 
  BookOpen, 
  Info, 
  MapPin, 
  Calendar, 
  Hash, 
  Printer, 
  Heart, 
  X, 
  Barcode, 
  QrCode, 
  Layers, 
  Languages, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Library
} from 'lucide-react';
import Modal from '../components/Modal';

interface Book {
  id: string;
  kodeBarang: string;
  register: string;
  title: string;
  author: string;
  publisher: string;
  year: string;
  isbn: string;
  category: string;
  stock: number;
  qtyTersedia?: number;
  qtyTerpakai?: number;
  qtyRusak?: number;
  source: string;
  price: number;
  condition: string;
  status: string;
  description: string;
  shelfLocation: string;
  language: string;
  pages: number;
  size?: string;
  material?: string;
  acquisitionYear?: string;
}

export default function Catalog() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedCondition, setSelectedCondition] = useState('Semua');
  const [selectedLanguage, setSelectedLanguage] = useState('Semua');
  const [selectedAvailability, setSelectedAvailability] = useState('Semua');
  
  // Modal & Selection
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showCatalogCard, setShowCatalogCard] = useState(false);
  
  // Wishlist / Bookmark
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('catalog_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Load books
  const fetchBooks = () => {
    setLoading(true);
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching books for catalog:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Sync wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('catalog_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Toggle Wishlist
  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Extract filter options dynamically
  const categories = ['Semua', ...Array.from(new Set(books.map(b => b.category).filter(Boolean)))];
  const languages = ['Semua', ...Array.from(new Set(books.map(b => b.language).filter(Boolean)))];

  // Filter logic
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.publisher && book.publisher.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (book.isbn && book.isbn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (book.register && book.register.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = selectedCategory === 'Semua' || book.category === selectedCategory;
    const matchesCondition = selectedCondition === 'Semua' || book.condition === selectedCondition;
    const matchesLanguage = selectedLanguage === 'Semua' || book.language === selectedLanguage;
    
    let matchesAvailability = true;
    if (selectedAvailability === 'Tersedia') {
      matchesAvailability = book.status === 'Tersedia' || (book.qtyTersedia && book.qtyTersedia > 0) || book.stock > 0;
    } else if (selectedAvailability === 'Dipinjam') {
      matchesAvailability = book.status === 'Terpakai' || (book.qtyTerpakai && book.qtyTerpakai > 0);
    } else if (selectedAvailability === 'Rusak') {
      matchesAvailability = book.condition === 'Rusak' || (book.qtyRusak && book.qtyRusak > 0);
    }

    return matchesSearch && matchesCategory && matchesCondition && matchesLanguage && matchesAvailability;
  });

  // Calculate stats
  const totalTitles = books.length;
  const totalCopies = books.reduce((sum, b) => sum + (b.stock || 0), 0);
  const totalAvailable = books.reduce((sum, b) => {
    const avail = b.qtyTersedia !== undefined ? b.qtyTersedia : (b.status === 'Tersedia' ? b.stock : 0);
    return sum + avail;
  }, 0);
  const totalBorrowed = books.reduce((sum, b) => {
    const borrowed = b.qtyTerpakai !== undefined ? b.qtyTerpakai : (b.status === 'Terpakai' ? b.stock : 0);
    return sum + borrowed;
  }, 0);

  // Artistic abstract Cover Background generator based on book ID or Title hash
  const getCoverGradient = (id: string, category: string) => {
    const colors = [
      'from-blue-600 to-indigo-900',
      'from-emerald-600 to-teal-900',
      'from-rose-600 to-red-900',
      'from-amber-500 to-orange-800',
      'from-purple-600 to-indigo-950',
      'from-violet-600 to-fuchsia-900',
      'from-cyan-500 to-blue-800',
      'from-pink-500 to-rose-900'
    ];
    
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }
    
    // Choose based on category to keep it consistent
    if (category === 'Fiksi') return colors[5]; // Violet
    if (category === 'Buku Paket') return colors[1]; // Emerald
    if (category === 'Referensi') return colors[3]; // Amber
    if (category === 'Teknologi') return colors[0]; // Blue
    if (category === 'Biografi') return colors[4]; // Purple
    if (category === 'Sejarah') return colors[2]; // Rose
    
    return colors[sum % colors.length];
  };

  const handleOpenDetail = (book: Book) => {
    setSelectedBook(book);
    setIsDetailOpen(true);
    setShowCatalogCard(false);
  };

  // Print single book catalog card
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              Katalog Publik
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Library className="w-3.5 h-3.5 text-blue-400" /> KIB E Aset Tetap Lainnya
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Katalog Koleksi Perpustakaan</h1>
          <p className="text-sm text-slate-400 mt-0.5">Telusuri seluruh koleksi buku, pustaka, dan aset buku sekolah secara real-time</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={fetchBooks}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700/50"
            title="Refresh Katalog"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Judul</p>
            <p className="text-xl font-bold text-white mt-0.5">{loading ? '...' : totalTitles}</p>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total Eksemplar</p>
            <p className="text-xl font-bold text-white mt-0.5">{loading ? '...' : totalCopies}</p>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Daftar Minat Saya</p>
            <p className="text-xl font-bold text-white mt-0.5">{wishlist.length}</p>
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Pilihan Kategori</p>
            <p className="text-xl font-bold text-white mt-0.5">{loading ? '...' : categories.length - 1}</p>
          </div>
        </div>
      </div>

      {/* Control Panel: Search & Filters */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Judul, Pengarang, Penerbit, Nomor Register, atau ISBN..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Switcher */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl self-end md:self-auto shrink-0">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Tampilan Grid Buku"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              title="Tampilan Daftar Rinci"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable / Inline Filters */}
        <div className="pt-2 border-t border-slate-800/40 flex flex-wrap gap-3">
          {/* Category Filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Kategori</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 outline-none focus:border-blue-500/50"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ketersediaan</span>
            <select
              value={selectedAvailability}
              onChange={e => setSelectedAvailability(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 outline-none focus:border-blue-500/50"
            >
              <option value="Semua">Semua Status</option>
              <option value="Tersedia">Dapat Dipinjam (Tersedia)</option>
              <option value="Dipinjam">Sedang Dipinjam</option>
              <option value="Rusak">Rusak</option>
            </select>
          </div>

          {/* Language Filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Bahasa</span>
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 outline-none focus:border-blue-500/50"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Condition Filter */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Kondisi Fisik</span>
            <select
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 outline-none focus:border-blue-500/50"
            >
              <option value="Semua">Semua Kondisi</option>
              <option value="Baik">Kondisi Baik</option>
              <option value="Kurang Baik">Kurang Baik</option>
              <option value="Rusak">Rusak Parah</option>
            </select>
          </div>

          {/* Wishlist filter shortcut button */}
          <div className="flex items-end ml-auto">
            <button
              onClick={() => {
                // If already filtering by wishlist, reset, otherwise filter
                if (selectedCategory === 'Wishlist') {
                  setSelectedCategory('Semua');
                } else {
                  setSelectedCategory('Semua');
                  // Quick trick to filter by bookmarks
                  // We'll set a special visual toggle or just show bookmarked items
                }
              }}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                wishlist.length > 0 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              disabled={wishlist.length === 0}
            >
              <Heart className={`w-3.5 h-3.5 ${wishlist.length > 0 ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>Daftar Minat ({wishlist.length})</span>
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(selectedCategory !== 'Semua' || selectedCondition !== 'Semua' || selectedLanguage !== 'Semua' || selectedAvailability !== 'Semua' || searchQuery) && (
          <div className="pt-2 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Menampilkan <span className="font-bold text-white">{filteredBooks.length}</span> dari {books.length} koleksi buku.
            </p>
            <button 
              onClick={() => {
                setSelectedCategory('Semua');
                setSelectedCondition('Semua');
                setSelectedLanguage('Semua');
                setSelectedAvailability('Semua');
                setSearchQuery('');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Display List/Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Memuat database katalog...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="bg-slate-900/10 border border-slate-800/40 rounded-3xl py-16 px-6 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Buku Tidak Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Tidak ada koleksi buku yang cocok dengan filter atau kata kunci pencarian Anda. Silakan coba kata kunci lain atau reset filter.
          </p>
          <button 
            onClick={() => {
              setSelectedCategory('Semua');
              setSelectedCondition('Semua');
              setSelectedLanguage('Semua');
              setSelectedAvailability('Semua');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Reset Pencarian
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map(book => {
            const isBookmarked = wishlist.includes(book.id);
            const coverGradient = getCoverGradient(book.id, book.category);
            
            // Available count calculations
            const availQty = book.qtyTersedia !== undefined ? book.qtyTersedia : (book.status === 'Tersedia' ? book.stock : 0);
            const isAvailable = availQty > 0;

            return (
              <div 
                key={book.id}
                onClick={() => handleOpenDetail(book)}
                className="group bg-slate-900/30 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] cursor-pointer flex flex-col h-[400px] shadow-sm relative"
              >
                {/* Book Cover Aesthetic Graphic */}
                <div className={`h-48 w-full bg-gradient-to-br ${coverGradient} relative p-4 flex flex-col justify-between overflow-hidden shadow-inner shrink-0`}>
                  {/* Subtle paper textures */}
                  <div className="absolute inset-0 bg-white/5 opacity-40 mix-blend-overlay"></div>
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-black/20 shadow-md"></div> {/* Book Spine highlight */}
                  
                  {/* Top Bar inside cover */}
                  <div className="flex justify-between items-start z-10">
                    <span className="px-2 py-0.5 rounded bg-black/40 backdrop-blur-md text-[9px] font-bold tracking-widest text-white/95 uppercase border border-white/10">
                      {book.category}
                    </span>
                    
                    {/* Wishlist Button */}
                    <button 
                      onClick={(e) => toggleWishlist(book.id, e)}
                      className="p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                    </button>
                  </div>

                  {/* Core Book Title On Cover */}
                  <div className="z-10 mt-2 mb-1">
                    <h4 className="text-white font-semibold text-sm leading-snug tracking-tight line-clamp-3 font-serif italic text-shadow">
                      {book.title}
                    </h4>
                    <p className="text-slate-300 text-[10px] mt-1 font-medium tracking-wide">
                      {book.author}
                    </p>
                  </div>

                  {/* Footer inside cover */}
                  <div className="flex justify-between items-center z-10 pt-2 border-t border-white/10 text-[9px] text-slate-300">
                    <span className="font-mono tracking-wider">Reg: {book.register}</span>
                    <span className="font-semibold">{book.year}</span>
                  </div>
                </div>

                {/* Content Panel */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-2">
                    {/* Availability Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                      isAvailable 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {isAvailable ? `Tersedia: ${availQty} Buku` : 'Habis Dipinjam'}
                    </span>

                    {/* Shelf Location */}
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <MapPin className="w-3 h-3 text-blue-400" /> {book.shelfLocation || 'Belum Diatur'}
                    </span>
                  </div>

                  {/* Meta Text */}
                  <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    Oleh {book.author}
                  </p>
                  
                  <div className="mt-2 text-[11px] text-slate-500 line-clamp-2 flex-grow">
                    {book.description || 'Tidak ada deskripsi synopsis untuk koleksi ini.'}
                  </div>

                  {/* Footer Info */}
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 font-mono shrink-0">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-600" /> {book.isbn || 'Tanpa ISBN'}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 font-sans">
                      Detail <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-blue-400" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/40 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Informasi Buku</th>
                  <th className="px-6 py-4">Register / Kode</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Lokasi Rak</th>
                  <th className="px-6 py-4">Bahasa / Hal</th>
                  <th className="px-6 py-4">Stok / Tersedia</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBooks.map(book => {
                  const availQty = book.qtyTersedia !== undefined ? book.qtyTersedia : (book.status === 'Tersedia' ? book.stock : 0);
                  const isAvailable = availQty > 0;
                  const isBookmarked = wishlist.includes(book.id);

                  return (
                    <tr 
                      key={book.id} 
                      onClick={() => handleOpenDetail(book)}
                      className="hover:bg-slate-800/10 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-10 rounded bg-gradient-to-br ${getCoverGradient(book.id, book.category)} shrink-0 shadow-sm flex items-center justify-center relative p-1`}>
                            <span className="text-[6px] text-white/90 leading-none font-serif text-center font-bold break-all line-clamp-2">
                              {book.title}
                            </span>
                            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-black/20"></div>
                          </div>
                          <div>
                            <span className="font-semibold text-white block leading-snug group-hover:text-blue-400 transition-colors">
                              {book.title}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              Oleh {book.author} • {book.publisher} ({book.year})
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <div className="text-slate-200">{book.register}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">{book.kodeBarang}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 font-medium">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {book.shelfLocation || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="text-slate-200">{book.language}</div>
                        <div className="text-slate-500 mt-0.5">{book.pages ? `${book.pages} hlm` : '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              {availQty} / {book.stock}
                            </span>
                            <span className="text-[10px] text-slate-500 block">Tersedia</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => toggleWishlist(book.id, e)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                            title="Masukkan Daftar Minat"
                          >
                            <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleOpenDetail(book)}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                            title="Detail Pustaka"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Catalog Book Detail & Indexing Card Modal */}
      {selectedBook && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={showCatalogCard ? "Format Kartu Indeks Katalog Perpustakaan" : "Rincian Informasi Buku (KIB E)"}
        >
          {showCatalogCard ? (
            /* PRINTABLE CATALOG CARD VIEW (3x5 Inch Standard Format) */
            <div className="space-y-6">
              <div className="p-1 bg-amber-50 rounded-xl border border-amber-200 shadow-md">
                {/* Official Library Index Card Design (White paper, thin lines, typewriter feel) */}
                <div id="catalog-card-print-area" className="p-8 bg-white text-slate-900 border border-slate-300 rounded-lg min-h-[300px] font-serif leading-relaxed text-sm relative">
                  {/* Spine hole representation for physical drawers */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-slate-300 bg-white shadow-inner flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                  </div>
                  
                  {/* Call number / classification left column */}
                  <div className="absolute left-8 top-8 w-24 font-mono text-xs space-y-1 text-slate-700 leading-tight">
                    <p className="font-bold border-b border-slate-200 pb-0.5">{selectedBook.shelfLocation || 'RAK'}</p>
                    <p>{selectedBook.kodeBarang ? selectedBook.kodeBarang.substring(0, 8) : '02.06'}</p>
                    <p className="font-semibold">Reg. {selectedBook.register}</p>
                    <p className="text-[10px] text-slate-500">{selectedBook.acquisitionYear || selectedBook.year}</p>
                  </div>

                  {/* Core description layout */}
                  <div className="pl-28 space-y-3">
                    {/* Main Entry Author name: Last name, First Name style */}
                    <div className="font-bold border-b border-slate-200 pb-1">
                      {selectedBook.author.split(' ').reverse().join(', ')}
                    </div>

                    {/* Title, statement of responsibility, publication */}
                    <div className="text-slate-800 text-[13px] leading-snug">
                      <span className="font-bold italic">{selectedBook.title}</span> / oleh {selectedBook.author}. -- Cet. {selectedBook.year}. -- {selectedBook.publisher || 'Perpustakaan'}, {selectedBook.year}.
                    </div>

                    {/* Physical description */}
                    <div className="text-slate-700 text-xs">
                      {selectedBook.pages || '0'} hlm. : il. ; {selectedBook.size || '21 cm'}. -- ({selectedBook.material || 'Kertas HVS'})
                    </div>

                    {/* ISBN and Subject tracings */}
                    <div className="text-slate-600 text-[11px] pt-4 font-sans space-y-1">
                      <p>ISBN {selectedBook.isbn || 'Tanpa ISBN'}</p>
                      <p className="text-slate-400 mt-2">
                        1. {selectedBook.category}. &nbsp;&nbsp; I. Judul. &nbsp;&nbsp; II. Penerbit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Utility panel inside catalog card */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
                <p>Kartu katalog di atas sesuai standar klasifikasi perpustakaan nasional (DDC).</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCatalogCard(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
                  >
                    Kembali Detail
                  </button>
                  <button
                    onClick={handlePrintCard}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Kartu</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* COMPREHENSIVE BOOK DETAILS */
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Book Cover Visual */}
                <div className="w-full md:w-48 shrink-0 flex flex-col gap-3">
                  <div className={`h-64 w-full bg-gradient-to-br ${getCoverGradient(selectedBook.id, selectedBook.category)} rounded-xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-white/5 opacity-40 mix-blend-overlay"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-black/20 shadow"></div>
                    
                    <span className="px-2.5 py-1 rounded bg-black/40 text-[9px] font-bold tracking-widest text-white uppercase border border-white/10 self-start z-10">
                      {selectedBook.category}
                    </span>

                    <div className="z-10 my-4">
                      <h4 className="text-white font-serif italic text-base leading-snug line-clamp-4 font-bold text-shadow">
                        {selectedBook.title}
                      </h4>
                      <p className="text-slate-300 text-xs mt-2">
                        {selectedBook.author}
                      </p>
                    </div>

                    <div className="flex justify-between items-center z-10 pt-2 border-t border-white/10 text-[10px] text-slate-300 font-mono">
                      <span>{selectedBook.register}</span>
                      <span>{selectedBook.year}</span>
                    </div>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => toggleWishlist(selectedBook.id, e)}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border ${
                      wishlist.includes(selectedBook.id)
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(selectedBook.id) ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>
                      {wishlist.includes(selectedBook.id) ? 'Disimpan di Minat Baca' : 'Masukkan Minat Baca'}
                    </span>
                  </button>
                  
                  {/* Catalog Card Link */}
                  <button
                    onClick={() => setShowCatalogCard(true)}
                    className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4 text-blue-400" />
                    <span>Cetak Kartu Katalog</span>
                  </button>
                </div>

                {/* Info Fields */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">{selectedBook.title}</h2>
                    <p className="text-sm text-slate-400 mt-1">Karya <span className="text-blue-400 font-semibold">{selectedBook.author}</span></p>
                  </div>

                  {/* Grid of details */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Kategori</span>
                      <span className="text-sm text-white font-medium">{selectedBook.category || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Lokasi Rak</span>
                      <span className="text-sm text-white font-mono flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" /> {selectedBook.shelfLocation || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Penerbit</span>
                      <span className="text-sm text-white">{selectedBook.publisher || '-'} ({selectedBook.year})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">ISBN</span>
                      <span className="text-sm text-white font-mono">{selectedBook.isbn || 'Tidak Ada'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Nomor Register</span>
                      <span className="text-sm text-white font-mono text-blue-400 font-semibold">{selectedBook.register}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Kode Aset KIB E</span>
                      <span className="text-sm text-white font-mono">{selectedBook.kodeBarang || '02.06.01.01.01'}</span>
                    </div>
                  </div>

                  {/* Physical KIB E spec details */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Spesifikasi Fisik & Perolehan KIB E</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-center">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Ukuran Buku</span>
                        <span className="text-xs text-slate-200 block font-semibold mt-0.5">{selectedBook.size || '21 cm'}</span>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-center">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Bahan Kertas</span>
                        <span className="text-xs text-slate-200 block font-semibold mt-0.5">{selectedBook.material || 'Kertas HVS'}</span>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-center">
                        <span className="text-[9px] text-slate-500 uppercase block font-bold">Thn Perolehan</span>
                        <span className="text-xs text-slate-200 block font-semibold mt-0.5">{selectedBook.acquisitionYear || selectedBook.year}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Availability Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status Rincian Saldo / Ketersediaan</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 text-center">
                        <span className="text-[9px] text-slate-500 uppercase block">Total Stok</span>
                        <span className="text-sm text-white font-bold block mt-0.5">{selectedBook.stock}</span>
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 text-center">
                        <span className="text-[9px] text-emerald-500/60 uppercase block">Tersedia</span>
                        <span className="text-sm text-emerald-400 font-bold block mt-0.5">
                          {selectedBook.qtyTersedia !== undefined ? selectedBook.qtyTersedia : (selectedBook.status === 'Tersedia' ? selectedBook.stock : 0)}
                        </span>
                      </div>
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-2 text-center">
                        <span className="text-[9px] text-indigo-500/60 uppercase block">Terpakai</span>
                        <span className="text-sm text-indigo-400 font-bold block mt-0.5">
                          {selectedBook.qtyTerpakai !== undefined ? selectedBook.qtyTerpakai : (selectedBook.status === 'Terpakai' ? selectedBook.stock : 0)}
                        </span>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-2 text-center">
                        <span className="text-[9px] text-red-500/60 uppercase block">Rusak</span>
                        <span className="text-sm text-red-400 font-bold block mt-0.5">
                          {selectedBook.qtyRusak !== undefined ? selectedBook.qtyRusak : (selectedBook.status === 'Rusak' ? selectedBook.stock : 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Synopsis / Description */}
                  {selectedBook.description && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Sinopsis / Ringkasan</span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/20 p-3 rounded-xl border border-slate-800/60">
                        {selectedBook.description}
                      </p>
                    </div>
                  )}

                  {/* Mock Barcode & QR Code Section */}
                  <div className="pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 w-full sm:w-auto">
                      <Barcode className="w-10 h-10 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Barcode Inventaris</p>
                        <p className="font-mono text-xs text-slate-300 mt-1">{selectedBook.kodeBarang}-{selectedBook.register}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 w-full sm:w-auto">
                      <QrCode className="w-10 h-10 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">Pencarian Cepat QR</p>
                        <p className="font-mono text-[10px] text-slate-300 mt-1">perpus-id://book/{selectedBook.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
