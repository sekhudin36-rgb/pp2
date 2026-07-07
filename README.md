# Aplikasi Manajemen Perpustakaan Digital

Aplikasi Manajemen Perpustakaan Digital ini sudah dikonfigurasi dengan sistem klien (React/Vite) dan server (Express).

## Cara Menjalankan Aplikasi di Komputer Anda

Sebelum menjalankan aplikasi, pastikan komputer Anda sudah terinstal [Node.js](https://nodejs.org/en/download/) (Disarankan versi LTS).

### Pengguna Windows:
1. Pastikan Anda berada di dalam folder aplikasi ini.
2. Klik dua kali pada file **`Mulai_Aplikasi.bat`**.
   - *Catatan:* Saat pertama kali dijalankan, script akan mengunduh dependensi secara otomatis.
   - Jika muncul peringatan "Windows protected your PC", klik **More Info** (Info lebih lanjut) lalu pilih **Run anyway** (Tetap jalankan).
   - Setelah selesai, buka browser Anda (Chrome/Edge) dan akses alamat:
     👉 **http://localhost:3000**

### Pengguna Mac:
1. Buka folder aplikasi ini.
2. Klik kanan pada file **`Mulai_Aplikasi.command`**, tahan tombol Option, dan pilih **Open**.
   - Atau bisa jalankan `chmod +x Mulai_Aplikasi.command` lalu klik dua kali.
3. Buka browser dan arahkan ke:  
   👉 **http://localhost:3000**

---

### Perintah Manual (Bila tidak menggunakan file run)
Buka Command Prompt atau Terminal di dalam folder proyek ini, dan ketikkan secara urut:
1. `npm install` (Hanya perlu sekali)
2. `npm run dev`

---

## Cara Reset Data
Semua data (Buku, Anggota, Transaksi, Pengaturan) disimpan secara lokal di dalam file `database.json`.
- Jika Anda ingin mereset/menghapus seluruh data dan memulai dari awal, hapus saja file `database.json`. Aplikasi akan secara otomatis membuat database kosong baru saat dijalankan kembali.
