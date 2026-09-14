import jsPDF from 'jspdf';
import { BorrowRequest, SettingsData } from '../types';

export function downloadBorrowRequestPdf(
  request: BorrowRequest,
  settings?: SettingsData | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2); // 178mm

  let currentY = 16;

  // --- KOP SURAT RESMI PERPUSTAKAAN ---
  const institution = (settings?.institutionName || 'SMP NEGERI 1 BELAJAR').toUpperCase();
  const library = (settings?.libraryName || 'PERPUSTAKAAN "E-PERPUS"').toUpperCase();
  const address = settings?.address || 'Jl. Pendidikan No. 123, Kabupaten Belajar';
  const contact = `Telp: ${settings?.phone || '(021) 555-0192'} | Email: ${settings?.email || 'perpustakaan@belajar.sch.id'}`;

  // Decorative icon or emblem
  doc.setFillColor(37, 99, 235); // Blue primary
  doc.roundedRect(margin, currentY, 14, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EP', margin + 7, currentY + 9, { align: 'center' });

  // Institution text
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(institution, margin + 18, currentY + 4);

  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246); // Blue-500
  doc.text(library, margin + 18, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`${address} • ${contact}`, margin + 18, currentY + 13.5);

  currentY += 18;

  // Double line separator
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.3);
  doc.line(margin, currentY + 1.2, pageWidth - margin, currentY + 1.2);

  currentY += 8;

  // --- JUDUL DOKUMEN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text('BUKTI PENGAJUAN PEMINJAMAN BUKU (SEMENTARA)', pageWidth / 2, currentY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Slip Konfirmasi & Pemesanan Koleksi Online (OPAC Perpustakaan)', pageWidth / 2, currentY + 4.5, { align: 'center' });

  currentY += 10;

  // --- HIGHLIGHT BOX: KODE TIKET & STATUS ---
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 22, 3, 3, 'FD');

  // Left: Ticket code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('KODE TIKET PENGAJUAN', margin + 6, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text(request.requestCode || 'REQ-UNKNOWN', margin + 6, currentY + 15);

  // Right: Status Badge
  const statusLabel = 
    request.status === 'approved' ? 'DISETUJUI (SIAP DIAMBIL)' :
    request.status === 'fulfilled' ? 'BUKU TELAH DIAMBIL' :
    request.status === 'rejected' ? 'PENGAJUAN DITOLAK' : 'MENUNGGU VERIFIKASI';
  
  const statusBgColor: [number, number, number] = 
    request.status === 'approved' ? [209, 250, 229] : // emerald-100
    request.status === 'fulfilled' ? [224, 231, 255] : // indigo-100
    request.status === 'rejected' ? [254, 226, 226] : // rose-100
    [254, 243, 199]; // amber-100

  const statusTextColor: [number, number, number] = 
    request.status === 'approved' ? [6, 95, 70] : // emerald-800
    request.status === 'fulfilled' ? [55, 48, 163] : // indigo-800
    request.status === 'rejected' ? [153, 27, 27] : // rose-800
    [146, 64, 14]; // amber-800

  doc.setFillColor(...statusBgColor);
  doc.roundedRect(pageWidth - margin - 72, currentY + 5, 66, 6.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...statusTextColor);
  doc.text(statusLabel, pageWidth - margin - 39, currentY + 9.5, { align: 'center' });

  // Date submitted info below status badge
  const reqDate = request.requestedAt 
    ? new Date(request.requestedAt).toLocaleString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }) + ' WIB'
    : '-';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Diajukan: ${reqDate}`, pageWidth - margin - 6, currentY + 16.5, { align: 'right' });

  currentY += 27;

  // Helper row drawer
  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, yPos, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin + 4, yPos + 4.2);
    return yPos + 6;
  };

  const drawField = (label: string, value: string, xPos: number, yPos: number, width: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, xPos, yPos);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    
    // Split text if too long
    const lines = doc.splitTextToSize(value || '-', width);
    doc.text(lines, xPos, yPos + 4.2);
    return lines.length * 4.5;
  };

  // --- 1. DATA PEMOHON ---
  currentY = drawSectionHeader('I. DATA IDENTITAS PEMOHON', currentY);
  currentY += 4;

  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 2;
  const colWidth = (contentWidth / 2) - 6;

  drawField('NAMA LENGKAP', request.requesterName, col1X, currentY, colWidth);
  drawField('NOMOR INDUK (NIS / NIP)', request.nisNip, col2X, currentY, colWidth);
  currentY += 10;

  const roleText = `${request.requesterRole}${request.requesterClass ? ` - Kelas ${request.requesterClass}` : ''}`;
  drawField('STATUS / KELAS', roleText, col1X, currentY, colWidth);
  drawField('NO. KONTAK / WHATSAPP', request.phone || 'Tidak dicantumkan', col2X, currentY, colWidth);
  currentY += 12;

  // --- 2. DATA BUKU YANG DIAJUKAN ---
  currentY = drawSectionHeader('II. DATA BUKU & KOLEKSI YANG DIAJUKAN', currentY);
  currentY += 4;

  const titleLines = doc.splitTextToSize(request.bookTitle || '-', contentWidth - 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('JUDUL BUKU', col1X, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(titleLines, col1X, currentY + 4.5);
  const titleHeight = Math.max(titleLines.length * 4.5, 5);
  currentY += 5 + titleHeight;

  drawField('PENULIS / PENGARANG', request.bookAuthor || 'Tidak tercatat', col1X, currentY, colWidth);
  drawField('KATEGORI BUKU', request.bookCategory || 'Umum', col2X, currentY, colWidth);
  currentY += 10;

  drawField('NOMOR ISBN', request.bookIsbn || '-', col1X, currentY, colWidth);
  drawField('KODE BUKU / ID', request.bookId, col2X, currentY, colWidth);
  currentY += 12;

  // --- 3. RENCANA PENGAMBILAN & DURASI ---
  currentY = drawSectionHeader('III. KETENTUAN PENGAMBILAN & PEMINJAMAN', currentY);
  currentY += 4;

  drawField('RENCANA TANGGAL PENGAMBILAN', request.pickupDate, col1X, currentY, colWidth);
  drawField('DURASI PEMINJAMAN', `${request.durationDays || 7} Hari Kalender`, col2X, currentY, colWidth);
  currentY += 10;

  if (request.notes) {
    drawField('CATATAN PEMOHON', request.notes, col1X, currentY, contentWidth - 8);
    currentY += 10;
  }

  if (request.adminNotes) {
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(191, 219, 254); // blue-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(29, 78, 216); // blue-700
    doc.text('CATATAN DARI PETUGAS PERPUSTAKAAN:', margin + 4, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(request.adminNotes, margin + 4, currentY + 8.5);
    currentY += 15;
  } else {
    currentY += 2;
  }

  // --- KOTAK SYARAT & KETENTUAN PENGAMBILAN ---
  doc.setFillColor(254, 252, 232); // yellow-50
  doc.setDrawColor(254, 240, 138); // yellow-200
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(161, 98, 7); // amber-700
  doc.text('PETUNJUK & SYARAT PENGAMBILAN BUKU:', margin + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Tunjukkan lembar bukti ini (cetak atau perlihatkan file PDF di HP) kepada petugas di meja sirkulasi.', margin + 4, currentY + 9);
  doc.text('2. Wajib membawa Kartu Pelajar / Kartu Anggota Perpustakaan yang masih berlaku saat mengambil fisik buku.', margin + 4, currentY + 13);
  doc.text('3. Batas waktu pengambilan adalah maksimal 2 (dua) hari kerja sejak tanggal rencana pengambilan yang tertera.', margin + 4, currentY + 17);
  doc.text('4. Jaga kebersihan dan keutuhan koleksi buku. Kembalikan buku tepat waktu sebelum masa pinjam berakhir.', margin + 4, currentY + 21);

  currentY += 28;

  // --- AREA TANDA TANGAN (SIGNATURE BLOCK) ---
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const sigY = Math.max(currentY, 230);
  const leftSigX = margin + 25;
  const rightSigX = pageWidth - margin - 45;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Mengetahui,`, leftSigX, sigY, { align: 'center' });
  doc.text(`Pemohon / Siswa`, leftSigX, sigY + 4, { align: 'center' });

  doc.text(`${settings?.institutionName || 'Sekolah'}, ${todayFormatted}`, rightSigX, sigY, { align: 'center' });
  doc.text(`Petugas Perpustakaan,`, rightSigX, sigY + 4, { align: 'center' });

  // Signature line
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);
  doc.line(leftSigX - 22, sigY + 25, leftSigX + 22, sigY + 25);
  doc.line(rightSigX - 26, sigY + 25, rightSigX + 26, sigY + 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(request.requesterName, leftSigX, sigY + 29, { align: 'center' });
  doc.text(settings?.headLibrarian || 'Staf Layanan Sirkulasi', rightSigX, sigY + 29, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIS/NIP: ${request.nisNip}`, leftSigX, sigY + 32.5, { align: 'center' });
  if (settings?.headLibrarianNip) {
    doc.text(`NIP: ${settings.headLibrarianNip}`, rightSigX, sigY + 32.5, { align: 'center' });
  }

  // --- FOOTER DOKUMEN ---
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 284, pageWidth - margin, 284);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen digital ini dibuat otomatis oleh Sistem e-perpus. Berlaku sah sebagai bukti pemesanan buku sementara. Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
    margin,
    288
  );
  doc.text(
    `Halaman 1/1 • ${request.requestCode}`,
    pageWidth - margin,
    288,
    { align: 'right' }
  );

  // Save the PDF
  const cleanCode = (request.requestCode || 'SLIP').replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`Bukti_Pengajuan_${cleanCode}.pdf`);
}
