import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, BookOpen, Download, Upload, Printer, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Barcode from 'react-barcode';

export default function Books() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({ 
    kodeBarang: '', register: '', title: '', author: '', publisher: '', year: '', isbn: '', 
    category: '', stock: 0, qtyTersedia: 0, qtyTerpakai: 0, qtyRusak: 0, source: '', price: 0, condition: 'Baik', status: 'Tersedia',
    description: '', shelfLocation: '', language: 'Indonesia', pages: 0, coverContent: '',
    size: '', material: '', acquisitionYear: ''
  });

  // Selection state
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBookDetail, setSelectedBookDetail] = useState<any>(null);

  // Print state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printBooks, setPrintBooks] = useState<any[]>([]);
  const [printMode, setPrintMode] = useState<'single' | 'stock' | 'custom'>('stock');
  const [customLabelQty, setCustomLabelQty] = useState<number>(10);
  const [labelSuffixFormat, setLabelSuffixFormat] = useState<'dash' | 'slash' | 'none'>('dash');
  const [libraryName, setLibraryName] = useState('E-Perpus');
  const [institutionName, setInstitutionName] = useState('SMP Negeri 1 Belajar');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBooks();
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.libraryName) setLibraryName(data.libraryName);
        if (data.institutionName) setInstitutionName(data.institutionName);
      })
      .catch(err => console.error('Error loading settings in Books:', err));
  }, []);

  const fetchBooks = () => {
    setLoading(true);
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        setBooks(data);
        setLoading(false);
      });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedStock = Number(formData.qtyTersedia || 0) + Number(formData.qtyTerpakai || 0) + Number(formData.qtyRusak || 0);
    const payload = {
      ...formData,
      stock: calculatedStock
    };
    if (editingBook) {
      await fetch(`/api/books/${editingBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    setIsModalOpen(false);
    fetchBooks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus buku ini?')) {
      await fetch(`/api/books/${id}`, { method: 'DELETE' });
      fetchBooks();
    }
  };

  const openAddModal = () => {
    setEditingBook(null);
    setFormData({ 
      kodeBarang: '02.06.01.01.01', register: '', title: '', author: '', publisher: '', 
      year: new Date().getFullYear().toString(), isbn: '', category: 'Umum', stock: 1, 
      qtyTersedia: 1, qtyTerpakai: 0, qtyRusak: 0,
      source: 'Pembelian', price: 0, condition: 'Baik', status: 'Tersedia',
      description: '', shelfLocation: '', language: 'Indonesia', pages: 0, coverContent: '',
      size: '21 cm', material: 'Kertas HVS', acquisitionYear: new Date().getFullYear().toString()
    });
    setIsModalOpen(true);
  };

  const openEditModal = (book: any) => {
    setEditingBook(book);
    setFormData({ 
      kodeBarang: book.kodeBarang || '02.06.01.01.01', 
      register: book.register || '', 
      title: book.title || '', 
      author: book.author || '', 
      publisher: book.publisher || '',
      year: book.year || '',
      isbn: book.isbn || '', 
      category: book.category || 'Umum', 
      stock: book.stock || 0,
      qtyTersedia: book.qtyTersedia !== undefined ? book.qtyTersedia : (book.stock || 0),
      qtyTerpakai: book.qtyTerpakai !== undefined ? book.qtyTerpakai : 0,
      qtyRusak: book.qtyRusak !== undefined ? book.qtyRusak : 0,
      source: book.source || '',
      price: book.price || 0,
      condition: book.condition || 'Baik',
      status: book.status || 'Tersedia',
      description: book.description || '',
      shelfLocation: book.shelfLocation || '',
      language: book.language || 'Indonesia',
      pages: book.pages || 0,
      coverContent: book.coverContent || '',
      size: book.size || '21 cm',
      material: book.material || 'Kertas HVS',
      acquisitionYear: book.acquisitionYear || book.year || new Date().getFullYear().toString()
    });
    setIsModalOpen(true);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(books.map(b => ({
      'Kode Barang': b.kodeBarang,
      'No. Register': b.register,
      'Judul Buku / Nama Barang': b.title,
      'Pengarang / Penulis': b.author,
      'Penerbit': b.publisher,
      'Tahun Cetak / Terbit': b.year,
      'Tahun Perolehan': b.acquisitionYear || b.year || '',
      'Ukuran / Dimensi': b.size || '21 cm',
      'Bahan / Kertas': b.material || 'Kertas HVS',
      'ISBN / Kode Lain': b.isbn,
      'Kategori': b.category,
      'Kondisi': b.condition,
      'Stok Tersedia': b.qtyTersedia !== undefined ? b.qtyTersedia : b.stock,
      'Stok Terpakai': b.qtyTerpakai || 0,
      'Stok Rusak': b.qtyRusak || 0,
      'Total Stok': b.stock,
      'Asal Usul / Cara Perolehan': b.source,
      'Harga (Rp)': b.price
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buku");
    XLSX.writeFile(wb, "Data_Buku_KIB_E.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("KIB E - Aset Tetap Lainnya (Buku Perpustakaan)", 14, 15);
    
    const tableColumn = ["Kode", "Register", "Judul Buku", "Pengarang", "Penerbit", "Thn", "ISBN", "Kategori", "Kondisi", "Tersedia", "Terpakai", "Rusak", "Total", "Asal", "Harga"];
    const tableRows = books.map(b => [
      b.kodeBarang, b.register, b.title, b.author, b.publisher, b.year, b.isbn, b.category, b.condition, 
      b.qtyTersedia !== undefined ? b.qtyTersedia : b.stock, b.qtyTerpakai || 0, b.qtyRusak || 0, b.stock,
      b.source, b.price
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 }
    });
    
    doc.save("Data_Buku_KIB_E.pdf");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      for (const item of data as any[]) {
        const qtyTersedia = parseInt(item['Stok Tersedia'] || item['qtyTersedia'] || item['Stok'] || '1', 10);
        const qtyTerpakai = parseInt(item['Stok Terpakai'] || item['qtyTerpakai'] || '0', 10);
        const qtyRusak = parseInt(item['Stok Rusak'] || item['qtyRusak'] || '0', 10);
        const calculatedStock = qtyTersedia + qtyTerpakai + qtyRusak;

        const bookData = {
          kodeBarang: item['Kode Barang'] || item['kodeBarang'] || '02.06.01.01.01',
          register: item['No. Register'] || item['register'] || '0000',
          title: item['Judul Buku / Nama Barang'] || item['Judul'] || item['title'] || '',
          author: item['Pengarang / Penulis'] || item['Penulis'] || item['author'] || '',
          publisher: item['Penerbit'] || item['publisher'] || '',
          year: String(item['Tahun Cetak / Terbit'] || item['Tahun'] || item['year'] || ''),
          acquisitionYear: String(item['Tahun Perolehan'] || item['acquisitionYear'] || item['Tahun Cetak / Terbit'] || item['Tahun'] || item['year'] || ''),
          size: item['Ukuran / Dimensi'] || item['size'] || '21 cm',
          material: item['Bahan / Kertas'] || item['material'] || 'Kertas HVS',
          isbn: item['ISBN / Kode Lain'] || item['ISBN'] || item['isbn'] || String(Date.now()),
          category: item['Kategori'] || item['category'] || 'Umum',
          condition: item['Kondisi'] || item['condition'] || 'Baik',
          qtyTersedia,
          qtyTerpakai,
          qtyRusak,
          stock: calculatedStock,
          status: item['Status'] || item['status'] || 'Tersedia',
          source: item['Asal Usul / Cara Perolehan'] || item['source'] || '',
          price: parseInt(item['Harga (Rp)'] || item['Harga'] || item['price'] || '0', 10)
        };
        await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookData)
        });
      }
      fetchBooks();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const openPrintLabel = (book: any) => {
    setPrintBooks([book]);
    setIsPrintModalOpen(true);
  };

  const openBulkPrintLabels = () => {
    const selected = books.filter(b => selectedBooks.includes(b.id));
    setPrintBooks(selected);
    setIsPrintModalOpen(true);
  };

  const openDetailModal = (book: any) => {
    setSelectedBookDetail(book);
    setIsDetailOpen(true);
  };

  const doPrint = () => {
    window.print();
  };

  const handleSelectBook = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBooks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBooks(filteredBooks.map(b => b.id));
    } else {
      setSelectedBooks([]);
    }
  };

  const generatedLabels = React.useMemo(() => {
    const list: any[] = [];
    printBooks.forEach(book => {
      let qty = 1;
      if (printMode === 'stock') {
        qty = book.stock || 1;
      } else if (printMode === 'custom') {
        qty = customLabelQty || 1;
      }
      
      for (let i = 1; i <= qty; i++) {
        let suffix = '';
        const padIndex = String(i).padStart(3, '0');
        if (labelSuffixFormat === 'dash') {
          suffix = `-${padIndex}`;
        } else if (labelSuffixFormat === 'slash') {
          suffix = `/${padIndex}`;
        }
        
        const baseCode = book.register || book.isbn || '0000';
        const finalBarcodeValue = baseCode + suffix;

        list.push({
          id: `${book.id}-${i}`,
          book: book,
          barcodeValue: finalBarcodeValue,
          copyIndex: i,
          totalCopies: qty
        });
      }
    });
    return list;
  }, [printBooks, printMode, customLabelQty, labelSuffixFormat]);

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.isbn.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || b.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(books.map(b => b.category).filter(Boolean)));

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB max just as a safe limit
        alert("Ukuran gambar terlalu besar, maksimum 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, coverContent: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mt-2 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Manajemen Buku</h1>
          <p className="text-sm text-slate-400 mt-1">Kelola katalog buku perpustakaan Anda</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} />
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center">
            <Upload className="w-4 h-4 mr-2" /> IMPOR EXCEL
          </button>
          <button onClick={handleExportExcel} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" /> EXCEL
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden flex flex-col flex-1">
        <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center sm:flex-row flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari buku berdasarkan judul/ISBN..." 
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-50 placeholder-slate-400 transition-all"
              />
            </div>
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-sm text-slate-200 outline-none"
            >
              <option value="All">Semua Kategori</option>
              {categories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
            </select>
            {selectedBooks.length > 0 && (
              <button onClick={openBulkPrintLabels} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center shrink-0">
                <Printer className="w-4 h-4 mr-1.5" /> CETAK MASAL ({selectedBooks.length})
              </button>
            )}
          </div>
          <button onClick={openAddModal} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center shrink-0">
            <Plus className="w-4 h-4 mr-1" /> TAMBAH BUKU
          </button>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5 bg-slate-900/20">
                <th className="px-4 py-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredBooks.length > 0 && selectedBooks.length === filteredBooks.length} 
                    onChange={handleSelectAll} 
                    className="w-4 h-4 bg-slate-800 border-slate-600 rounded cursor-pointer" 
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Reg</th>
                <th className="px-8 py-4 font-semibold">Judul Buku / Nama Barang</th>
                <th className="px-8 py-4 font-semibold">Pengarang / Penerbit</th>
                <th className="px-8 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold text-center">Rincian Status (Tersedia / Terpakai / Rusak)</th>
                <th className="px-6 py-4 font-semibold text-center">Total Stok</th>
                <th className="px-8 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Memuat data...</td></tr>
              ) : filteredBooks.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">Data buku kosong</td></tr>
              ) : (
                filteredBooks.map(book => (
                  <tr key={book.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={(e) => handleSelectBook(book.id, e)}>
                    <td className="px-4 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedBooks.includes(book.id)} 
                        onChange={(e) => {
                           e.stopPropagation();
                           handleSelectBook(book.id, e as any);
                        }} 
                        className="w-4 h-4 bg-slate-800 border-slate-600 rounded cursor-pointer" 
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{book.register}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        {book.coverContent ? (
                          <img src={book.coverContent} alt="Cover" className="w-10 h-14 object-cover rounded shadow-sm shrink-0" />
                        ) : (
                          <div className="w-10 h-14 bg-slate-800 rounded flex items-center justify-center shrink-0 border border-white/5">
                            <span className="text-[10px] text-slate-500">No Img</span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-50 leading-tight">{book.title}</div>
                          <div className="text-xs text-slate-400 mt-1">ISBN: {book.isbn} {book.shelfLocation ? `| Rak: ${book.shelfLocation}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="text-slate-300 italic">{book.author}</div>
                      <div className="text-xs text-slate-400 mt-1">{book.publisher} - {book.year}</div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-white/10 text-slate-300 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/5">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <span className="px-2 py-0.5 bg-green-500/15 text-green-400 rounded text-[11px] font-semibold border border-green-500/10" title="Tersedia / Belum Digunakan">
                          {book.qtyTersedia !== undefined ? book.qtyTersedia : book.stock} <span className="text-[10px] font-normal text-green-500/70">Tersedia</span>
                        </span>
                        <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded text-[11px] font-semibold border border-blue-500/10" title="Sedang Terpakai">
                          {book.qtyTerpakai || 0} <span className="text-[10px] font-normal text-blue-500/70">Terpakai</span>
                        </span>
                        <span className="px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-[11px] font-semibold border border-red-500/10" title="Rusak">
                          {book.qtyRusak || 0} <span className="text-[10px] font-normal text-red-500/70">Rusak</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-slate-100 font-bold px-2 py-1 bg-white/5 rounded border border-white/5">
                        {book.stock}
                      </span>
                    </td>
                     <td className="px-8 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); openDetailModal(book); }} className="text-slate-400 hover:text-white p-1.5 transition-colors" title="Lihat Detail"><Eye className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); openPrintLabel(book); }} className="text-slate-400 hover:text-emerald-400 p-1.5 transition-colors" title="Cetak Label"><Printer className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); openEditModal(book); }} className="text-slate-400 hover:text-blue-400 p-1.5 ml-1 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(book.id); }} className="text-slate-400 hover:text-red-400 p-1.5 ml-1 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[11px] text-slate-500 uppercase tracking-widest shrink-0">
          <span>Menampilkan {filteredBooks.length} buku</span>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBook ? "Edit Buku (KIB E)" : "Tambah Buku (KIB E)"}>
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Sampul Buku</label>
                <div className="flex items-center gap-4">
                  {formData.coverContent ? (
                    <img src={formData.coverContent} alt="Cover Preview" className="w-20 h-28 object-cover rounded border border-white/10" />
                  ) : (
                    <div className="w-20 h-28 bg-slate-800 rounded border flex items-center justify-center border-slate-700/50">
                      <span className="text-xs text-slate-500 text-center px-2">Tidak ada sampul</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30" />
                    <p className="text-[10px] text-slate-500 mt-2">Format yang didukung: JPG, PNG. Maksimal 1MB.</p>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Judul Buku / Nama Barang</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kode Barang</label>
                <input required type="text" value={formData.kodeBarang} onChange={e => setFormData({...formData, kodeBarang: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">No. Register</label>
                <input required type="text" value={formData.register} onChange={e => setFormData({...formData, register: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pengarang</label>
                <input required type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Penerbit</label>
                <input type="text" value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tahun Cetak</label>
                <input type="text" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">ISBN / Kode Lain</label>
                <input required pattern="^[\d\-]{10,17}$" title="Masukkan ISBN yang valid (10-13 digit angka, boleh menggunakan strip)" type="text" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              {/* New Fields */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kategori</label>
                <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lokasi Rak</label>
                <input type="text" value={formData.shelfLocation} onChange={e => setFormData({...formData, shelfLocation: e.target.value})} placeholder="Misal: RAK 1A" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bahasa</label>
                <input type="text" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Jumlah Halaman</label>
                <input type="number" min="0" value={formData.pages === 0 ? '' : formData.pages} onChange={e => setFormData({...formData, pages: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Harga (Rp)</label>
                <input type="number" min="0" value={formData.price === 0 ? '' : formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Asal Usul / Perolehan</label>
                <input type="text" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="Misal: Pembelian BOS" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tahun Perolehan KIB E</label>
                <input type="text" value={formData.acquisitionYear} onChange={e => setFormData({...formData, acquisitionYear: e.target.value})} placeholder="Misal: 2021" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ukuran / Dimensi Buku</label>
                <input type="text" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} placeholder="Misal: 21 cm" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bahan / Jenis Kertas</label>
                <input type="text" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} placeholder="Misal: Kertas HVS" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">KONDISI BUKU</label>
                <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Baik">Baik</option>
                  <option value="Kurang Baik">Kurang Baik</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                </select>
              </div>

              <div className="col-span-2 bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
                <span className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">Rincian Status & Jumlah Buku</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1">🟢 Tersedia</label>
                    <input required type="number" min="0" value={formData.qtyTersedia} onChange={e => setFormData({...formData, qtyTersedia: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">🔵 Terpakai</label>
                    <input required type="number" min="0" value={formData.qtyTerpakai} onChange={e => setFormData({...formData, qtyTerpakai: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">🔴 Rusak</label>
                    <input required type="number" min="0" value={formData.qtyRusak} onChange={e => setFormData({...formData, qtyRusak: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center text-xs text-slate-400 font-mono">
                  <span>TOTAL ESTIMASI STOK:</span>
                  <span className="text-sm font-bold text-slate-100 bg-white/5 px-2.5 py-1 rounded">
                    {Number(formData.qtyTersedia || 0) + Number(formData.qtyTerpakai || 0) + Number(formData.qtyRusak || 0)} Buah
                  </span>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Deskripsi / Sinopsis Lengkap</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
            </div>
            <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg sticky bottom-0 z-10">
              {editingBook ? 'Simpan Perubahan' : 'Tambah Buku'}
            </button>
          </form>
        </div>
      </Modal>

      {/* Book Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detail Informasi Buku">
         {selectedBookDetail && (
           <div className="space-y-6">
             <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-white/5">
                {selectedBookDetail.coverContent ? (
                  <img src={selectedBookDetail.coverContent} alt="Cover" className="w-32 h-44 object-cover rounded shadow-xl shrink-0 border border-white/10" />
                ) : (
                  <div className="w-32 h-44 bg-slate-800 rounded flex flex-col items-center justify-center shrink-0 border border-white/5 shadow-xl">
                    <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs text-slate-500">Tidak ada gambar</span>
                  </div>
                )}
                <div className="flex-1">
                   <div className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider mb-2">
                      {selectedBookDetail.category}
                   </div>
                   <h2 className="text-2xl font-bold text-white leading-tight mb-1">{selectedBookDetail.title}</h2>
                   <p className="text-slate-300 italic mb-4">{selectedBookDetail.author}</p>
                   
                   <div className="grid grid-cols-2 gap-4 text-sm mt-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                      <div>
                         <div className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Register</div>
                         <div className="font-mono text-slate-200">{selectedBookDetail.register}</div>
                      </div>
                      <div>
                         <div className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">ISBN</div>
                         <div className="text-slate-200">{selectedBookDetail.isbn}</div>
                      </div>
                      <div>
                         <div className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Penerbit</div>
                         <div className="text-slate-200">{selectedBookDetail.publisher || '-'} ({selectedBookDetail.year || '-'})</div>
                      </div>
                      <div>
                         <div className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Rincian Stok / Kondisi</div>
                         <div className="text-slate-200">Total: {selectedBookDetail.stock} (Tersedia: {selectedBookDetail.qtyTersedia !== undefined ? selectedBookDetail.qtyTersedia : selectedBookDetail.stock}, Terpakai: {selectedBookDetail.qtyTerpakai || 0}, Rusak: {selectedBookDetail.qtyRusak || 0}) / Kondisi: {selectedBookDetail.condition}</div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6 text-sm">
                <div>
                   <dt className="text-xs text-slate-500 mb-1">KODE BARANG</dt>
                   <dd className="text-slate-200 font-mono">{selectedBookDetail.kodeBarang}</dd>
                </div>
                <div>
                   <dt className="text-xs text-slate-500 mb-1">LOKASI RAK</dt>
                   <dd className="text-slate-200">{selectedBookDetail.shelfLocation || '-'}</dd>
                </div>
                <div>
                   <dt className="text-xs text-slate-500 mb-1">HALAMAN / BAHASA</dt>
                   <dd className="text-slate-200">{selectedBookDetail.pages || '-'} hlm / {selectedBookDetail.language || '-'}</dd>
                </div>
                <div>
                   <dt className="text-xs text-slate-500 mb-1">ASAL USUL</dt>
                   <dd className="text-slate-200">{selectedBookDetail.source || '-'}</dd>
                </div>
                <div>
                   <dt className="text-xs text-slate-500 mb-1">TAHUN PEROLEHAN KIB E</dt>
                   <dd className="text-slate-200">{selectedBookDetail.acquisitionYear || selectedBookDetail.year || '-'}</dd>
                </div>
                <div>
                   <dt className="text-xs text-slate-500 mb-1">UKURAN / DIMENSI</dt>
                   <dd className="text-slate-200">{selectedBookDetail.size || '-'}</dd>
                </div>
                <div>
                   <dt className="text-xs text-slate-500 mb-1">BAHAN / KERTAS</dt>
                   <dd className="text-slate-200">{selectedBookDetail.material || '-'}</dd>
                </div>
             </div>
             
             {selectedBookDetail.description && (
                <div className="pt-4 border-t border-white/5">
                   <h3 className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Deskripsi</h3>
                   <p className="text-sm text-slate-300 leading-relaxed">{selectedBookDetail.description}</p>
                </div>
             )}

             <div className="pt-6 flex gap-3">
               <button onClick={() => { setIsDetailOpen(false); openEditModal(selectedBookDetail); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2 border border-slate-700">
                 <Edit2 className="w-4 h-4" /> Edit Data BUKU
               </button>
             </div>
           </div>
         )}
      </Modal>

      {/* Print Preview Modal */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Cetak Label Buku (KIB E)" size="5xl">
        {printBooks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
            {/* Settings Column - hidden on print */}
            <div className="md:col-span-1 bg-slate-900/60 p-5 rounded-2xl border border-white/10 flex flex-col gap-5 print:hidden">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Pengaturan Label</h3>
              
              {/* Print Mode Option */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Metode Cetak</label>
                <div className="flex flex-col gap-2">
                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${printMode === 'stock' ? 'bg-blue-500/10 border-blue-500/50 text-white' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'}`}>
                    <input 
                      type="radio" 
                      name="printMode" 
                      value="stock" 
                      checked={printMode === 'stock'} 
                      onChange={() => setPrintMode('stock')}
                      className="text-blue-500 focus:ring-blue-500" 
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Semua Copy (Sesuai Stok)</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Cetak label sesuai jumlah total stok buku</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${printMode === 'single' ? 'bg-blue-500/10 border-blue-500/50 text-white' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'}`}>
                    <input 
                      type="radio" 
                      name="printMode" 
                      value="single" 
                      checked={printMode === 'single'} 
                      onChange={() => setPrintMode('single')}
                      className="text-blue-500 focus:ring-blue-500" 
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Satu Label Saja per Buku</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Cetak 1 label master untuk setiap judul buku</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${printMode === 'custom' ? 'bg-blue-500/10 border-blue-500/50 text-white' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'}`}>
                    <input 
                      type="radio" 
                      name="printMode" 
                      value="custom" 
                      checked={printMode === 'custom'} 
                      onChange={() => setPrintMode('custom')}
                      className="text-blue-500 focus:ring-blue-500" 
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">Kustom Jumlah Label</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Tentukan jumlah cetakan label secara manual</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Label Quantity */}
              {printMode === 'custom' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Jumlah Label per Buku</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="1000"
                    value={customLabelQty} 
                    onChange={e => setCustomLabelQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white font-semibold"
                  />
                </div>
              )}

              {/* Suffix Suffix Format Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Format Nomor Exemplar</label>
                <select 
                  value={labelSuffixFormat} 
                  onChange={e => setLabelSuffixFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-200 font-medium"
                >
                  <option value="dash">Gunakan Strip (contoh: -001, -002)</option>
                  <option value="slash">Gunakan Garis Miring (contoh: /001, /002)</option>
                  <option value="none">Tanpa Suffix Barcode (Register Asli)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1.5">Membantu membedakan nomor exemplar fisik buku di barcode Anda.</p>
              </div>

              {/* Print Summary */}
              <div className="mt-auto bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumlah Buku:</span>
                  <span className="text-slate-300 font-bold">{printBooks.length} judul</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Label:</span>
                  <span className="text-emerald-400 font-bold text-sm">{generatedLabels.length} Lembar</span>
                </div>
              </div>

              <button onClick={doPrint} className="w-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-colors shadow-lg">
                <Printer className="w-5 h-5" /> Cetak Sekarang
              </button>
            </div>

            {/* Labels Live Preview Column */}
            <div className="md:col-span-2 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center print:hidden">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pratinjau Label ({generatedLabels.length} Label)</span>
                <span className="text-[10px] text-slate-500 font-mono">Pratinjau sebelum cetak fisik</span>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start max-h-[60vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 pr-2 custom-scrollbar w-full bg-slate-950/20 p-4 rounded-2xl border border-white/5 print:bg-transparent print:border-none" id="print-area">
                {generatedLabels.map(item => (
                  <div key={item.id} className="bg-white text-black p-4 border border-gray-300 flex flex-col items-center w-64 relative overflow-hidden shrink-0 rounded-xl shadow-md print:shadow-none print:border-gray-800 print:break-inside-avoid">
                    <div className="absolute top-0 right-0 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded-bl-lg print:hidden font-mono">Exemplar {item.copyIndex}</div>
                    
                    {/* Identitas Sekolah / Perpustakaan */}
                    <div className="w-full text-center border-b border-gray-200 pb-1.5 mb-2 flex flex-col items-center">
                      <span className="text-[8px] font-bold tracking-widest text-blue-600 uppercase leading-none">{libraryName}</span>
                      <span className="text-[9px] font-extrabold text-slate-800 uppercase tracking-tight leading-tight mt-0.5 text-center px-1 max-w-full truncate">{institutionName}</span>
                    </div>

                    <h3 className="font-bold text-center text-sm mt-1 mb-1 line-clamp-2">{item.book.title}</h3>
                    <p className="text-[10px] text-gray-600 text-center mb-2 line-clamp-1">{item.book.author} {item.book.year ? `(${item.book.year})` : ''}</p>
                    <div className="text-[10px] font-mono font-bold mb-1 text-slate-500">Kode: {item.book.kodeBarang}</div>
                    <Barcode value={item.barcodeValue} width={1.4} height={40} fontSize={9} margin={0} />
                    <div className="flex justify-between items-center w-full mt-2.5 pt-2 border-t border-gray-100 print:border-gray-300">
                      <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-700 uppercase border border-slate-200">{item.book.category}</span>
                      <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">No: {item.copyIndex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
