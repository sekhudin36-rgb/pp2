import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  UserPlus, 
  Users, 
  Calendar, 
  Search, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Camera, 
  Clock, 
  Sparkles,
  Printer
} from 'lucide-react';
import { Visitor, Member, SettingsData } from '../types';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { useToast } from '../components/Toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { showToast } = useToast();

  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestRole, setGuestRole] = useState('Siswa');
  const [guestClass, setGuestClass] = useState('');
  const [purpose, setPurpose] = useState('Membaca Buku');
  const [notes, setNotes] = useState('');

  const purposes = [
    'Membaca Buku',
    'Meminjam / Mengembalikan Buku',
    'Mengerjakan Tugas / PR',
    'Diskusi Kelompok',
    'Akses Internet / Komputer',
    'Kunjungan Kelas',
    'Lainnya'
  ];

  useEffect(() => {
    fetchVisitors();
    fetch('/api/members').then(res => res.json()).then(data => setMembers(Array.isArray(data) ? data : [])).catch(console.error);
    fetch('/api/settings').then(res => res.json()).then(setSettings).catch(console.error);
  }, []);

  const fetchVisitors = () => {
    setLoading(true);
    fetch('/api/visitors')
      .then(res => res.json())
      .then(data => {
        setVisitors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memId = e.target.value;
    setSelectedMemberId(memId);
    if (memId) {
      const found = members.find(m => m.id === memId);
      if (found) {
        setGuestName(found.name);
        setGuestRole(found.role);
        setGuestClass(found.kelas || '');
      }
    }
  };

  const handleBarcodeScanned = (code: string) => {
    const found = members.find(m => m.nisNip === code || m.id === code);
    if (found) {
      setSelectedMemberId(found.id);
      setGuestName(found.name);
      setGuestRole(found.role);
      setGuestClass(found.kelas || '');
      showToast(`Anggota terdeteksi: ${found.name}`);
    } else {
      showToast(`Kode "${code}" tidak ditemukan pada daftar anggota. Anda dapat memasukkan nama pengunjung secara langsung.`, 'info');
      setGuestName(code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      showToast('Nama pengunjung tidak boleh kosong', 'error');
      return;
    }

    const payload = {
      memberId: selectedMemberId || undefined,
      name: guestName.trim(),
      role: guestRole,
      kelasOrDept: guestClass.trim(),
      purpose,
      notes: notes.trim(),
      visitedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Presensi kehadiran pengunjung berhasil dicatat!');
        // Reset form
        setSelectedMemberId('');
        setGuestName('');
        setGuestClass('');
        setNotes('');
        fetchVisitors();
      } else {
        showToast('Gagal mencatat presensi pengunjung', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus riwayat kunjungan ini?')) {
      await fetch(`/api/visitors/${id}`, { method: 'DELETE' });
      showToast('Data kunjungan telah dihapus');
      fetchVisitors();
    }
  };

  // Filter visitors by search & selected date
  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.kelasOrDept && v.kelasOrDept.toLowerCase().includes(search.toLowerCase())) ||
      v.purpose.toLowerCase().includes(search.toLowerCase());
    
    const visitDateStr = v.visitedAt.split('T')[0];
    const matchesDate = !selectedDate || visitDateStr === selectedDate;
    return matchesSearch && matchesDate;
  });

  // Calculate statistics for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisitors = visitors.filter(v => v.visitedAt.startsWith(todayStr));
  const countToday = todayVisitors.length;
  const countSiswa = todayVisitors.filter(v => v.role === 'Siswa').length;
  const countGuruStaf = todayVisitors.filter(v => v.role === 'Guru' || v.role === 'Staf').length;
  const countUmum = todayVisitors.filter(v => v.role === 'Umum').length;

  const exportToExcel = () => {
    const dataToExport = filteredVisitors.map((v, i) => ({
      No: i + 1,
      Tanggal: new Date(v.visitedAt).toLocaleDateString('id-ID'),
      Waktu: new Date(v.visitedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      Nama: v.name,
      Kategori: v.role,
      'Kelas / Unit': v.kelasOrDept || '-',
      Keperluan: v.purpose,
      Keterangan: v.notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Buku Kunjungan');
    XLSX.writeFile(wb, `Buku_Kunjungan_Perpus_${selectedDate || 'Semua'}.xlsx`);
    showToast('Laporan kunjungan berhasil diekspor ke Excel');
  };

  const exportToPdf = () => {
    if (!settings) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Kop Surat
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text((settings.institutionName || 'SMP NEGERI 1 BELAJAR').toUpperCase(), pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text((settings.libraryName || 'PERPUSTAKAAN SEKOLAH').toUpperCase(), pageWidth / 2, 22, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Alamat: ${settings.address} | Telp: ${settings.phone} | Email: ${settings.email}`, pageWidth / 2, 28, { align: 'center' });

    doc.setLineWidth(0.8);
    doc.line(14, 32, pageWidth - 14, 32);
    doc.setLineWidth(0.3);
    doc.line(14, 33.5, pageWidth - 14, 33.5);

    // Judul
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DAFTAR HADIR PENGUNJUNG PERPUSTAKAAN (BUKU TAMU)', pageWidth / 2, 42, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 48);

    const tableRows = filteredVisitors.map((v, i) => [
      i + 1,
      new Date(v.visitedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      v.name,
      v.role + (v.kelasOrDept ? ` (${v.kelasOrDept})` : ''),
      v.purpose,
      v.notes || '-'
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['No', 'Waktu', 'Nama Pengunjung', 'Peran / Kelas', 'Keperluan', 'Keterangan']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });

    doc.save(`Daftar_Pengunjung_${selectedDate || 'Semua'}.pdf`);
    showToast('Daftar pengunjung berhasil diekspor ke PDF');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
            Buku Kunjungan Perpustakaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Presensi Pengunjung & Buku Tamu Harian Perpustakaan Sekolah</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <Camera className="w-3.5 h-3.5" /> Scan Kartu
          </button>
          <button
            onClick={exportToExcel}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> Excel
          </button>
          <button
            onClick={exportToPdf}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400">Total Pengunjung Hari Ini</p>
          <h3 className="text-2xl font-bold text-white mt-1">{countToday} <span className="text-xs text-emerald-400 font-normal">Orang</span></h3>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400">Pengunjung Siswa</p>
          <h3 className="text-2xl font-bold text-blue-400 mt-1">{countSiswa} <span className="text-xs text-slate-400 font-normal">Siswa</span></h3>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400">Pengunjung Guru / Staf</p>
          <h3 className="text-2xl font-bold text-indigo-400 mt-1">{countGuruStaf} <span className="text-xs text-slate-400 font-normal">Orang</span></h3>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400">Tamu Umum</p>
          <h3 className="text-2xl font-bold text-amber-400 mt-1">{countUmum} <span className="text-xs text-slate-400 font-normal">Orang</span></h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Presensi Cepat */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl h-fit">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" /> Catat Kehadiran Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick select registered member */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Pilih Dari Anggota Terdaftar (Opsional)</label>
              <select
                value={selectedMemberId}
                onChange={handleMemberSelect}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="" className="bg-slate-900 text-white">-- Pengunjung Baru / Umum / Ketik Manual --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name} ({m.role}{m.kelas ? ` - Kelas ${m.kelas}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Pengunjung */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Nama Lengkap *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Muhammad Faiz"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Kategori Peran</label>
                <select
                  value={guestRole}
                  onChange={e => setGuestRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Siswa" className="bg-slate-900">Siswa</option>
                  <option value="Guru" className="bg-slate-900">Guru</option>
                  <option value="Staf" className="bg-slate-900">Staf</option>
                  <option value="Umum" className="bg-slate-900">Umum / Tamu Luar</option>
                </select>
              </div>

              {/* Kelas / Departemen */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Kelas / Asal</label>
                <input
                  type="text"
                  placeholder="Contoh: 7-A / IPA"
                  value={guestClass}
                  onChange={e => setGuestClass(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Keperluan Kunjungan */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Keperluan Kunjungan</label>
              <select
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {purposes.map(p => (
                  <option key={p} value={p} className="bg-slate-900">{p}</option>
                ))}
              </select>
            </div>

            {/* Catatan / Topik Buku yang dibaca */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Catatan / Buku Yang Dibaca (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Membaca buku ensiklopedia sains"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Simpan Presensi Masuk
            </button>
          </form>
        </div>

        {/* Right Column: Table Daftar Hadir */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau kelas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-blue-400 hover:underline shrink-0"
                >
                  Semua Tanggal
                </button>
              )}
            </div>
          </div>

          {/* Visitors Table */}
          <div className="flex-1 overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 px-3">Waktu</th>
                  <th className="py-2.5 px-3">Nama Pengunjung</th>
                  <th className="py-2.5 px-3">Peran / Kelas</th>
                  <th className="py-2.5 px-3">Keperluan</th>
                  <th className="py-2.5 px-3">Catatan</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">Memuat data presensi...</td>
                  </tr>
                ) : filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Belum ada catatan kunjungan untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map(v => (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {new Date(v.visitedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">
                        {v.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.role === 'Siswa' ? 'bg-blue-500/10 text-blue-300' :
                          v.role === 'Guru' ? 'bg-emerald-500/10 text-emerald-300' :
                          'bg-amber-500/10 text-amber-300'
                        }`}>
                          {v.role} {v.kelasOrDept ? `(${v.kelasOrDept})` : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{v.purpose}</td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-[150px]">{v.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Barcode scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Scan Barcode Kartu Anggota / Siswa"
        promptText="Arahkan barcode pada kartu anggota atau kartu pelajar ke kamera"
      />
    </div>
  );
}
