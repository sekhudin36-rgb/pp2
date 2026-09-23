import { useState, useEffect } from 'react';
import { FileText, Download, Target, CalendarDays, Book, Repeat, BookOpen } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [settings, setSettings] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state for reports
  const [reportMonth, setReportMonth] = useState('All');
  const [reportYear, setReportYear] = useState('All');
  
  // Extract unique years from data
  const years = Array.from(new Set([
    ...books.map(b => new Date(b.year ? `${b.year}-01-01` : Date.now()).getFullYear().toString()),
    ...transactions.map(t => new Date(t.borrowDate).getFullYear().toString())
  ])).sort((a,b) => Number(b)-Number(a));

  const months = [
    { value: '0', label: 'Januari' }, { value: '1', label: 'Februari' }, { value: '2', label: 'Maret' },
    { value: '3', label: 'April' }, { value: '4', label: 'Mei' }, { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' }, { value: '7', label: 'Agustus' }, { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' }, { value: '10', label: 'November' }, { value: '11', label: 'Desember' }
  ];

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(res => res.json()),
      fetch('/api/books').then(res => res.json()),
      fetch('/api/transactions').then(res => res.json())
    ]).then(([settingsData, booksData, transactionsData]) => {
      setSettings(settingsData);
      setBooks(booksData);
      setTransactions(transactionsData);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const addHeader = (doc: any, title: string) => {
    if (!settings) return;
    
    // Kop Surat
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(settings.institutionName.toUpperCase(), doc.internal.pageSize.width / 2, 15, { align: 'center' });
    doc.setFontSize(16);
    doc.text(settings.libraryName.toUpperCase(), doc.internal.pageSize.width / 2, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Alamat: ${settings.address} | Telp: ${settings.phone} | Email: ${settings.email}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });
    
    // Garis Kop
    doc.setLineWidth(1);
    doc.line(14, 32, doc.internal.pageSize.width - 14, 32);
    doc.setLineWidth(0.3);
    doc.line(14, 33.5, doc.internal.pageSize.width - 14, 33.5);
    
    // Judul Laporan
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, doc.internal.pageSize.width / 2, 42, { align: 'center' });
  };

  const addSignatures = (doc: any, finalY: number) => {
    if (!settings) return;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Check if new page needed for signature (reserve ~40 units of height)
    if (finalY > pageHeight - 50) {
      doc.addPage();
      finalY = 20;
    }

    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Right side (Kepala Perpus)
    doc.text(`Mengetahui,`, pageWidth - 60, finalY + 15, { align: 'center' });
    doc.text(`Kepala ${settings.libraryName}`, pageWidth - 60, finalY + 20, { align: 'center' });
    doc.setFont("helvetica", "bold");
    doc.text(settings.headLibrarian, pageWidth - 60, finalY + 40, { align: 'center' });
    // Line under name
    const headLibrarianWidth = doc.getTextWidth(settings.headLibrarian);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 60 - (headLibrarianWidth / 2), finalY + 41, pageWidth - 60 + (headLibrarianWidth / 2), finalY + 41);
    
    // Left side (Kepala Sekolah)
    doc.setFont("helvetica", "normal");
    doc.text(`Mengesahkan,`, 60, finalY + 15, { align: 'center' });
    doc.text(`Kepala Sekolah`, 60, finalY + 20, { align: 'center' });
    doc.setFont("helvetica", "bold");
    doc.text(settings.principalName || '_________________', 60, finalY + 40, { align: 'center' });
    // Line under name
    const principalWidth = doc.getTextWidth(settings.principalName || '_________________');
    doc.setLineWidth(0.3);
    doc.line(60 - (principalWidth / 2), finalY + 41, 60 + (principalWidth / 2), finalY + 41);

    // Add Date
    doc.setFont("helvetica", "normal");
    doc.text(today, pageWidth - 14, 10, { align: 'right' }); // at the top right optionally, or above signature
    // doc.text(`Tanggal: ${today}`, pageWidth - 60, finalY + 10, { align: 'center' });
  };

  const handleDownloadOfficialKIBE = () => {
    const doc = new jsPDF('landscape');
    if (settings) {
      // Custom Kop Surat for KIB E
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("KARTU INVENTARIS BARANG (KIB E)", doc.internal.pageSize.width / 2, 12, { align: 'center' });
      doc.setFontSize(12);
      doc.text("ASET TETAP LAINNYA (BUKU PERPUSTAKAAN / KOLEKSI)", doc.internal.pageSize.width / 2, 17, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`PROVINSI / KABUPATEN / KOTA: JAWA BARAT`, 14, 25);
      doc.text(`UNIT / SATUAN KERJA: ${settings.institutionName.toUpperCase()}`, 14, 29);
      doc.text(`KODE LOKASI: 12.03.21.05.01.03`, 14, 33);
      
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`Tanggal Cetak: ${today}`, doc.internal.pageSize.width - 14, 25, { align: 'right' });
    }

    const headRows: any[] = [
      [
        { content: 'No.', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'Nama / Jenis Barang', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'Kode Barang', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'No. Reg', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'Buku / Perpustakaan', colSpan: 2, styles: { halign: 'center', fillColor: [51, 65, 85] } },
        { content: 'Barang Bercorak Seni', colSpan: 3, styles: { halign: 'center', fillColor: [51, 65, 85] } },
        { content: 'Hewan / Tumbuhan', colSpan: 2, styles: { halign: 'center', fillColor: [51, 65, 85] } },
        { content: 'Jumlah', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'Tahun', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'Asal Usul', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'Kondisi', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'Harga (Rp)', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } },
        { content: 'Keterangan', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [51, 65, 85] } }
      ],
      [
        { content: 'Judul / Pencipta', styles: { halign: 'center', fillColor: [71, 85, 105] } },
        { content: 'Spesifikasi', styles: { halign: 'center', fillColor: [71, 85, 105] } },
        { content: 'Asal Daerah', styles: { halign: 'center', fillColor: [71, 85, 105] } },
        { content: 'Pencipta', styles: { halign: 'center', fillColor: [71, 85, 105] } },
        { content: 'Bahan', styles: { halign: 'center', fillColor: [71, 85, 105] } },
        { content: 'Jenis', styles: { halign: 'center', fillColor: [71, 85, 105] } },
        { content: 'Ukuran', styles: { halign: 'center', fillColor: [71, 85, 105] } }
      ],
      [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'
      ]
    ];

    const bodyRows = books.map((b, idx) => [
      idx + 1,
      `Buku ${b.category || 'Perpustakaan'}`,
      b.kodeBarang || '02.06.01.01.01',
      b.register || String(idx+1).padStart(4, '0'),
      `${b.title}\nOleh: ${b.author}`,
      `Penerbit: ${b.publisher || '-'}\nISBN: ${b.isbn || '-'}\nUkuran: ${b.size || '21 cm'}\nBahan: ${b.material || 'Kertas HVS'}\nHalaman: ${b.pages || '-'} hlm`,
      '-',
      '-',
      '-',
      '-',
      '-',
      b.stock,
      b.acquisitionYear || b.year || '-',
      b.source || '-',
      b.condition === 'Baik' ? 'B' : b.condition === 'Kurang Baik' ? 'KB' : 'RB',
      Number(b.price || 0).toLocaleString('id-ID'),
      b.shelfLocation || '-'
    ]);

    autoTable(doc, {
      head: headRows,
      body: bodyRows,
      startY: 37,
      styles: { fontSize: 5.5, cellPadding: 1 },
      headStyles: { textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      theme: 'grid',
      columnStyles: {
        0: { cellWidth: 7 },   // No.
        1: { cellWidth: 18 },  // Nama / Jenis Barang
        2: { cellWidth: 18 },  // Kode Barang
        3: { cellWidth: 12 },  // No. Reg
        4: { cellWidth: 32 },  // Judul / Pencipta
        5: { cellWidth: 38 },  // Spesifikasi
        6: { cellWidth: 10 },  // Asal Daerah
        7: { cellWidth: 10 },  // Pencipta
        8: { cellWidth: 10 },  // Bahan
        9: { cellWidth: 10 },  // Jenis
        10: { cellWidth: 10 }, // Ukuran
        11: { cellWidth: 8 },  // Jumlah
        12: { cellWidth: 10 }, // Tahun
        13: { cellWidth: 16 }, // Asal Usul
        14: { cellWidth: 10 }, // Kondisi
        15: { cellWidth: 16 }, // Harga
        16: { cellWidth: 15 }  // Keterangan
      }
    });

    addSignatures(doc, (doc as any).lastAutoTable.finalY);
    doc.save("Format_Resmi_KIB_E_Perpustakaan.pdf");
  };

  const handleDownloadSemuaBuku = () => {
    const doc = new jsPDF('landscape');
    addHeader(doc, "LAPORAN KESELURUHAN BUKU (KIB E)");
    
    const tableColumn = ["No", "Kode Barang", "Register", "Judul Buku / Nama Barang", "Pengarang / Penerbit", "Thn", "ISBN", "Kategori", "Asal Usul", "Harga (Rp)", "Tersedia", "Terpakai", "Rusak", "Total"];
    const tableRows = books.map((b, idx) => [
      idx + 1,
      b.kodeBarang,
      b.register,
      b.title,
      `${b.author} / ${b.publisher}`,
      b.year,
      b.isbn,
      b.category,
      b.source,
      Number(b.price || 0).toLocaleString('id-ID'),
      b.qtyTersedia !== undefined ? b.qtyTersedia : b.stock,
      b.qtyTerpakai || 0,
      b.qtyRusak || 0,
      b.stock
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    addSignatures(doc, (doc as any).lastAutoTable.finalY);
    doc.save("Laporan_Keseluruhan_Buku.pdf");
  };

  const handleDownloadBukuPembelian = () => {
    const doc = new jsPDF('landscape');
    addHeader(doc, "LAPORAN DATA BUKU MASUK (ASAL USUL: PEMBELIAN / BANTUAN BOS)");
    
    const filteredBooks = books.filter(b => {
      const isPurchase = b.source.toLowerCase().includes('beli') || b.source.toLowerCase().includes('bos');
      if (!isPurchase) return false;
      
      const bYear = b.year || '';
      if (reportYear !== 'All' && String(bYear) !== reportYear) return false;
      return true;
    });

    const tableColumn = ["No", "Kode Barang", "Register", "Judul Buku", "Pengarang", "Kategori", "Asal Usul", "Harga (Rp)", "Stok"];
    const tableRows = filteredBooks.map((b, idx) => [
      idx + 1,
      b.kodeBarang,
      b.register,
      b.title,
      b.author,
      b.category,
      b.source,
      Number(b.price || 0).toLocaleString('id-ID'),
      b.stock
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] }
    });
    
    addSignatures(doc, (doc as any).lastAutoTable.finalY);
    doc.save("Laporan_Buku_Masuk.pdf");
  };

  const handleDownloadPeminjaman = () => {
    const doc = new jsPDF('landscape');
    let title = "LAPORAN DATA PEMINJAMAN BUKU PERPUSTAKAAN";
    if (reportMonth !== 'All' || reportYear !== 'All') {
      title += `\nPERIODE: ${reportMonth !== 'All' ? months.find(m => m.value === reportMonth)?.label : ''} ${reportYear !== 'All' ? reportYear : ''}`.trim();
    }
    addHeader(doc, title);
    
    const filteredTransactions = transactions.filter(t => {
      const tDate = new Date(t.borrowDate);
      if (reportYear !== 'All' && tDate.getFullYear().toString() !== reportYear) return false;
      if (reportMonth !== 'All' && tDate.getMonth().toString() !== reportMonth) return false;
      return true;
    });

    const tableColumn = ["No", "Peminjam", "Judul Buku", "Tgl Pinjam", "Tenggat", "Tgl Kembali", "Status"];
    const tableRows = filteredTransactions.map((t, idx) => {
      let statusText = 'Dipinjam';
      if (t.status === 'returned') statusText = 'Kembali';
      else if (t.status === 'overdue') statusText = 'Terlambat';
      
      return [
        idx + 1,
        t.member?.name || 'Unknown',
        t.book?.title || 'Unknown',
        new Date(t.borrowDate).toLocaleDateString('id-ID'),
        new Date(t.dueDate).toLocaleDateString('id-ID'),
        t.returnDate ? new Date(t.returnDate).toLocaleDateString('id-ID') : '-',
        statusText
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 48,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [245, 158, 11] }
    });
    
    addSignatures(doc, (doc as any).lastAutoTable.finalY);
    doc.save("Laporan_Peminjaman.pdf");
  };

  if (loading) return <div className="p-6 text-slate-400">Memuat data laporan...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 min-h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Cetak Laporan</h1>
          <p className="text-sm text-slate-400 mt-1">Unduh laporan perpustakaan dalam format PDF (A4) yang dilengkapi kop resmi dan tanda tangan.</p>
        </div>
        
        {/* Global Report Filter */}
        <div className="flex flex-col gap-2 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 min-w-[200px]">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5" /> Filter Periode</div>
          <div className="flex gap-2">
            <select 
              value={reportMonth} 
              onChange={e => setReportMonth(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
            >
              <option value="All">Semua Bulan</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select 
              value={reportYear} 
              onChange={e => setReportYear(e.target.value)}
              className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-200"
            >
              <option value="All">Tahun</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* Card 1: Laporan Keseluruhan Buku */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
            <Book className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Keseluruhan Buku</h2>
          <p className="text-sm text-slate-400 mb-6 flex-1">
            Laporan lengkap inventaris KIB E. Berisi semua buku yang terdata di sistem meliputi informasi judul, pengarang, penerbit, nomor register, harga, dan ketersediaan.
          </p>
          <button 
            onClick={handleDownloadSemuaBuku}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Download PDF
          </button>
        </div>

        {/* Card 1B: Format Resmi KIB E */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Format Resmi KIB E</h2>
          <p className="text-sm text-slate-400 mb-6 flex-1">
            Format resmi Laporan Kartu Inventaris Barang (KIB E) Aset Tetap Lainnya sesuai Permendagri dengan tabel rincian multi-level, spesifikasi, dan tanda tangan penanggung jawab.
          </p>
          <button 
            onClick={handleDownloadOfficialKIBE}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Cetak KIB E Resmi
          </button>
        </div>

        {/* Card 2: Laporan Buku Masuk */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Buku Masuk (Pembelian/BOS)</h2>
          <p className="text-sm text-slate-400 mb-6 flex-1">
            Laporan spesifik yang memfilter buku berdasarkan asal usul "Pembelian" atau "Bantuan BOS". Berguna untuk laporan pertanggungjawaban aset sekolah.
          </p>
          <button 
            onClick={handleDownloadBukuPembelian}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Download PDF
          </button>
        </div>

        {/* Card 3: Laporan Peminjaman */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col shadow-sm">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-4">
            <Repeat className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Sirkulasi Peminjaman</h2>
          <p className="text-sm text-slate-400 mb-6 flex-1">
            Mencetak semua rekam jejak aktivitas pinjam-meminjam buku. Mencakup data nama peminjam, buku yang dipinjam, tanggal, dan status sirkulasinya.
          </p>
          <button 
            onClick={handleDownloadPeminjaman}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Download PDF
          </button>
        </div>

      </div>
    </div>
  );
}
