@echo off
:: =========================================================================
:: Script Otomatis Pemasangan & Peluncuran Aplikasi Perpustakaan (KIB E)
:: Didesain untuk Windows Command Prompt (CMD)
:: =========================================================================
title Aplikasi Perpustakaan KIB E - Installer & Runner

:: Set console colors (3: Aqua text on Black)
color 03
cls

echo =========================================================================
echo       SELAMAT DATANG DI INSTALLER APLIKASI PERPUSTAKAAN (KIB E)
echo =========================================================================
echo.
echo Script ini akan membantu Anda memasang dan menjalankan aplikasi ini
echo di laptop/PC lokal Anda secara otomatis.
echo.
echo -------------------------------------------------------------------------

:: 1. Cek apakah Node.js sudah terpasang menggunakan 'where'
echo [1/3] Memeriksa instalasi Node.js di laptop Anda...
where node >nul 2>&1
if %errorlevel% neq 0 goto :node_error

echo [OK] Node.js terdeteksi di sistem Anda.
echo Versi Node.js:
node -v
echo.
goto :check_npm_install

:node_error
color 0c
echo.
echo =========================================================================
echo [ERROR] Node.js TIDAK ditemukan atau belum terpasang di laptop Anda!
echo =========================================================================
echo.
echo Aplikasi ini membutuhkan Node.js (versi 18 atau lebih baru) untuk berjalan.
echo Silakan ikuti langkah mudah berikut:
echo 1. Download installer Node.js dari situs resmi:
echo    https://nodejs.org/en/download/ (Pilih versi LTS)
echo 2. Jalankan file hasil download tersebut dan selesaikan instalasi.
echo 3. Setelah selesai, buka kembali file batch ini (install-dan-jalankan.bat).
echo.
echo Membuka halaman resmi Node.js di browser Anda...
start https://nodejs.org/en/download/
echo.
echo Tekan tombol apa saja untuk menutup jendela ini...
pause >nul
exit

:check_npm_install
:: 2. Melakukan Instalasi Dependensi (npm install)
echo -------------------------------------------------------------------------
echo [2/3] Memasang dependensi aplikasi (memerlukan koneksi internet)...
echo Menjalankan 'npm install', mohon tunggu sebentar...
echo -------------------------------------------------------------------------
call npm install
if %errorlevel% neq 0 goto :install_error

echo [OK] Dependensi berhasil dipasang!
echo.
goto :choose_mode

:install_error
color 0c
echo.
echo =========================================================================
echo [ERROR] Gagal memasang dependensi (npm install)!
echo =========================================================================
echo.
echo Kemungkinan penyebab:
echo 1. Anda tidak terhubung ke internet.
echo 2. File package.json tidak ditemukan di folder ini.
echo.
echo Silakan periksa koneksi internet Anda dan jalankan kembali script ini.
pause
exit

:choose_mode
:: 3. Memilih Mode Peluncuran
echo -------------------------------------------------------------------------
echo [3/3] Mempersiapkan Peluncuran Aplikasi Perpustakaan
echo -------------------------------------------------------------------------
echo Silakan pilih mode peluncuran yang ingin Anda jalankan:
echo.
echo [1] Mode Developer (Mudah dimodifikasi, reload otomatis jika kode diubah)
echo [2] Mode Produksi  (Sangat cepat, build optimal, siap pakai)
echo.
set "pilihan=1"
set /p pilihan="Masukkan pilihan Anda [1 atau 2] (Default: 1): "

if "%pilihan%"=="2" goto :prod_mode
goto :dev_mode

:prod_mode
echo.
echo Memulai Proses Build untuk Mode Produksi...
call npm run build
if %errorlevel% neq 0 goto :build_failed

echo.
echo Menjalankan Server Produksi...
set NODE_ENV=production
:: Membuka halaman perpus secara otomatis di browser setelah jeda
start "" http://localhost:3000
call npm run dev
goto :end

:build_failed
color 0c
echo [WARNING] Proses build produksi gagal. Mencoba menjalankan dalam mode dev...
pause
color 03
goto :dev_mode

:dev_mode
echo.
echo Menjalankan Server dalam Mode Developer...
:: Membuka halaman perpus secara otomatis di browser setelah jeda
start "" http://localhost:3000
call npm run dev
goto :end

:end
echo.
echo Aplikasi telah dihentikan.
pause
