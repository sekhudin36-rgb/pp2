import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Download, Upload, Printer, Eye, Award, Camera } from 'lucide-react';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Barcode from 'react-barcode';
import CertificateModal from '../components/CertificateModal';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { useToast } from '../components/Toast';

export default function Members() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterKelas, setFilterKelas] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkClassModalOpen, setIsBulkClassModalOpen] = useState(false);
  const [bulkClassValue, setBulkClassValue] = useState('');

  // Certificate (SKBP) and Scanner State
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [selectedCertificateMember, setSelectedCertificateMember] = useState<any>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '',
    address: '', role: 'Siswa', gender: 'Laki-laki', photo: '', status: 'Aktif', nisNip: '',
    kelas: '',
    joinedAt: new Date().toISOString().split('T')[0]
  });

  // Detail & Print state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMember, setPrintMember] = useState<any>(null);
  const [libraryName, setLibraryName] = useState('E-Perpus');
  const [institutionName, setInstitutionName] = useState('SMP Negeri 1 Belajar');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMembers();
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.libraryName) setLibraryName(data.libraryName);
        if (data.institutionName) setInstitutionName(data.institutionName);
      })
      .catch(err => console.error('Error loading settings in Members:', err));
  }, []);

  const fetchMembers = () => {
    setLoading(true);
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data);
        setLoading(false);
      });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    } else {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
    }
    setIsModalOpen(false);
    fetchMembers();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus anggota ini?')) {
      await fetch(`/api/members/${id}`, { method: 'DELETE' });
      // Remove deleted ID from selected set if present
      setSelectedIds(prev => prev.filter(x => x !== id));
      fetchMembers();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Yakin ingin menghapus ${selectedIds.length} anggota terpilih sekaligus?`)) {
      setLoading(true);
      try {
        await fetch('/api/members/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds })
        });
        setSelectedIds([]);
        fetchMembers();
      } catch (err) {
        console.error('Error deleting members in bulk:', err);
        setLoading(false);
      }
    }
  };

  const handleBulkEditClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await fetch('/api/members/bulk-edit-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, kelas: bulkClassValue })
      });
      setIsBulkClassModalOpen(false);
      setSelectedIds([]);
      fetchMembers();
    } catch (err) {
      console.error('Error editing classes in bulk:', err);
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({ 
      name: '', email: '', phone: '',
      address: '', role: 'Siswa', gender: 'Laki-laki', photo: '', status: 'Aktif', nisNip: '',
      kelas: '',
      joinedAt: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setFormData({ 
      name: member.name || '', 
      email: member.email || '', 
      phone: member.phone || '',
      address: member.address || '', 
      role: member.role || 'Siswa', 
      gender: member.gender || 'Laki-laki', 
      photo: member.photo || '', 
      status: member.status || 'Aktif', 
      nisNip: member.nisNip || '',
      kelas: member.kelas || '',
      joinedAt: member.joinedAt ? member.joinedAt.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (member: any) => {
    setSelectedMember(member);
    setIsDetailOpen(true);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(members.map(m => ({
      'Nama': m.name,
      'Email': m.email,
      'Telepon': m.phone,
      'Tgl Bergabung': new Date(m.joinedAt).toLocaleDateString('id-ID')
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anggota");
    XLSX.writeFile(wb, "Data_Anggota.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Data Anggota Perpustakaan", 14, 15);
    
    const tableColumn = ["Nama", "Email", "Telepon", "Tgl Bergabung"];
    const tableRows = members.map(m => [
      m.name,
      m.email,
      m.phone,
      new Date(m.joinedAt).toLocaleDateString('id-ID')
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20
    });
    
    doc.save("Data_Anggota.pdf");
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
        const memberData = {
          name: item['Nama'] || item['name'] || '',
          email: item['Email'] || item['email'] || '',
          phone: item['Telepon'] || item['phone'] || ''
        };
        await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData)
        });
      }
      fetchMembers();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const openPrintCard = (member: any) => {
    setPrintMember(member);
    setIsPrintModalOpen(true);
  };

  const doPrint = () => {
    window.print();
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) || 
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.nisNip && m.nisNip.toLowerCase().includes(search.toLowerCase())) ||
      (m.kelas && m.kelas.toLowerCase().includes(search.toLowerCase()));
    
    const year = new Date(m.joinedAt).getFullYear().toString();
    const matchesYear = filterYear === 'All' || year === filterYear;
    const matchesKelas = filterKelas === 'All' || m.kelas === filterKelas;
    return matchesSearch && matchesYear && matchesKelas;
  });

  const years = Array.from(new Set(members.map(m => new Date(m.joinedAt).getFullYear().toString()))).sort((a,b) => Number(b)-Number(a));
  const classes = Array.from(new Set(members.map(m => m.kelas).filter(k => k && k.trim() !== ''))).sort();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 shrink-0 mt-2 mb-3 sm:mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">Data Anggota</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Daftar siswa, guru, dan tenaga kependidikan</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} />
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> IMPOR
          </button>
          <button onClick={handleExportExcel} className="flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center">
            <Download className="w-3.5 h-3.5 mr-1.5" /> EXCEL
          </button>
          <button onClick={handleExportPDF} className="flex-1 sm:flex-initial justify-center px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center">
            <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col flex-1 min-h-[420px] lg:min-h-0">
        <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-b border-white/10 flex justify-between items-stretch sm:items-center flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Cari nama / email / NIS..." 
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-900/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-50 placeholder-slate-400 transition-all"
              />
            </div>
            <select 
              value={filterYear} 
              onChange={e => setFilterYear(e.target.value)}
              className="px-3 sm:px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 text-xs sm:text-sm text-slate-200 outline-none"
            >
              <option value="All">Semua Tahun</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select 
              value={filterKelas} 
              onChange={e => setFilterKelas(e.target.value)}
              className="px-3 sm:px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/50 text-xs sm:text-sm text-slate-200 outline-none"
            >
              <option value="All">Semua Kelas</option>
              {classes.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>
          <button onClick={openAddModal} className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 mr-1" /> TAMBAH ANGGOTA
          </button>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="px-8 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex flex-col sm:flex-row justify-between items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-indigo-300 font-mono">
                {selectedIds.length} ANGGOTA TERPILIH
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => {
                  setBulkClassValue('');
                  setIsBulkClassModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <Edit2 className="w-3.5 h-3.5" /> UBAH KELAS SEKALIGUS
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> HAPUS SEKALIGUS
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto flex-1 min-h-[350px] lg:min-h-0">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5 bg-slate-900/20">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredMembers.length > 0 && filteredMembers.every(m => selectedIds.includes(m.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const currentFilteredIds = filteredMembers.map(m => m.id);
                        setSelectedIds(prev => Array.from(new Set([...prev, ...currentFilteredIds])));
                      } else {
                        const currentFilteredIds = filteredMembers.map(m => m.id);
                        setSelectedIds(prev => prev.filter(id => !currentFilteredIds.includes(id)));
                      }
                    }}
                    className="w-4 h-4 rounded border-white/10 bg-slate-950/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
                  />
                </th>
                <th className="px-8 py-4 font-semibold">Nama Lengkap</th>
                <th className="px-8 py-4 font-semibold">NIS/NIP & Tipe</th>
                <th className="px-8 py-4 font-semibold">Kontak</th>
                <th className="px-8 py-4 font-semibold">Tgl Bergabung</th>
                <th className="px-8 py-4 font-semibold text-center">Status</th>
                <th className="px-8 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Memuat data...</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Data anggota kosong</td></tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(prev => [...prev, member.id]);
                          } else {
                            setSelectedIds(prev => prev.filter(id => id !== member.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-white/10 bg-slate-950/50 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-8 py-4 font-medium text-slate-50">
                      <div className="flex items-center">
                        {member.photo ? (
                          <img src={member.photo} alt="Foto" className="w-8 h-8 rounded-full border border-white/10 mr-3 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold mr-3 shadow-md">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span>{member.name}</span>
                          <span className="text-[10px] text-slate-400">{member.gender === 'Laki-laki' ? 'L' : 'P'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-50">{member.nisNip || '-'}</span>
                        <div className="flex gap-1.5 items-center mt-0.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded">{member.role}</span>
                          {member.role === 'Siswa' && member.kelas && (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">Kelas {member.kelas}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-slate-300">
                      <div className="flex flex-col space-y-1 text-xs">
                        <span className="flex items-center"><Mail className="w-3 h-3 mr-1.5 text-slate-400"/> {member.email}</span>
                        <span className="flex items-center"><Phone className="w-3 h-3 mr-1.5 text-slate-400"/> {member.phone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 font-mono text-xs text-slate-400 uppercase">
                      {new Date(member.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric'})}
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${member.status?.toLowerCase() === 'aktif' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {member.status || 'Aktif'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button onClick={() => { setSelectedCertificateMember(member); setIsCertificateOpen(true); }} className="text-slate-400 hover:text-amber-400 p-1.5 transition-colors" title="Cetak Surat Bebas Pustaka (SKBP)"><Award className="w-4 h-4" /></button>
                      <button onClick={() => openDetailModal(member)} className="text-slate-400 hover:text-white p-1.5 transition-colors" title="Lihat Detail"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openPrintCard(member)} className="text-slate-400 hover:text-emerald-400 p-1.5 transition-colors" title="Cetak Kartu"><Printer className="w-4 h-4" /></button>
                      <button onClick={() => openEditModal(member)} className="text-slate-400 hover:text-blue-400 p-1.5 ml-1 transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(member.id)} className="text-slate-400 hover:text-red-400 p-1.5 ml-1 transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[11px] text-slate-500 uppercase tracking-widest shrink-0">
          <span>Menampilkan {filteredMembers.length} anggota aktif</span>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? "Edit Anggota" : "Tambah Anggota"}>
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-white/5 pb-4">
               {formData.photo ? (
                 <img src={formData.photo} alt="Foto Profil" className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-lg" />
               ) : (
                 <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-xs text-slate-500">No Photo</span>
                 </div>
               )}
               <div className="w-full">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Upload Foto</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData({...formData, photo: reader.result as string});
                      reader.readAsDataURL(file);
                    }
                  }} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Peran / Tipe Anggota</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="Siswa">Siswa</option>
                  <option value="Guru">Guru</option>
                  <option value="Karyawan">Karyawan / Staf</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">NIS / NIP</label>
                  <button 
                    type="button" 
                    onClick={() => setIsScannerOpen(true)}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                  >
                    <Camera className="w-3 h-3" /> Scan Kartu
                  </button>
                </div>
                <input type="text" value={formData.nisNip} onChange={e => setFormData({...formData, nisNip: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              {formData.role === 'Siswa' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kelas</label>
                  <input required={formData.role === 'Siswa'} type="text" value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} placeholder="Misal: 7-A, 8-B, 9-C" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Jenis Kelamin</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status Keanggotaan</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nomor Telepon</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Alamat Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Alamat Lengkap</label>
                <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tanggal Bergabung</label>
                <input required type="date" value={formData.joinedAt} onChange={e => setFormData({...formData, joinedAt: e.target.value})} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <button type="submit" className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors sticky bottom-0 z-10 shadow-lg">
              {editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
            </button>
          </form>
        </div>
      </Modal>

      {/* Member Details Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detail Anggota">
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
               {selectedMember.photo ? (
                 <img src={selectedMember.photo} alt="Foto Profil" className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 shadow-xl" />
               ) : (
                 <div className="w-24 h-24 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-3xl shadow-xl shrink-0">
                    {selectedMember.name.charAt(0).toUpperCase()}
                 </div>
               )}
               <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-white">{selectedMember.name}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-medium">{selectedMember.role}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${selectedMember.status?.toLowerCase() === 'aktif' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {selectedMember.status || 'Aktif'}
                    </span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">NIS / NIP</dt>
                  <dd className="text-slate-200 font-mono">{selectedMember.nisNip || '-'}</dd>
               </div>
               {selectedMember.role === 'Siswa' && (
                 <div>
                    <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Kelas</dt>
                    <dd className="text-slate-200">Kelas {selectedMember.kelas || '-'}</dd>
                 </div>
               )}
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Jenis Kelamin</dt>
                  <dd className="text-slate-200">{selectedMember.gender || '-'}</dd>
               </div>
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Email</dt>
                  <dd className="text-slate-200">{selectedMember.email}</dd>
               </div>
               <div>
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Telepon</dt>
                  <dd className="text-slate-200">{selectedMember.phone}</dd>
               </div>
               <div className="col-span-2">
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Alamat</dt>
                  <dd className="text-slate-200">{selectedMember.address || '-'}</dd>
               </div>
               <div className="col-span-2">
                  <dt className="text-xs text-slate-400 font-semibold mb-1 uppercase">Bergabung Sejak</dt>
                  <dd className="text-slate-200">{new Date(selectedMember.joinedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}</dd>
               </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex gap-3">
              <button onClick={() => { setIsDetailOpen(false); openEditModal(selectedMember); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Data
              </button>
              <button onClick={() => { setIsDetailOpen(false); openPrintCard(selectedMember); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2 border border-slate-700">
                <Printer className="w-4 h-4" /> Cetak Kartu
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Preview Modal */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Cetak Kartu Anggota">
        {printMember && (
          <div className="flex flex-col items-center gap-6">
            <div id="print-area" className="bg-white text-black w-80 rounded-xl overflow-hidden border border-gray-300 shadow-sm relative print:border-gray-800 print:shadow-none">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-center text-white relative">
                <h3 className="font-extrabold tracking-wider uppercase text-[11px] leading-tight">{libraryName}</h3>
                <h4 className="font-black tracking-normal uppercase text-[12px] leading-normal mt-0.5 truncate">{institutionName}</h4>
                <p className="text-[9px] opacity-85 uppercase tracking-widest font-bold mt-1.5 border-t border-white/20 pt-1">Kartu Tanda Anggota</p>
              </div>
              <div className="p-5 flex flex-col items-center border-b border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center font-bold text-2xl text-slate-700 mb-3 border-4 border-white shadow-sm -mt-10 relative z-10 print:border-gray-200">
                  {printMember.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-center text-lg leading-tight text-slate-900">{printMember.name}</h3>
                <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mt-0.5 mb-1">
                  {printMember.role} {printMember.kelas ? `• Kelas ${printMember.kelas}` : ''}
                </div>
                <p className="text-xs text-gray-500 text-center font-mono mt-1">NIS/NIP: {printMember.nisNip || '-'}</p>
                <p className="text-xs text-gray-500 text-center mt-1">{printMember.email}</p>
                <p className="text-xs text-gray-500 text-center">{printMember.phone}</p>
              </div>
              <div className="p-4 flex flex-col items-center bg-gray-50">
                <Barcode value={`MEM-${printMember.id}`} width={1.5} height={40} fontSize={10} margin={0} background="#f9fafb" />
                <p className="text-[9px] text-gray-400 mt-3 text-center">Berlaku selama menjadi anggota perpustakaan resmi.</p>
                <p className="text-[8px] text-gray-400 text-center mt-0.5">{institutionName}</p>
              </div>
            </div>
            
            <button onClick={doPrint} className="w-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center gap-2 text-white font-bold py-2 rounded-lg transition-colors">
              <Printer className="w-5 h-5" /> Cetak Kartu
            </button>
          </div>
        )}
      </Modal>

      {/* Bulk Edit Class Modal */}
      <Modal isOpen={isBulkClassModalOpen} onClose={() => setIsBulkClassModalOpen(false)} title="Ubah Kelas Sekaligus">
        <form onSubmit={handleBulkEditClassSubmit} className="space-y-4">
          <p className="text-sm text-slate-300">
            Anda akan merubah kelas untuk <span className="font-bold text-indigo-400">{selectedIds.length}</span> anggota yang terpilih sekaligus.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Kelas Baru</label>
            <input 
              required 
              type="text" 
              value={bulkClassValue} 
              onChange={e => setBulkClassValue(e.target.value)} 
              placeholder="Misal: 7-A, 8-B, 9-C" 
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-100" 
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={() => setIsBulkClassModalOpen(false)}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors text-sm"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors text-sm"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Certificate Modal (SKBP - Bebas Pustaka) */}
      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => {
          setIsCertificateOpen(false);
          setSelectedCertificateMember(null);
        }}
        member={selectedCertificateMember}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(scannedCode) => {
          setIsScannerOpen(false);
          setFormData(prev => ({ ...prev, nisNip: scannedCode }));
          showToast(`NIS/NIP terisi: ${scannedCode}`, 'success');
        }}
      />
    </div>
  );
}
