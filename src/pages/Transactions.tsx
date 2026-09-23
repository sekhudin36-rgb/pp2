import React, { useState, useEffect } from 'react';
import { Search, Plus, Repeat, AlertCircle, CheckCircle2, Printer, Download, Eye, Camera, Clock, Send, Check, X, Trash2, ArrowUpRight, ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Barcode from 'react-barcode';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { useToast } from '../components/Toast';
import { downloadBorrowRequestPdf } from '../utils/borrowPdf';

export default function Transactions() {
  const { showToast } = useToast();
  const [mainTab, setMainTab] = useState<'circulation' | 'requests'>('circulation');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [borrowRequests, setBorrowRequests] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [requestFilter, setRequestFilter] = useState('all');

  // Request review modal
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processingReq, setProcessingReq] = useState(false);

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'any' | 'member' | 'book'>('any');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ bookId: '', memberId: '', dueDate: '', conditionOnBorrow: 'Baik', notes: '' });
  const [selectedBooks, setSelectedBooks] = useState<{ id: string; bookNumber: string }[]>([{ id: '', bookNumber: '' }]);

  const groupedMembers = React.useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    const nonSiswa: any[] = [];

    members.forEach(m => {
      if (m.role === 'Siswa') {
        const grpName = m.kelas ? `Kelas ${m.kelas}` : 'Siswa (Tanpa Kelas)';
        if (!groups[grpName]) groups[grpName] = [];
        groups[grpName].push(m);
      } else {
        nonSiswa.push(m);
      }
    });

    return {
      siswaGroups: Object.keys(groups).sort().map(gName => ({
        label: gName,
        options: groups[gName]
      })),
      nonSiswa: nonSiswa
    };
  }, [members]);

  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Return Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnFormData, setReturnFormData] = useState({ conditionOnReturn: 'Baik', notes: '' });
  const [transactionToReturn, setTransactionToReturn] = useState<any>(null);

  // Print state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTransaction, setPrintTransaction] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
    fetchBorrowRequests();
    fetch('/api/books').then(res => res.json()).then(setBooks);
    fetch('/api/members').then(res => res.json()).then(setMembers);
    fetch('/api/settings').then(res => res.json()).then(setSettings);
  }, []);

  const fetchTransactions = () => {
    setLoading(true);
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        setTransactions(data);
        setLoading(false);
      });
  };

  const fetchBorrowRequests = () => {
    fetch('/api/borrow-requests')
      .then(res => res.json())
      .then(data => setBorrowRequests(data || []))
      .catch(console.error);
  };

  const handleUpdateReqStatus = async (reqId: string, status: string, notes?: string) => {
    setProcessingReq(true);
    try {
      const res = await fetch(`/api/borrow-requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: notes || '',
          reviewedBy: 'Petugas Perpustakaan'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memproses pengajuan');
      }

      showToast(
        status === 'approved' 
          ? 'Pengajuan peminjaman berhasil disetujui!' 
          : status === 'rejected'
          ? 'Pengajuan peminjaman ditolak'
          : 'Buku berhasil diserahkan dan masuk ke sirkulasi aktif!',
        status === 'rejected' ? 'error' : 'success'
      );

      // Refresh data
      fetchBorrowRequests();
      fetchTransactions();
      fetch('/api/books').then(res => res.json()).then(setBooks);
      setSelectedRequest(null);
      setReviewAction(null);
      setAdminNote('');
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setProcessingReq(false);
    }
  };

  const handleDeleteBorrowRequest = async (reqId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan pengajuan ini?')) return;
    try {
      const res = await fetch(`/api/borrow-requests/${reqId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Catatan pengajuan berhasil dihapus', 'info');
        fetchBorrowRequests();
      }
    } catch (err) {
      showToast('Gagal menghapus pengajuan', 'error');
    }
  };

  const calculateFine = (dueDateString: string) => {
    if (!settings || settings.finePerDay <= 0) return 0;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return diffDays * settings.finePerDay;
    }
    return 0;
  };

  const handleSmartScan = (code: string) => {
    setIsScannerOpen(false);
    const cleanCode = code.trim().toLowerCase();
    
    const matchedMember = members.find(m => 
      (m.nisNip && m.nisNip.toLowerCase() === cleanCode) || 
      m.id.toLowerCase() === cleanCode
    );

    const matchedBook = books.find(b => 
      (b.isbn && b.isbn.toLowerCase() === cleanCode) || 
      (b.register && b.register.toLowerCase() === cleanCode) || 
      (b.kodeBarang && b.kodeBarang.toLowerCase() === cleanCode) ||
      b.id.toLowerCase() === cleanCode
    );

    if (scannerTarget === 'member') {
      if (matchedMember) {
        setFormData(prev => ({ ...prev, memberId: matchedMember.id }));
        setIsModalOpen(true);
        showToast(`Anggota terpilih: ${matchedMember.name}`, 'success');
      } else {
        showToast(`Anggota dengan barcode/NIS ${code} tidak ditemukan`, 'warning');
      }
      return;
    }

    if (scannerTarget === 'book') {
      if (matchedBook) {
        setSelectedBooks(prev => {
          if (prev.length === 1 && !prev[0].id) {
            return [{ id: matchedBook.id, bookNumber: '' }];
          }
          return [...prev, { id: matchedBook.id, bookNumber: '' }];
        });
        setIsModalOpen(true);
        showToast(`Buku ditambahkan: ${matchedBook.title}`, 'success');
      } else {
        showToast(`Buku dengan barcode/ISBN ${code} tidak ditemukan`, 'warning');
      }
      return;
    }

    // Default 'any' mode:
    if (matchedMember) {
      setFormData(prev => ({ ...prev, memberId: matchedMember.id }));
      setIsModalOpen(true);
      showToast(`Anggota terdeteksi: ${matchedMember.name}`, 'success');
    } else if (matchedBook) {
      setSelectedBooks([{ id: matchedBook.id, bookNumber: '' }]);
      setIsModalOpen(true);
      showToast(`Buku terdeteksi: ${matchedBook.title}`, 'success');
    } else {
      showToast(`Barcode ${code} tidak terdaftar di sistem`, 'error');
    }
  };

  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionToReturn) return;
    
    let confirmMsg = 'Konfirmasi pengembalian buku?';
    if (transactionToReturn.status === 'overdue') {
      const fine = calculateFine(transactionToReturn.dueDate);
      if (fine > 0) {
        confirmMsg = `Buku TERLAMBAT!\nDenda keterlambatan: Rp. ${fine.toLocaleString('id-ID')}\n\nKonfirmasi pengembalian buku sekaligus pembayaran denda?`;
      }
    }

    if (confirm(confirmMsg)) {
      fetch(`/api/transactions/${transactionToReturn.id}/return`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnFormData)
      })
        .then(res => res.json())
        .then(updatedT => {
          setTransactions(prev => prev.map(tr => tr.id === transactionToReturn.id ? { ...tr, ...updatedT } : tr));
          setIsReturnModalOpen(false);
        });
    }
  };

  const openReturnModal = (t: any) => {
    setTransactionToReturn(t);
    setReturnFormData({ conditionOnReturn: 'Baik', notes: '' });
    setIsReturnModalOpen(true);
  };

  const openDetailModal = (t: any) => {
    setSelectedTransaction(t);
    setIsDetailOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validBooks = selectedBooks.filter(item => item.id !== '');
    if (validBooks.length === 0) {
      alert('Harap pilih minimal satu buku untuk dipinjam');
      return;
    }

    const payload = {
      memberId: formData.memberId,
      bookIds: validBooks.map(item => item.id),
      bookNumbers: validBooks.map(item => item.bookNumber),
      dueDate: formData.dueDate,
      conditionOnBorrow: formData.conditionOnBorrow,
      notes: formData.notes
    };

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      setIsModalOpen(false);
      fetchTransactions();
      fetch('/api/books').then(res => res.json()).then(setBooks);
    } else {
      const err = await res.json();
      alert(`Gagal: ${err.error}`);
    }
  };

  const openAddModal = () => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    setFormData({ bookId: '', memberId: '', dueDate: defaultDueDate.toISOString().split('T')[0], conditionOnBorrow: 'Baik', notes: '' });
    setSelectedBooks([{ id: '', bookNumber: '' }]);
    setIsModalOpen(true);
  };

  const openPrintLetter = (t: any) => {
    setPrintTransaction(t);
    setIsPrintModalOpen(true);
  };

  const doPrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
      'Peminjam': t.member?.name || 'Unknown',
      'Buku': t.book?.title || 'Unknown',
      'No. Buku': t.bookNumber || '-',
      'Tgl Pinjam': new Date(t.borrowDate).toLocaleDateString('id-ID'),
      'Tenggat': new Date(t.dueDate).toLocaleDateString('id-ID'),
      'Tgl Kembali': t.returnDate ? new Date(t.returnDate).toLocaleDateString('id-ID') : '-',
      'Status': getStatusText(t.status)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sirkulasi");
    XLSX.writeFile(wb, "Data_Peminjaman.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Sirkulasi Buku", 14, 15);
    
    const tableColumn = ["Peminjam", "Buku", "No. Buku", "Tgl Pinjam", "Tenggat", "Tgl Kembali", "Status"];
    const tableRows = transactions.map(t => [
      t.member?.name || 'Unknown',
      t.book?.title || 'Unknown',
      t.bookNumber || '-',
      new Date(t.borrowDate).toLocaleDateString('id-ID'),
      new Date(t.dueDate).toLocaleDateString('id-ID'),
      t.returnDate ? new Date(t.returnDate).toLocaleDateString('id-ID') : '-',
      getStatusText(t.status)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });
    
    doc.save("Data_Peminjaman.pdf");
  };

  const getStatusStyle = (status: string) => {
    if (status === 'borrowed') return 'bg-yellow-500/20 text-yellow-400 border-none';
    if (status === 'returned') return 'bg-green-500/20 text-green-400 border-none';
    return 'bg-red-500/20 text-red-400 border-none';
  };

  const getStatusText = (status: string) => {
    if (status === 'borrowed') return 'Dipinjam';
    if (status === 'returned') return 'Kembali';
    return 'Terlambat';
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.member?.name?.toLowerCase().includes(search.toLowerCase()) || 
      t.book?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingRequestsCount = borrowRequests.filter(r => r.status === 'pending').length;

  const filteredRequests = borrowRequests.filter(r => {
    const matchesSearch = 
      (r.requestCode || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.requesterName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.bookTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.nisNip || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = requestFilter === 'all' || r.status === requestFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 shrink-0 mt-2 mb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">Sirkulasi & Peminjaman</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Catatan peminjaman, pengembalian, dan pengajuan buku online</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExportExcel} className="flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center">
            <Download className="w-3.5 h-3.5 mr-1.5" /> EXCEL
          </button>
          <button onClick={handleExportPDF} className="flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center">
            <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
          </button>
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setMainTab('circulation'); setSearch(''); }}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            mainTab === 'circulation'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Sirkulasi Fisik Aktif</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => { setMainTab('requests'); setSearch(''); }}
          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            mainTab === 'requests'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Pengajuan Online</span>
          {pendingRequestsCount > 0 ? (
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm">
              {pendingRequestsCount} Menunggu
            </span>
          ) : (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
              {borrowRequests.length}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col flex-1 min-h-[420px] lg:min-h-0">
        {mainTab === 'circulation' ? (
          <>
            <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-b border-white/10 flex justify-between items-stretch sm:items-center flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari peminjam / judul..." 
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-50 placeholder-slate-400 transition-all"
                  />
                </div>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 sm:px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-xs sm:text-sm text-slate-200 outline-none"
                >
                  <option value="All">Semua Status</option>
                  <option value="borrowed">Sedang Dipinjam</option>
                  <option value="returned">Dikembalikan</option>
                  <option value="overdue">Terlambat</option>
                </select>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => { setScannerTarget('any'); setIsScannerOpen(true); }}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center shrink-0 shadow-sm"
                >
                  <Camera className="w-4 h-4 mr-1.5 text-indigo-400" /> SCAN KAMERA
                </button>
                <button onClick={openAddModal} className="flex-1 sm:flex-initial px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 mr-1" /> PINJAM BARU
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1 min-h-[350px] lg:min-h-0">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5 bg-slate-900/20">
                    <th className="px-8 py-4 font-semibold">Peminjam</th>
                    <th className="px-8 py-4 font-semibold">Buku</th>
                    <th className="px-8 py-4 font-semibold">Tgl Pinjam</th>
                    <th className="px-8 py-4 font-semibold">Tenggat</th>
                    <th className="px-8 py-4 font-semibold text-center">Status</th>
                    <th className="px-8 py-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">Memuat data...</td></tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center">
                          <Repeat className="w-10 h-10 text-slate-600 mb-3" />
                          <p>Belum ada transaksi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(t => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-8 py-4 font-medium text-slate-50">
                          <div className="flex flex-col">
                            <span>{t.member?.name || 'Unknown'}</span>
                            {t.member?.role === 'Siswa' && t.member?.kelas && (
                              <span className="text-[10px] text-blue-400 font-mono">Kelas {t.member.kelas}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-slate-300">
                          <div className="flex flex-col">
                            <span className="italic font-medium">{t.book?.title || 'Unknown'}</span>
                            {t.bookNumber && (
                              <span className="text-[10px] text-yellow-400 font-mono mt-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded self-start border border-yellow-500/20">No: {t.bookNumber}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-4 font-mono text-xs text-slate-400 uppercase">
                          {new Date(t.borrowDate).toLocaleDateString('id-ID', { year: '2-digit', month: 'short', day: 'numeric'})}
                        </td>
                        <td className="px-8 py-4 font-mono text-xs text-slate-400 uppercase">
                          {new Date(t.dueDate).toLocaleDateString('id-ID', { year: '2-digit', month: 'short', day: 'numeric'})}
                        </td>
                        <td className="px-8 py-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(t.status)}`}>
                            {getStatusText(t.status)}
                          </span>
                          {t.status === 'overdue' && calculateFine(t.dueDate) > 0 && (
                            <div className="text-[10px] text-red-400 mt-1 font-mono">Denda: Rp{calculateFine(t.dueDate).toLocaleString('id-ID')}</div>
                          )}
                        </td>
                        <td className="px-8 py-4 text-right flex items-center justify-end gap-2">
                          <button onClick={() => openDetailModal(t)} className="text-slate-400 hover:text-white p-1.5 transition-colors" title="Lihat Detail"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openPrintLetter(t)} className="text-slate-400 hover:text-blue-400 p-1.5 transition-colors" title="Cetak Surat Peminjaman"><Printer className="w-4 h-4" /></button>
                          
                          {(t.status === 'borrowed' || t.status === 'overdue') ? (
                            <button 
                              onClick={() => openReturnModal(t)}
                              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ml-2"
                            >
                              Selesaikan
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs flex items-center font-medium ml-2 py-1.5"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[11px] text-slate-500 uppercase tracking-widest shrink-0">
              <span>Menampilkan {filteredTransactions.length} sirkulasi</span>
            </div>
          </>
        ) : (
          /* ===================== TAB: PENGAJUAN ONLINE (PORTAL REQUESTS) ===================== */
          <>
            <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center sm:flex-row flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari kode REQ-, nama siswa, NIS/NIP..." 
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-50 placeholder-slate-400 transition-all font-mono"
                  />
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'pending', label: 'Menunggu' },
                    { key: 'approved', label: 'Disetujui' },
                    { key: 'fulfilled', label: 'Sudah Diambil' },
                    { key: 'rejected', label: 'Ditolak' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setRequestFilter(f.key)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                        requestFilter === f.key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-white/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={fetchBorrowRequests}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 shrink-0"
              >
                <Repeat className="w-3.5 h-3.5" /> Segarkan
              </button>
            </div>

            <div className="overflow-x-auto flex-1 min-h-[350px] lg:min-h-0">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5 bg-slate-900/20">
                    <th className="px-6 py-4 font-semibold">Kode & Waktu</th>
                    <th className="px-6 py-4 font-semibold">Pemohon</th>
                    <th className="px-6 py-4 font-semibold">Buku Diminta</th>
                    <th className="px-6 py-4 font-semibold">Rencana Ambil & Durasi</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Aksi Verifikasi Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        <Send className="w-10 h-10 text-slate-600 mb-3 mx-auto" />
                        <p className="font-bold text-slate-300">Belum ada pengajuan peminjaman online</p>
                        <p className="text-xs text-slate-500 mt-1">Siswa dan guru dapat mengajukan pinjam via Portal Mandiri.</p>
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        Tidak ada pengajuan yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(r => {
                      const bookObj = books.find(b => b.id === r.bookId);
                      const currentStock = bookObj ? bookObj.stock : 0;

                      return (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-blue-400 text-xs">{r.requestCode}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(r.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white text-sm">{r.requesterName}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono mt-0.5">
                              <span>{r.nisNip}</span>
                              <span>•</span>
                              <span className="text-blue-300 font-sans">{r.requesterRole} {r.requesterClass ? `(${r.requesterClass})` : ''}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-200 text-sm truncate max-w-[220px]" title={r.bookTitle}>
                              {r.bookTitle}
                            </div>
                            <div className="text-[11px] flex items-center gap-2 mt-0.5">
                              <span className="text-slate-400">{r.bookAuthor || 'Penulis'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${currentStock > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                Stok: {currentStock} Eks
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-300 text-xs flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-400" />
                              <span>{r.pickupDate}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Durasi: {r.durationDays} Hari</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                Menunggu
                              </span>
                            )}
                            {r.status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Disetujui
                              </span>
                            )}
                            {r.status === 'fulfilled' && (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Sudah Diambil
                              </span>
                            )}
                            {r.status === 'rejected' && (
                              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Ditolak
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedRequest(r);
                                      setReviewAction('approve');
                                      setAdminNote('Buku sudah disiapkan di meja piket perpustakaan. Silakan diambil sebelum pukul 14.00.');
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" /> Setujui
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedRequest(r);
                                      setReviewAction('reject');
                                      setAdminNote('Mohon maaf buku sedang dalam proses inventaris / stok fisik habis.');
                                    }}
                                    className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-rose-500/30"
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" /> Tolak
                                  </button>
                                </>
                              )}

                              {r.status === 'approved' && (
                                <button
                                  onClick={() => handleUpdateReqStatus(r.id, 'fulfilled')}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-md"
                                  title="Konfirmasi bahwa pemohon telah datang dan mengambil buku fisik"
                                >
                                  <Check className="w-3.5 h-3.5" /> Serahkan Buku
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  downloadBorrowRequestPdf(r, settings);
                                  showToast('Mengunduh Bukti Pengajuan PDF...', 'info');
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                title="Unduh / Cetak Bukti Pengajuan Sementara (PDF)"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteBorrowRequest(r.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                                title="Hapus Riwayat Pengajuan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[11px] text-slate-500 uppercase tracking-widest shrink-0">
              <span>Menampilkan {filteredRequests.length} dari {borrowRequests.length} pengajuan</span>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Transaksi Peminjaman">
        <form onSubmit={handleSave} className="flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Pilih Anggota (Dikelompokkan per Kelas)</label>
              <button 
                type="button" 
                onClick={() => { setScannerTarget('member'); setIsScannerOpen(true); }}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
              >
                <Camera className="w-3 h-3" /> Scan Kartu Anggota
              </button>
            </div>
            <select required value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">-- Pilih Anggota --</option>
              {groupedMembers.siswaGroups.map(grp => (
                <optgroup key={grp.label} label={grp.label} className="bg-slate-900 text-slate-300 font-semibold">
                  {grp.options.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-800 text-slate-100 font-normal">
                      {m.name} ({m.nisNip || 'Tanpa NIS'})
                    </option>
                  ))}
                </optgroup>
              ))}
              {groupedMembers.nonSiswa.length > 0 && (
                <optgroup label="Guru / Karyawan / Staf" className="bg-slate-900 text-slate-300 font-semibold">
                  {groupedMembers.nonSiswa.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-800 text-slate-100 font-normal">
                      {m.name} ({m.role})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Dynamic Multiple Books Selection Section */}
          <div className="space-y-3 bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
                Daftar Buku Yang Dipinjam ({selectedBooks.filter(item => item.id !== '').length} Buku)
              </label>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => { setScannerTarget('book'); setIsScannerOpen(true); }}
                  className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-md text-xs font-semibold transition-colors flex items-center shadow"
                >
                  <Camera className="w-3.5 h-3.5 mr-1 text-indigo-400" /> SCAN BUKU
                </button>
                <button 
                  type="button" 
                  onClick={() => setSelectedBooks([...selectedBooks, { id: '', bookNumber: '' }])}
                  className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-md text-xs font-bold transition-colors flex items-center shadow"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> TAMBAH BUKU
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {selectedBooks.map((item, idx) => {
                // Filter out books already selected in other rows to prevent duplicate choice,
                // but keep the currently selected book for this row.
                const filteredBooks = books.filter(b => {
                  const availableStock = b.qtyTersedia !== undefined ? b.qtyTersedia : b.stock;
                  const isAvailable = availableStock > 0;
                  const isSelectedElsewhere = selectedBooks.some((bItem, otherIdx) => bItem.id === b.id && otherIdx !== idx);
                  return isAvailable && !isSelectedElsewhere;
                });

                return (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                    <div className="flex gap-2 items-center w-full">
                      <span className="text-xs text-slate-500 font-mono w-4 shrink-0">{idx + 1}.</span>
                      <select 
                        required 
                        value={item.id} 
                        onChange={e => {
                          const nextBooks = [...selectedBooks];
                          nextBooks[idx].id = e.target.value;
                          setSelectedBooks(nextBooks);
                        }} 
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-0"
                      >
                        <option value="">-- Pilih Buku --</option>
                        {item.id && !filteredBooks.some(b => b.id === item.id) && (
                          (() => {
                            const currentBook = books.find(b => b.id === item.id);
                            return currentBook ? (
                              <option key={currentBook.id} value={currentBook.id}>
                                {currentBook.title}
                              </option>
                            ) : null;
                          })()
                        )}
                        {filteredBooks.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.title} (Stok: {b.qtyTersedia !== undefined ? b.qtyTersedia : b.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 items-center w-full pl-6">
                      <input 
                        type="text" 
                        placeholder="Masukkan Nomor/Exemplar Buku (misal: 01, B02)" 
                        value={item.bookNumber}
                        onChange={e => {
                          const nextBooks = [...selectedBooks];
                          nextBooks[idx].bookNumber = e.target.value;
                          setSelectedBooks(nextBooks);
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500 text-slate-200"
                      />
                      {selectedBooks.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const nextBooks = selectedBooks.filter((_, i) => i !== idx);
                            setSelectedBooks(nextBooks);
                          }}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold transition-colors shrink-0"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kondisi Saat Dipinjam</label>
            <select required value={formData.conditionOnBorrow} onChange={e => setFormData({...formData, conditionOnBorrow: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Baik">Baik</option>
              <option value="Kurang Baik">Kurang Baik</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tenggat Pengembalian</label>
            <input required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan</label>
            <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Opsional" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
            Simpan Transaksi
          </button>
        </form>
      </Modal>

      <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Pengembalian Buku">
        {transactionToReturn && (
           <form onSubmit={handleReturn} className="flex flex-col gap-4">
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 mb-2">
                 <h3 className="font-bold text-sm text-slate-50">{transactionToReturn.book?.title}</h3>
                 <p className="text-xs text-slate-300 mt-1">Peminjam: {transactionToReturn.member?.name}</p>
                 <p className="text-xs text-slate-300">Tenggat: {new Date(transactionToReturn.dueDate).toLocaleDateString('id-ID')}</p>
                 {transactionToReturn.status === 'overdue' && calculateFine(transactionToReturn.dueDate) > 0 && (
                    <div className="mt-2 text-xs font-bold text-red-400 bg-red-900/20 p-2 rounded border border-red-500/20">
                      Terlambat! Denda: Rp{calculateFine(transactionToReturn.dueDate).toLocaleString('id-ID')}
                    </div>
                 )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kondisi Saat Dikembalikan</label>
                <select required value={returnFormData.conditionOnReturn} onChange={e => setReturnFormData({...returnFormData, conditionOnReturn: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                  <option value="Baik">Baik</option>
                  <option value="Kurang Baik">Kurang Baik</option>
                  <option value="Rusak Berat">Rusak Berat</option>
                  <option value="Hilang">Hilang</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Catatan Pengembalian</label>
                <textarea rows={2} value={returnFormData.notes} onChange={e => setReturnFormData({...returnFormData, notes: e.target.value})} placeholder="Opsional" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none" />
              </div>
              <button type="submit" className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg">
                Konfirmasi Pengembalian
              </button>
           </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detail Transaksi Peminjaman">
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5 space-y-4">
               <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Buku yang Dipinjam</h3>
                  <p className="text-sm font-medium text-slate-50">{selectedTransaction.book?.title || 'Unknown'}</p>
                  <div className="flex flex-col gap-1.5 mt-1">
                    <p className="text-xs text-slate-400 font-mono">Reg: {selectedTransaction.book?.register || '-'} | ISBN: {selectedTransaction.book?.isbn || '-'}</p>
                    {selectedTransaction.bookNumber && (
                      <span className="text-xs font-bold text-yellow-400 font-mono bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 self-start">No. Buku: {selectedTransaction.bookNumber}</span>
                    )}
                  </div>
               </div>
               <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Peminjam</h3>
                  <p className="text-sm font-medium text-slate-50">{selectedTransaction.member?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-400 font-mono">NIS/NIP: {selectedTransaction.member?.nisNip || '-'} | {selectedTransaction.member?.email}</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Tgl Peminjaman</dt>
                  <dd className="text-slate-200">{new Date(selectedTransaction.borrowDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</dd>
               </div>
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Tenggat Waktu</dt>
                  <dd className="text-slate-200">{new Date(selectedTransaction.dueDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</dd>
               </div>
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Status Transaksi</dt>
                  <dd>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(selectedTransaction.status)}`}>
                        {getStatusText(selectedTransaction.status)}
                     </span>
                  </dd>
               </div>
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Denda Keterlambatan</dt>
                  <dd className="text-slate-200">
                    {calculateFine(selectedTransaction.dueDate) > 0 ? (
                       <span className="text-red-400 font-bold font-mono">Rp{calculateFine(selectedTransaction.dueDate).toLocaleString('id-ID')}</span>
                    ) : '-'}
                  </dd>
               </div>
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Kondisi (Pinjam)</dt>
                  <dd className="text-slate-200">{selectedTransaction.conditionOnBorrow || 'Baik'}</dd>
               </div>
               {selectedTransaction.status === 'returned' && (
                 <>
                   <div>
                      <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Tgl Pengembalian</dt>
                      <dd className="text-slate-200">{new Date(selectedTransaction.returnDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</dd>
                   </div>
                   <div>
                      <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Kondisi (Kembali)</dt>
                      <dd className="text-slate-200">{selectedTransaction.conditionOnReturn || 'Baik'}</dd>
                   </div>
                 </>
               )}
               {(selectedTransaction.notes) && (
                 <div className="col-span-2 mt-2 pt-4 border-t border-white/5">
                    <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Catatan Tambahan</dt>
                    <dd className="text-slate-200 text-xs italic">{selectedTransaction.notes}</dd>
                 </div>
               )}
            </div>
            
            <div className="pt-4 border-t border-white/5 flex gap-3">
              <button onClick={() => { setIsDetailOpen(false); openPrintLetter(selectedTransaction); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2 border border-slate-700">
                <Printer className="w-4 h-4" /> {selectedTransaction.status === 'returned' ? 'Cetak Bukti Kembali' : 'Cetak Bukti Pinjam'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Preview Modal */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title={printTransaction?.status === 'returned' ? "Cetak Bukti Pengembalian" : "Cetak Bukti Peminjaman"}>
        {printTransaction && (
          <div className="flex flex-col items-center gap-6">
            <div id="print-area" className="bg-white text-black w-full max-w-md rounded-xl p-6 shadow-sm border border-gray-300">
              {/* Header with School Identity */}
              <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
                <h2 className="font-extrabold text-base uppercase tracking-wider text-slate-900 leading-tight">
                  {settings?.libraryName || 'E-Perpus'}
                </h2>
                <h3 className="font-black text-sm uppercase tracking-tight text-slate-800 leading-normal mt-0.5">
                  {settings?.institutionName || 'SMP Negeri 1 Belajar'}
                </h3>
                <p className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-widest font-bold border-t border-gray-100 pt-1">
                  {printTransaction.status === 'returned' ? 'BUKTI PENGEMBALIAN BUKU' : 'BUKTI PEMINJAMAN BUKU'}
                </p>
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 border-b border-gray-100 pb-2">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider">ID Transaksi</span>
                    <span className="font-mono font-bold text-xs">TRX-{printTransaction.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider">Status</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${printTransaction.status === 'returned' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                      {printTransaction.status === 'returned' ? 'SUDAH KEMBALI' : 'SEDANG DIPINJAM'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-gray-100 pb-2">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider">Tanggal Pinjam</span>
                    <span className="font-semibold">{new Date(printTransaction.borrowDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider">Tenggat Kembali</span>
                    <span className="font-bold text-red-600">{new Date(printTransaction.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {printTransaction.status === 'returned' && (
                  <div className="grid grid-cols-2 gap-2 border-b border-gray-100 bg-emerald-50/50 p-2 rounded-lg pb-2">
                    <div>
                      <span className="text-emerald-700 block text-[9px] uppercase font-bold tracking-wider">Tanggal Kembali</span>
                      <span className="font-bold text-emerald-800">
                        {printTransaction.returnDate ? new Date(printTransaction.returnDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                    {calculateFine(printTransaction.dueDate) > 0 && (
                      <div className="text-right">
                        <span className="text-red-700 block text-[9px] uppercase font-bold tracking-wider">Denda Keterlambatan</span>
                        <span className="font-extrabold text-red-600">
                          Rp {calculateFine(printTransaction.dueDate).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-b border-gray-100 pb-2">
                  <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Peminjam</span>
                  <div className="font-bold text-gray-900">{printTransaction.member?.name}</div>
                  <div className="text-gray-600 text-[10px] flex gap-2 font-medium mt-0.5">
                    <span>NIS/NIP: {printTransaction.member?.nisNip || '-'}</span>
                    {printTransaction.member?.kelas && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span>Kelas {printTransaction.member?.kelas}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-b border-gray-100 pb-2">
                  <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Buku Perpustakaan</span>
                  <div className="font-bold text-gray-900 leading-snug">{printTransaction.book?.title}</div>
                  <div className="text-gray-600 text-[10px] mt-0.5">Penulis: {printTransaction.book?.author}</div>
                  <div className="text-gray-500 text-[9px] font-mono mt-1">Reg: {printTransaction.book?.register || '-'} | ISBN: {printTransaction.book?.isbn || '-'}</div>
                  {printTransaction.bookNumber && (
                    <div className="mt-1">
                      <span className="text-[9px] font-mono font-bold text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">No. Buku: {printTransaction.bookNumber}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-gray-100 pb-2">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider">Kondisi Pinjam</span>
                    <span className="font-semibold text-gray-700">{printTransaction.conditionOnBorrow || 'Baik'}</span>
                  </div>
                  {printTransaction.status === 'returned' && (
                    <div className="text-right">
                      <span className="text-gray-500 block text-[9px] uppercase font-bold tracking-wider">Kondisi Kembali</span>
                      <span className="font-semibold text-gray-700">{printTransaction.conditionOnReturn || 'Baik'}</span>
                    </div>
                  )}
                </div>
                
                {/* Barcode */}
                <div className="flex flex-col items-center justify-center py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <Barcode value={`TRX-${printTransaction.id}`} width={1.2} height={35} fontSize={9} margin={0} background="#f9fafb" />
                </div>

                {/* SIGNATURE SECTION */}
                <div className="grid grid-cols-2 gap-6 text-center text-xs mt-6 pt-4 border-t border-dashed border-gray-300">
                  <div className="flex flex-col justify-between h-24">
                    <p className="text-gray-600 font-bold uppercase text-[9px] tracking-wider">
                      {printTransaction.status === 'returned' ? 'Pengembali Buku' : 'Peminjam Buku'}
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="w-24 border-b border-gray-400 mb-1"></div>
                      <p className="font-bold text-gray-800 text-[10px] truncate max-w-[150px]">{printTransaction.member?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between h-24">
                    <p className="text-gray-600 font-bold uppercase text-[9px] tracking-wider">
                      {printTransaction.status === 'returned' ? 'Petugas Penerima' : 'Petugas Perpustakaan'}
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="w-24 border-b border-gray-400 mb-1"></div>
                      <p className="font-bold text-gray-800 text-[10px]">Staf Perpustakaan</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center text-[9px] text-gray-400 border-t border-gray-100 pt-3">
                <p className="font-medium">Terima kasih atas kerja samanya menjaga buku dengan baik.</p>
                <p className="mt-0.5">{settings?.libraryName || 'E-Perpus'} - {settings?.institutionName || 'SMP Negeri 1 Belajar'}</p>
              </div>
            </div>
            
            <button onClick={doPrint} className="w-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl transition-colors shadow-lg">
              <Printer className="w-5 h-5" /> Cetak Bukti Transaksi
            </button>
          </div>
        )}
      </Modal>

      {/* Modal Verifikasi / Konfirmasi Pengajuan Online */}
      <Modal
        isOpen={reviewAction !== null && selectedRequest !== null}
        onClose={() => { setReviewAction(null); setSelectedRequest(null); }}
        title={reviewAction === 'approve' ? 'Setujui Pengajuan Peminjaman' : 'Tolak Pengajuan Peminjaman'}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">{selectedRequest.requestCode}</span>
                <span className="text-blue-400 font-medium">Ambil: {selectedRequest.pickupDate}</span>
              </div>
              <div className="font-bold text-white text-base">{selectedRequest.bookTitle}</div>
              <div className="text-xs text-slate-300">
                Pemohon: <span className="font-semibold text-white">{selectedRequest.requesterName}</span> ({selectedRequest.nisNip}) - {selectedRequest.requesterRole} {selectedRequest.requesterClass && `Kelas ${selectedRequest.requesterClass}`}
              </div>
              {selectedRequest.notes && (
                <div className="text-xs text-slate-400 bg-white/5 p-2 rounded-lg italic">
                  Catatan Pemohon: "{selectedRequest.notes}"
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {reviewAction === 'approve' ? 'Catatan untuk Siswa / Guru (Lokasi Pengambilan)' : 'Alasan Penolakan'}
              </label>
              <textarea
                rows={3}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder={reviewAction === 'approve' ? 'Contoh: Buku sudah disiapkan di meja piket perpustakaan. Silakan bawa kartu anggota.' : 'Contoh: Buku sedang diperbaiki / kuota pinjam sudah habis.'}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setReviewAction(null); setSelectedRequest(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processingReq}
                onClick={() => handleUpdateReqStatus(
                  selectedRequest.id, 
                  reviewAction === 'approve' ? 'approved' : 'rejected',
                  adminNote
                )}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors text-white flex items-center gap-1.5 ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {reviewAction === 'approve' ? (
                  <>
                    <ThumbsUp className="w-4 h-4" /> Konfirmasi Setujui
                  </>
                ) : (
                  <>
                    <ThumbsDown className="w-4 h-4" /> Konfirmasi Tolak
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleSmartScan}
      />
    </div>
  );
}
