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
  RefreshCw, 
  Laptop,
  CheckCircle2,
  Wifi,
  WifiOff,
  FileCode,
  ShieldCheck,
  ArrowUpDown,
  Cloud,
  LogOut,
  ExternalLink,
  History,
  FileJson,
  Repeat,
  HardDrive,
  UserCheck,
  Layers
} from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import {
  getStoredToken,
  getStoredUserInfo,
  logoutGoogleDrive,
  getOrRequestToken,
  switchGoogleDriveAccount,
  fetchDriveAbout,
  uploadBackupToDrive,
  listDriveBackups,
  downloadDriveBackupContent,
  syncMasterDatabaseToDrive,
  fetchMasterDatabaseFromDrive,
  isDrivePrimaryDb,
  setDrivePrimaryDb,
  getLastDriveSync,
  DriveFileItem,
  DriveUserInfo
} from '../utils/googleDrive';

export default function Settings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('umum');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Sync / Dapodik State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>({
    status: 'online',
    isOnline: navigator.onLine,
    counts: { books: 0, members: 0, transactions: 0, visitors: 0 },
    lastSync: localStorage.getItem('last_dapodik_sync') || new Date().toISOString()
  });

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
  const [pinInput, setPinInput] = useState('1234');
  const [roleInput, setRoleInput] = useState('Staf');

  // Restore State
  const [restoring, setRestoring] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive State
  const [gdriveConnected, setGdriveConnected] = useState(false);
  const [gdriveUser, setGdriveUser] = useState<DriveUserInfo | null>(null);
  const [gdriveBackups, setGdriveBackups] = useState<DriveFileItem[]>([]);
  const [loadingDriveBackups, setLoadingDriveBackups] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [isRestoringFromDrive, setIsRestoringFromDrive] = useState(false);
  const [isSyncingMaster, setIsSyncingMaster] = useState(false);
  const [isPullingMaster, setIsPullingMaster] = useState(false);
  const [isDrivePrimaryDbState, setIsDrivePrimaryDbState] = useState<boolean>(() => isDrivePrimaryDb());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => getLastDriveSync());
  const [autoDriveBackup, setAutoDriveBackup] = useState<boolean>(() => {
    return localStorage.getItem('eperpus_auto_gdrive_backup') === 'true';
  });

  const checkGoogleDriveStatus = async () => {
    const token = getStoredToken();
    if (token) {
      setGdriveConnected(true);
      const user = getStoredUserInfo();
      if (user) setGdriveUser(user);
      loadDriveBackupsList(token);
      // Fetch latest drive quota in background
      fetchDriveAbout(token).then(updatedUser => {
        if (updatedUser) setGdriveUser(updatedUser);
      });
    } else {
      setGdriveConnected(false);
      setGdriveUser(null);
      setGdriveBackups([]);
    }
  };

  const loadDriveBackupsList = async (tokenOverride?: string) => {
    const token = tokenOverride || getStoredToken();
    if (!token) return;
    setLoadingDriveBackups(true);
    try {
      const files = await listDriveBackups(token);
      setGdriveBackups(files);
    } catch (err: any) {
      console.warn('Could not load drive backups:', err);
    } finally {
      setLoadingDriveBackups(false);
    }
  };

  const handleConnectGoogleDrive = async () => {
    try {
      const token = await getOrRequestToken();
      if (token) {
        setGdriveConnected(true);
        const user = await fetchDriveAbout(token);
        if (user) setGdriveUser(user);
        showToast('Berhasil terhubung ke akun Google Drive!', 'success');
        loadDriveBackupsList(token);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Gagal menghubungkan Google Drive: ' + (err.message || err), 'error');
    }
  };

  const handleSwitchGoogleAccount = async () => {
    try {
      showToast('Membuka jendela pemilihan akun Google...', 'info');
      const token = await switchGoogleDriveAccount();
      if (token) {
        setGdriveConnected(true);
        const user = await fetchDriveAbout(token);
        if (user) setGdriveUser(user);
        showToast(`Berhasil beralih ke akun Google: ${user?.email || 'Akun baru'}`, 'success');
        loadDriveBackupsList(token);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengganti akun Google: ' + (err.message || err), 'error');
    }
  };

  const handleDisconnectGoogleDrive = () => {
    if (confirm('Putuskan koneksi dari akun Google Drive ini? Data lokal di aplikasi tidak akan terhapus.')) {
      logoutGoogleDrive();
      setGdriveConnected(false);
      setGdriveUser(null);
      setGdriveBackups([]);
      setIsDrivePrimaryDbState(false);
      setDrivePrimaryDb(false);
      showToast('Koneksi Google Drive diputuskan.', 'info');
    }
  };

  const handleTogglePrimaryDriveDb = (enabled: boolean) => {
    setIsDrivePrimaryDbState(enabled);
    setDrivePrimaryDb(enabled);
    if (enabled) {
      showToast('Google Drive disetel sebagai Master Database Utama.', 'success');
      // Otomatis lakukan sinkronisasi pertama jika terhubung
      if (gdriveConnected) {
        handleSyncMasterDbNow();
      }
    } else {
      showToast('Mode Master Database Google Drive dinonaktifkan.', 'info');
    }
  };

  const handleSyncMasterDbNow = async () => {
    try {
      setIsSyncingMaster(true);
      const token = await getOrRequestToken();
      
      const res = await fetch('/api/export-db');
      if (!res.ok) throw new Error('Gagal mengambil data dari server lokal');
      const dbData = await res.json();

      await syncMasterDatabaseToDrive(token, dbData);
      const nowIso = new Date().toISOString();
      setLastSyncTime(nowIso);
      showToast('Database berhasil disinkronkan ke master Google Drive!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal menyinkronkan database ke Google Drive: ' + (err.message || err), 'error');
    } finally {
      setIsSyncingMaster(false);
    }
  };

  const handlePullMasterDbNow = async () => {
    if (!confirm('Apakah Anda yakin ingin menarik data dari Google Drive akun ini dan menimpa database lokal?')) {
      return;
    }

    try {
      setIsPullingMaster(true);
      const token = await getOrRequestToken();
      const masterData = await fetchMasterDatabaseFromDrive(token);

      if (!masterData) {
        showToast('File master database belum ditemukan di akun Drive ini. Silakan klik "Sinkronkan Sekarang" terlebih dahulu.', 'warning');
        return;
      }

      const res = await fetch('/api/restore-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData: masterData })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Database lokal berhasil diperbarui dari master Google Drive!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showToast(data.error || 'Gagal memulihkan database dari file master Drive.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memuat master database dari Drive: ' + err.message, 'error');
    } finally {
      setIsPullingMaster(false);
    }
  };

  const handleBackupNowToDrive = async () => {
    try {
      setIsUploadingToDrive(true);
      const token = await getOrRequestToken();
      
      // Ambil snapshot database terbaru dari server
      const res = await fetch('/api/export-db');
      if (!res.ok) throw new Error('Gagal mengambil data dari server');
      const dbData = await res.json();

      const uploaded = await uploadBackupToDrive(token, dbData);
      showToast(`Berhasil mencadangkan database ke Google Drive! (${uploaded.name})`, 'success');
      loadDriveBackupsList(token);
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mencadangkan ke Google Drive: ' + (err.message || err), 'error');
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  const handleRestoreFromDriveFile = async (file: DriveFileItem) => {
    if (!confirm(`Apakah Anda yakin ingin memulihkan database dari cadangan Google Drive: "${file.name}"? Seluruh data saat ini akan disinkronkan dengan cadangan ini.`)) {
      return;
    }

    try {
      setIsRestoringFromDrive(true);
      const token = await getOrRequestToken();
      const backupData = await downloadDriveBackupContent(token, file.id);

      const res = await fetch('/api/restore-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupData })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Database berhasil dipulihkan dari Google Drive!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showToast(data.error || 'Gagal memulihkan database dari file cadangan.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memulihkan dari Google Drive: ' + err.message, 'error');
    } finally {
      setIsRestoringFromDrive(false);
    }
  };

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
    fetchSyncStatus();
    checkGoogleDriveStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/sync/status');
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(prev => ({
          ...prev,
          ...data,
          isOnline: true
        }));
      }
    } catch {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/status');
      const data = await res.json();
      const now = new Date().toISOString();
      localStorage.setItem('last_dapodik_sync', now);
      setSyncStatus({
        ...data,
        isOnline: true,
        lastSync: now
      });
      showToast('Sinkronisasi Dapodik Berhasil! Semua data telah sinkron.', 'success');
    } catch (err) {
      showToast('Sinkronisasi gagal: Server tidak dapat dijangkau', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadBatchScript = () => {
    const scriptContent = `@echo off
title E-PERPUS - Sistem Manajemen Perpustakaan Sekolah
color 0A
cls
echo ====================================================================
echo        E-PERPUS - SISTEM PERPUSTAKAAN SEKOLAH (OFFLINE / ONLINE)
echo ====================================================================
echo.
echo [1/3] Memeriksa instalasi Node.js pada laptop / PC ini...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [PERINGATAN] Node.js belum terdeteksi di laptop ini!
    echo Silakan unduh dan install Node.js terlebih dahulu dari:
    echo https://nodejs.org/ (pilih versi LTS)
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js terdeteksi:
node -v
echo.

echo [2/3] Memeriksa dependensi aplikasi...
if not exist "node_modules" (
    echo Mengunduh pustaka paket (hanya dilakukan pertama kali)...
    call npm install
    if %errorlevel% neq 0 (
        echo [GAGAL] Gagal menginstall dependensi npm.
        pause
        exit /b 1
    )
)

echo.
echo [3/3] Menjalankan Server E-Perpus...
echo.
echo --------------------------------------------------------------------
echo  Aplikasi Perpustakaan dapat dibuka di browser:
echo  URL Lokal  : http://localhost:3000
echo  URL Jaringan (LAN/WiFi): Bagikan IP laptop ini ke guru/siswa
echo --------------------------------------------------------------------
echo.
echo Menjalankan aplikasi... Tekan CTRL+C di jendela ini untuk menghentikan server.
echo.

:: Membuka browser otomatis setelah server siap
start "" "http://localhost:3000"

:: Menjalankan server node
npm run dev

:: Jika server berhenti atau error, jendela CMD TIDAK AKAN LANGSUNG HILANG
echo.
echo ====================================================================
echo Server E-Perpus telah dihentikan.
echo ====================================================================
pause
`;

    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'start-eperpus.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('File start-eperpus.bat berhasil didownload!', 'success');
  };

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
    setPinInput('1234');
    setRoleInput('Staf');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: any) => {
    setSelectedUser(user);
    setUsernameInput(user.username);
    setPasswordInput(user.password);
    setPinInput(user.pin || '1234');
    setRoleInput(user.role);
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      alert('Username dan password wajib diisi');
      return;
    }
    if (pinInput && !/^\d{4,6}$/.test(pinInput.trim())) {
      alert('PIN harus berupa 4 sampai 6 angka (contoh: 1234)');
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
          pin: pinInput ? pinInput.trim() : '1234',
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 min-h-full flex flex-col">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Konfigurasi profil perpustakaan dan preferensi aplikasi</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 min-h-full flex-1">
        {/* Sidebar Settings Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar">
          <button 
            onClick={() => setActiveTab('umum')}
            className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-left rounded-xl transition-all text-xs sm:text-sm shrink-0 md:shrink ${
              activeTab === 'umum' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Library className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Identitas Perpustakaan</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('sirkulasi')}
            className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-left rounded-xl transition-all text-xs sm:text-sm shrink-0 md:shrink ${
              activeTab === 'sirkulasi' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ServerCog className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Aturan Sirkulasi</span>
          </button>

          <button 
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-left rounded-xl transition-all text-xs sm:text-sm shrink-0 md:shrink ${
              activeTab === 'database' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Database className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Manajemen Data</span>
          </button>

          <button 
            onClick={() => setActiveTab('gdrive')}
            className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-left rounded-xl transition-all text-xs sm:text-sm shrink-0 md:shrink ${
              activeTab === 'gdrive' ? 'bg-emerald-600/20 text-emerald-400 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Cloud className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Google Drive</span>
          </button>

          <button 
            onClick={() => setActiveTab('dapodik')}
            className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-left rounded-xl transition-all text-xs sm:text-sm shrink-0 md:shrink ${
              activeTab === 'dapodik' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Sinkronisasi & Offline</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 whitespace-nowrap text-left rounded-xl transition-all text-xs sm:text-sm shrink-0 md:shrink ${
              activeTab === 'users' ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <UserCog className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Akses & Akun</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-8 relative">
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

          {activeTab === 'gdrive' && (
            <div className="max-w-3xl animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-emerald-400" />
                    Penyimpanan & Database Google Drive
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Atur akun Google Drive yang aktif untuk dijadikan basis data utama cloud atau penyimpanan cadangan berkala perpustakaan.
                  </p>
                </div>
                {gdriveConnected ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={handleSwitchGoogleAccount}
                      className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Pilih dan hubungkan akun Google Drive lain"
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Ganti Akun Google</span>
                    </button>
                    <button 
                      onClick={handleDisconnectGoogleDrive}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Putuskan akun saat ini"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Putuskan</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleConnectGoogleDrive}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Hubungkan Akun Google Drive</span>
                  </button>
                )}
              </div>

              {/* Active Google Account Card with Quota & Switcher */}
              <div className={`p-5 rounded-2xl border transition-all ${
                gdriveConnected 
                  ? 'bg-emerald-950/20 border-emerald-500/30 shadow-lg shadow-emerald-950/10' 
                  : 'bg-slate-900/40 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {gdriveUser?.picture ? (
                      <img 
                        src={gdriveUser.picture} 
                        alt="Google Avatar" 
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full border-2 border-emerald-500/50 object-cover shadow-sm" 
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${gdriveConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Cloud className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base">
                          {gdriveConnected ? (gdriveUser?.name || 'Akun Google Terhubung') : 'Google Drive Belum Terhubung'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                          gdriveConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {gdriveConnected ? 'TERHUBUNG' : 'TIDAK TERHUBUNG'}
                        </span>
                        {isDrivePrimaryDbState && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            MASTER DATABASE AKTIF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">
                        {gdriveConnected 
                          ? (gdriveUser?.email || 'Akun Google aktif')
                          : 'Hubungkan akun Google Drive untuk menyimpan database secara terpusat di cloud.'}
                      </p>
                      {gdriveConnected && (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            Folder Penyimpanan:{' '}
                            <strong className="text-slate-300 font-medium">E-Perpus Backup & Koleksi</strong>
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {gdriveConnected && (
                    <button 
                      onClick={handleSwitchGoogleAccount}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shrink-0 self-start sm:self-auto"
                    >
                      <Repeat className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ubah / Ganti Akun</span>
                    </button>
                  )}
                </div>

                {/* Storage Quota Progress Bar (if available) */}
                {gdriveConnected && gdriveUser?.storageQuota && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20">
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        Kapasitas Ruang Google Drive
                      </span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {(() => {
                          const quota = gdriveUser.storageQuota;
                          if (quota?.usage && quota?.limit && Number(quota.limit) > 0) {
                            const usedGb = (Number(quota.usage) / (1024 * 1024 * 1024)).toFixed(2);
                            const totalGb = (Number(quota.limit) / (1024 * 1024 * 1024)).toFixed(1);
                            const pct = Math.min(100, Math.round((Number(quota.usage) / Number(quota.limit)) * 100));
                            return `${usedGb} GB / ${totalGb} GB (${pct}%)`;
                          } else if (quota?.usage) {
                            const usedMb = (Number(quota.usage) / (1024 * 1024)).toFixed(1);
                            return `${usedMb} MB digunakan (Akun Google Workspace Sekolah)`;
                          }
                          return 'Tersedia';
                        })()}
                      </span>
                    </div>
                    {gdriveUser.storageQuota.limit && Number(gdriveUser.storageQuota.limit) > 0 && (
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(100, Math.round((Number(gdriveUser.storageQuota.usage || 0) / Number(gdriveUser.storageQuota.limit)) * 100))}%` 
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Master Database Configuration Card */}
              {gdriveConnected && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/20 via-slate-900/50 to-slate-900/40 border border-blue-500/20 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Gunakan Akun Ini sebagai Master Database</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-xl">
                          Saat mode ini diaktifkan, data perpustakaan (buku, anggota, sirkulasi) akan disimpan dalam file master cloud <code className="text-blue-300 bg-blue-950/40 px-1 py-0.5 rounded text-[11px]">eperpus_master_database.json</code> di akun Google Drive yang terhubung ini.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input 
                        type="checkbox" 
                        checked={isDrivePrimaryDbState} 
                        onChange={(e) => handleTogglePrimaryDriveDb(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Sync Action Controls */}
                  <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-slate-400">
                      <span>Terakhir Disinkronkan:{' '}</span>
                      <strong className="text-slate-200">
                        {lastSyncTime ? new Date(lastSyncTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Belum pernah disinkronkan'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleSyncMasterDbNow}
                        disabled={isSyncingMaster}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Unggah data saat ini ke master database Google Drive"
                      >
                        {isSyncingMaster ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyinkronkan...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Sinkronkan ke Akun Ini</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handlePullMasterDbNow}
                        disabled={isPullingMaster}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Tarik data master dari Google Drive dan terapkan ke database lokal"
                      >
                        {isPullingMaster ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menerapkan...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Terapkan Database dari Drive Ini</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Automatic Backup Preference */}
              {gdriveConnected && (
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Cadangkan Snapshot Otomatis</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Membuat file snapshot riwayat berkala di Google Drive saat buku baru atau sirkulasi diperbarui.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoDriveBackup} 
                      onChange={(e) => {
                        const val = e.target.checked;
                        setAutoDriveBackup(val);
                        localStorage.setItem('eperpus_auto_gdrive_backup', String(val));
                        showToast(val ? 'Pencadangan snapshot otomatis diaktifkan.' : 'Pencadangan snapshot dimatikan.', 'info');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}

              {/* Drive Backups List & Restore */}
              <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-white text-sm">Riwayat Titik Pemulihan (Snapshots) di Drive</h3>
                  </div>
                  {gdriveConnected && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleBackupNowToDrive}
                        disabled={isUploadingToDrive}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        {isUploadingToDrive ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Buat Snapshot Baru</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => loadDriveBackupsList()} 
                        disabled={loadingDriveBackups}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1.5"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingDriveBackups ? 'animate-spin' : ''}`} />
                        <span>Muat Ulang</span>
                      </button>
                    </div>
                  )}
                </div>

                {!gdriveConnected ? (
                  <div className="py-8 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-dashed border-slate-800 p-6">
                    <Cloud className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">Belum Ada Akun Google Drive Terhubung</p>
                    <p className="mt-1">Silakan hubungkan akun Google Drive Anda di atas untuk mulai mencadangkan dan menyinkronkan data.</p>
                  </div>
                ) : loadingDriveBackups ? (
                  <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span>Membaca daftar file cadangan dari Google Drive...</span>
                  </div>
                ) : gdriveBackups.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-dashed border-slate-800 p-6">
                    <FileJson className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">Folder Google Drive Masih Kosong</p>
                    <p className="mt-1">Belum ada file snapshot cadangan. Klik "Buat Snapshot Baru" untuk membuat titik pemulihan pertama Anda.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {gdriveBackups.map((file) => {
                      const dateDisplay = file.createdTime ? new Date(file.createdTime).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      }) : 'Waktu tidak diketahui';

                      return (
                        <div key={file.id} className="p-3.5 bg-slate-800/60 hover:bg-slate-800 border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                              <FileJson className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-white truncate">{file.name}</h4>
                              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{dateDisplay}</span>
                                {file.size && (
                                  <>
                                    <span>•</span>
                                    <span>{(Number(file.size) / 1024).toFixed(1)} KB</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {file.webViewLink && (
                              <a 
                                href={file.webViewLink} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-xs flex items-center gap-1"
                                title="Buka di Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleRestoreFromDriveFile(file)}
                              disabled={isRestoringFromDrive}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Pulihkan Data</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dapodik' && (
            <div className="max-w-3xl animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5 text-blue-400" />
                  Sinkronisasi Dapodik & Sistem Offline-Online
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Arsitektur perpustakaan dirancang dapat beroperasi secara mandiri saat offline (di laptop sekolah) dan melakukan sinkronisasi data saat terkoneksi.
                </p>
              </div>

              {/* Realtime Status Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/20 via-slate-900/40 to-slate-900/40 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${syncStatus.isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {syncStatus.isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${syncStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span className="font-bold text-slate-100 text-sm">
                        {syncStatus.isOnline ? 'Mode Terhubung (Online Server)' : 'Mode Lokal (Offline / Standalone)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sinkronisasi Terakhir: {new Date(syncStatus.lastSync).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>
              </div>

              {/* Data Sync Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Katalog Buku</span>
                  <p className="text-xl font-black text-slate-100 mt-1">{syncStatus.counts?.books ?? 0}</p>
                  <span className="text-[9px] text-emerald-400">Siap Sinkron</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Anggota Siswa/Guru</span>
                  <p className="text-xl font-black text-slate-100 mt-1">{syncStatus.counts?.members ?? 0}</p>
                  <span className="text-[9px] text-emerald-400">Siap Sinkron</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transaksi Sirkulasi</span>
                  <p className="text-xl font-black text-slate-100 mt-1">{syncStatus.counts?.transactions ?? 0}</p>
                  <span className="text-[9px] text-emerald-400">Siap Sinkron</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buku Tamu</span>
                  <p className="text-xl font-black text-slate-100 mt-1">{syncStatus.counts?.visitors ?? 0}</p>
                  <span className="text-[9px] text-emerald-400">Siap Sinkron</span>
                </div>
              </div>

              {/* Installer & 1-File Launcher Section */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-700/60 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-emerald-400" />
                      Script Launcher 1-Klik untuk Laptop / PC Sekolah
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Sesuai permintaan, file script batch ini telah disempurnakan dengan perintah <code className="text-amber-300 font-mono">pause</code> dan proteksi error sehingga jendela CMD <strong>TIDAK AKAN langsung hilang/menutup sendiri</strong> saat dijalankan di laptop Anda.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadBatchScript}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh start-eperpus.bat</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs space-y-2 text-slate-300 font-mono">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Petunjuk Penggunaan di Laptop / Komputer Sekolah:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 font-sans leading-relaxed">
                    <li>Pastikan laptop Anda telah terpasang <strong>Node.js</strong> (dapat diunduh dari <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-blue-400 underline">nodejs.org</a>).</li>
                    <li>Letakkan file <code className="text-emerald-300 font-mono bg-white/5 px-1 py-0.5 rounded">start-eperpus.bat</code> di dalam folder proyek perpustakaan.</li>
                    <li>Klik dua kali file <code className="text-emerald-300 font-mono bg-white/5 px-1 py-0.5 rounded">start-eperpus.bat</code>.</li>
                    <li>Jendela terminal akan mendeteksi status instalasi, menjalankan server, dan otomatis membuka peramban web ke <strong>http://localhost:3000</strong>.</li>
                    <li>Jika ada error apa pun, terminal tetap terbuka dan menampilkan pesan kesalahan lengkap tanpa langsung tertutup.</li>
                  </ol>
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
                      <th className="px-6 py-4">PIN Masuk Petugas</th>
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-xs font-bold rounded-lg">
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                            <span>{user.pin || '1234'}</span>
                          </span>
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
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>PIN Masuk Petugas (4-6 Angka)</span>
              <span className="text-amber-400 normal-case font-normal text-[11px]">Untuk login cepat petugas</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Contoh: 1234"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Petugas / admin dapat masuk langsung ke sistem dengan mengetikkan PIN ini.</p>
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
