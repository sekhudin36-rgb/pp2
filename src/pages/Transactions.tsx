import React, { useState, useEffect } from 'react';
import { Search, Plus, Repeat, AlertCircle, CheckCircle2, Printer, Download, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Barcode from 'react-barcode';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 mt-2 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Sirkulasi / Peminjaman</h1>
          <p className="text-sm text-slate-400 mt-1">Catatan peminjaman dan pengembalian buku</p>
        </div>
        <div className="flex gap-2">
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
                placeholder="Cari peminjam / judul buku..." 
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-50 placeholder-slate-400 transition-all"
              />
            </div>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 text-sm text-slate-200 outline-none"
            >
              <option value="All">Semua Status</option>
              <option value="borrowed">Sedang Dipinjam</option>
              <option value="returned">Dikembalikan</option>
              <option value="overdue">Terlambat</option>
            </select>
          </div>
          <button onClick={openAddModal} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center shrink-0">
            <Plus className="w-4 h-4 mr-1" /> PINJAM BARU
          </button>
        </div>
        
        <div className="overflow-x-auto flex-1">
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
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Transaksi Peminjaman">
        <form onSubmit={handleSave} className="flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pilih Anggota (Dikelompokkan per Kelas)</label>
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
              <button 
                type="button" 
                onClick={() => setSelectedBooks([...selectedBooks, { id: '', bookNumber: '' }])}
                className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-md text-xs font-bold transition-colors flex items-center shadow"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> TAMBAH BUKU
              </button>
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

    </div>
  );
}
