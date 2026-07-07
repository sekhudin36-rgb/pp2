import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Library, 
  Database, 
  CloudOff, 
  ServerCog, 
  Download, 
  UserCog, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Key, 
  Upload, 
  RefreshCw 
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('umum');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Settings State
  const [libraryName, setLibraryName] = useState('E-Perpus');
  const [institutionName, setInstitutionName] = useState('SMP Negeri 1 Belajar');
  const [address, setAddress] = useState('Jl. Pendidikan No. 1, Kota Belajar');
  const [phone, setPhone] = useState('021-1234567');
  const [email, setEmail] = useState('perpus@smp.belajar.id');
  const [headLibrarian, setHeadLibrarian] = useState('Ahmad Pustakawan, S.Pust');
  const [principalName, setPrincipalName] = useState('Budi Santoso, S.Pd., M.Pd.');

  const [maxBorrowDays, setMaxBorrowDays] = useState(7);
  const [maxBorrowItems, setMaxBorrowItems] = useState(3);
  const [finePerDay, setFinePerDay] = useState(0);

  // Users & Access State
  const [users, setUsers] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('Staf');

  // Restore State
  const [restoring, setRestoring] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setLibraryName(data.libraryName || 'E-Perpus');
        setInstitutionName(data.institutionName || 'SMP Negeri 1 Belajar');
        setAddress(data.address || 'Jl. Pendidikan No. 1, Kota Belajar');
        setPhone(data.phone || '021-1234567');
        setEmail(data.email || 'perpus@smp.belajar.id');
        setHeadLibrarian(data.headLibrarian || 'Ahmad Pustakawan, S.Pust');
        setPrincipalName(data.principalName || 'Budi Santoso, S.Pd., M.Pd.');
        setMaxBorrowDays(data.maxBorrowDays ?? 7);
        setMaxBorrowItems(data.maxBorrowItems ?? 3);
        setFinePerDay(data.finePerDay ?? 500);
        setLoaded(true);
      })
      .catch(console.error);

    fetchUsers();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          libraryName,
          institutionName,
          address,
          phone,
          email,
          headLibrarian,
          principalName,
          maxBorrowDays,
          maxBorrowItems,
          finePerDay
        })
      });
      alert('Pengaturan berhasil disimpan');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/export-db');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_eperpus_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh backup');
    }
  };

  const handleResetData = async () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA buku, anggota, dan sirkulasi? Tindakan ini TIDAK BISA DIBATALKAN. Data Anda akan lenyap seketika.')) {
      if (confirm('Anda yakin? Hal ini akan mereset database ke keadaan kosong.')) {
        try {
          await fetch('/api/reset-db', { method: 'POST' });
          alert('Database telah direset.');
          window.location.reload();
        } catch (err) {
          console.error(err);
          alert('Gagal reset database');
        }
      }
    }
  };

  // User accounts handlers
  const handleOpenAddUser = () => {
    setSelectedUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setRoleInput('Staf');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: any) => {
    setSelectedUser(user);
    setUsernameInput(user.username);
    setPasswordInput(user.password);
    setRoleInput(user.role);
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      alert('Username dan password wajib diisi');
      return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser?.id,
          username: usernameInput,
          password: passwordInput,
          role: roleInput
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(selectedUser ? 'Pengguna berhasil diperbarui' : 'Pengguna baru berhasil ditambahkan');
        setIsUserModalOpen(false);
        fetchUsers();
      } else {
        alert(data.error || 'Gagal menyimpan data pengguna');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungi server.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        const res = await fetch(`/api/users/${id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (res.ok) {
          alert('Pengguna berhasil dihapus');
          fetchUsers();
        } else {
          alert(data.error || 'Gagal menghapus pengguna');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus pengguna');
      }
    }
  };

  // Restore handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleRestoreFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleRestoreFile(e.target.files[0]);
    }
  };

  const handleRestoreFile = async (file: File) => {
    if (!file) return;
    if (!confirm('Apakah Anda yakin ingin memulihkan data dari file ini? Tindakan ini akan menggantikan seluruh data buku, anggota, sirkulasi, dan pengguna saat ini.')) {
      return;
    }
    
    setRestoring(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const backupData = JSON.parse(text);
        
        const res = await fetch('/api/restore-db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert('Data berhasil dipulihkan!');
          window.location.reload();
        } else {
          alert(data.error || 'Format data backup tidak valid atau gagal dipulihkan.');
        }
      } catch (err: any) {
        alert('Gagal mengurai file JSON: ' + err.message);
      } finally {
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  if (!loaded) return <div className="p-6 text-slate-400">Memuat pengaturan...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm text-slate-400 mt-1">Konfigurasi profil perpustakaan dan preferensi aplikasi</p>
      </div>

      <div className="flex gap-6 h-full min-h-0 flex-1 overflow-hidden">
        {/* Sidebar Settings Tabs */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('umum')}
            className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-all ${
              activeTab === 'umum' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Library className="w-5 h-5" />
            <span>Identitas Perpustakaan</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('sirkulasi')}
            className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-all ${
              activeTab === 'sirkulasi' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ServerCog className="w-5 h-5" />
            <span>Aturan Sirkulasi</span>
          </button>

          <button 
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-all ${
              activeTab === 'database' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Database className="w-5 h-5" />
            <span>Manajemen Data</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-all ${
              activeTab === 'users' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <UserCog className="w-5 h-5" />
            <span>Akses & Akun</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-y-auto p-8 relative">
          {activeTab === 'umum' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-white mb-6">Identitas Perpustakaan</h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Perpustakaan</label>
                    <input 
                      type="text" 
                      value={libraryName} 
                      onChange={e => setLibraryName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Instansi / Sekolah</label>
                    <input 
                      type="text" 
                      value={institutionName} 
                      onChange={e => setInstitutionName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kepala Perpustakaan</label>
                    <input 
                      type="text" 
                      value={headLibrarian} 
                      onChange={e => setHeadLibrarian(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kepala Sekolah</label>
                    <input 
                      type="text" 
                      value={principalName} 
                      onChange={e => setPrincipalName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">No. Telepon</label>
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Perpustakaan</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sirkulasi' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-white mb-6">Aturan Sirkulasi / Peminjaman</h2>
              
              <div className="space-y-6">
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Maksimal Hari Pinjam</h3>
                    <p className="text-sm text-slate-400 mt-1">Batas waktu peminjaman buku sebelum dianggap terlambat.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={maxBorrowDays} 
                      onChange={e => setMaxBorrowDays(Number(e.target.value))}
                      className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <span className="text-slate-400">Hari</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Maksimal Jumlah Buku</h3>
                    <p className="text-sm text-slate-400 mt-1">Batas jumlah buku yang dapat dipinjam bersamaan per anggota.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={maxBorrowItems} 
                      onChange={e => setMaxBorrowItems(Number(e.target.value))}
                      className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <span className="text-slate-400">Buku</span>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-white">Denda Keterlambatan (opsional)</h3>
                    <p className="text-sm text-slate-400 mt-1">Isi angka 0 jika tidak ada denda keterlambatan.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Rp</span>
                    <input 
                      type="number" 
                      value={finePerDay} 
                      onChange={e => setFinePerDay(Number(e.target.value))}
                      className="w-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-right text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <span className="text-slate-400 text-xs mt-1">/Hari</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <h2 className="text-xl font-bold text-white mb-6">Manajemen Data & Backup</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-4">
                      <CloudOff className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">Simpanan Lokal</h3>
                    <p className="text-xs text-slate-400 mb-4 h-12">Data saat ini disimpan pada memory browser / server node lokal. Tidak disinkronisasikan ke remote cloud.</p>
                    <button onClick={handleDownloadBackup} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-sm font-bold rounded-lg transition-colors w-full">
                      Download Backup (JSON)
                    </button>
                 </div>

                 <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-5 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-4">
                      <Database className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-amber-200 mb-2">Hapus Semua Data</h3>
                    <p className="text-xs text-amber-500/80 mb-4 h-12">Tindakan ini akan menghapus semua buku, anggota, dan catatan riwayat pinjaman. Tidak dapat dikembalikan.</p>
                    <button onClick={handleResetData} className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-sm font-bold rounded-lg transition-colors w-full">
                      Reset Database
                    </button>
                 </div>
              </div>

              {/* Restore Data Section */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Pulihkan Data (Restore)</h3>
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 hover:border-slate-600'
                  }`}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-white mb-1">
                    {restoring ? 'Sedang Memulihkan...' : 'Klik atau Seret file Backup (.json) di sini'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Mendukung Drag-and-Drop. Pilih file backup `.json` sebelumnya untuk mengembalikan seluruh database perpustakaan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="max-w-3xl animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Akses & Akun Petugas</h2>
                  <p className="text-xs text-slate-400 mt-1">Kelola username, password, dan hak akses petugas sistem perpustakaan</p>
                </div>
                <button
                  onClick={handleOpenAddUser}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-xs flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Akun</span>
                </button>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/40 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Password</th>
                      <th className="px-6 py-4">Hak Akses / Role</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((user: any) => (
                      <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                          {user.password}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                            user.role === 'Administrator' 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditUser(user)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                              title="Edit Pengguna"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          Belum ada pengguna terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-white/10 shrink-0">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>Simpan Perubahan</span>
        </button>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={selectedUser ? 'Edit Akun Petugas' : 'Tambah Akun Petugas'}
      >
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              required
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masukkan username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="text"
              required
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masukkan password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hak Akses / Role</label>
            <select
              value={roleInput}
              onChange={e => setRoleInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Administrator">Administrator</option>
              <option value="Staf">Staf Perpustakaan</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
