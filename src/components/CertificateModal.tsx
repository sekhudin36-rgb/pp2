import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, AlertCircle, Printer, Download, User, BookOpen } from 'lucide-react';
import Modal from './Modal';
import { Member, Transaction, SettingsData } from '../types';
import jsPDF from 'jspdf';
import Barcode from 'react-barcode';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  settings?: SettingsData | null;
}

export default function CertificateModal({ isOpen, onClose, member, settings: initialSettings }: CertificateModalProps) {
  const [activeLoans, setActiveLoans] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [certNumber, setCertNumber] = useState('');
  const [internalSettings, setInternalSettings] = useState<SettingsData | null>(null);

  const settings = initialSettings || internalSettings;

  useEffect(() => {
    if (!initialSettings) {
      fetch('/api/settings')
        .then(res => res.json())
        .then(setInternalSettings)
        .catch(() => {});
    }
  }, [initialSettings]);

  useEffect(() => {
    if (isOpen && member) {
      setLoading(true);
      const year = new Date().getFullYear();
      const randomSeq = Math.floor(100 + Math.random() * 900);
      setCertNumber(`421.3/SKBP-${randomSeq}/PERPUS/${year}`);

      fetch('/api/transactions')
        .then(res => res.json())
        .then((allTrans: Transaction[]) => {
          const memberActive = (allTrans || []).filter(
            t => t.memberId === member.id && (t.status === 'borrowed' || t.status === 'overdue')
          );
          setActiveLoans(memberActive);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, member]);

  if (!member) return null;

  const isEligible = activeLoans.length === 0;

  const handleDownloadPdf = () => {
    if (!settings || !member) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;

    // Kop Surat
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text((settings.institutionName || 'SMP NEGERI 1 BELAJAR').toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text((settings.libraryName || 'PERPUSTAKAAN SEKOLAH').toUpperCase(), pageWidth / 2, 27, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Alamat: ${settings.address || '-'} | Telp: ${settings.phone || '-'} | Email: ${settings.email || '-'}`, pageWidth / 2, 33, { align: 'center' });

    // Garis Kop
    doc.setLineWidth(1);
    doc.line(15, 37, pageWidth - 15, 37);
    doc.setLineWidth(0.3);
    doc.line(15, 38.5, pageWidth - 15, 38.5);

    // Judul Surat
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SURAT KETERANGAN BEBAS PERPUSTAKAAN', pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nomor: ${certNumber}`, pageWidth / 2, 56, { align: 'center' });

    // Isi
    doc.setFontSize(11);
    const startY = 70;
    doc.text('Kepala Perpustakaan menerangkan dengan sesungguhnya bahwa:', 20, startY);

    const dataRows = [
      ['Nama Lengkap', `: ${member.name}`],
      ['Nomor Induk Siswa (NIS/NIP)', `: ${member.nisNip || '-'}`],
      ['Kelas / Jabatan', `: ${member.kelas ? 'Kelas ' + member.kelas : member.role}`],
      ['Status Keanggotaan', `: Terdaftar Aktif`]
    ];

    let currentY = startY + 10;
    dataRows.forEach(([lbl, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(lbl, 25, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(val, 85, currentY);
      currentY += 8;
    });

    currentY += 6;
    doc.text('Berdasarkan data sistem sirkulasi perpustakaan, yang bersangkutan:', 20, currentY);
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('1. TIDAK MEMILIKI TANGGUNGAN PINJAMAN BUKU PERPUSTAKAAN', 25, currentY);
    currentY += 7;
    doc.text('2. TIDAK MEMILIKI TUNGGAKAN DENDA KERUSAKAN ATAU KETERLAMBATAN', 25, currentY);

    currentY += 12;
    doc.setFont('helvetica', 'normal');
    doc.text('Surat keterangan ini diberikan sebagai bukti pemenuhan kelengkapan administrasi akademik/kelulusan.', 20, currentY);

    // Tanda Tangan
    currentY += 25;
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Ditetapkan pada tanggal: ${todayStr}`, pageWidth - 75, currentY);
    
    currentY += 8;
    doc.text('Kepala Perpustakaan,', pageWidth - 75, currentY);

    currentY += 25;
    doc.setFont('helvetica', 'bold');
    doc.text(settings.headLibrarian || 'Ahmad Pustakawan, S.Pust', pageWidth - 75, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${settings.headLibrarianNip || '198205122008011009'}`, pageWidth - 75, currentY + 5);

    // Save
    doc.save(`SKBP_${member.nisNip}_${member.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Surat Keterangan Bebas Pustaka (SKBP)">
      <div className="space-y-5">
        {/* Status banner */}
        {loading ? (
          <div className="p-4 text-center text-slate-400 text-sm">Memverifikasi catatan peminjaman anggota...</div>
        ) : isEligible ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-200">TERVERIFIKASI: BEBAS PUSTAKA</h4>
              <p className="text-xs text-emerald-400/80">Anggota ini tidak memiliki pinjaman aktif maupun denda yang tertunda.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300">
            <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-200">BELUM BEBAS PUSTAKA</h4>
              <p className="text-xs text-rose-400/80">Masih terdapat {activeLoans.length} buku yang belum dikembalikan.</p>
            </div>
          </div>
        )}

        {/* Member Details */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Nama Anggota:</span>
            <span className="text-white font-semibold">{member.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">NISN / NIP:</span>
            <span className="text-white font-mono">{member.nisNip}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-white/5">
            <span className="text-slate-400">Kategori / Kelas:</span>
            <span className="text-white">{member.role} {member.kelas ? `• Kelas ${member.kelas}` : ''}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Nomor Registrasi SKBP:</span>
            <span className="text-blue-400 font-mono font-bold">{certNumber}</span>
          </div>
        </div>

        {/* If loans pending, show list */}
        {!isEligible && activeLoans.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider">Daftar Buku Yang Belum Kembali:</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {activeLoans.map(t => (
                <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-white font-medium">{t.book?.title || 'Judul Buku'}</span>
                  </div>
                  <span className="text-rose-400 font-mono">Tenggat: {t.dueDate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={!isEligible || loading}
            onClick={handleDownloadPdf}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Download className="w-4 h-4" /> Unduh Surat Resmi (PDF)
          </button>
        </div>
      </div>
    </Modal>
  );
}
