import React, { useState } from 'react';
import { BookOpen, X, ExternalLink, Bookmark, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import Modal from './Modal';
import { Book } from '../types';

interface EBookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
}

export default function EBookReaderModal({ isOpen, onClose, book }: EBookReaderModalProps) {
  const [zoom, setZoom] = useState(100);

  if (!book) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Perpustakaan Digital: ${book.title}`}>
      <div className="space-y-4">
        {/* Top bar controls */}
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span className="text-white font-medium">{book.author}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{book.publisher} ({book.year})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.max(70, prev - 10))}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-400">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(150, prev + 10))}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Document Container */}
        <div 
          className="bg-slate-950 border border-white/10 rounded-2xl p-6 min-h-[380px] max-h-[500px] overflow-y-auto leading-relaxed transition-all"
          style={{ fontSize: `${(zoom / 100) * 14}px` }}
        >
          {book.ebookUrl ? (
            <iframe
              src={book.ebookUrl}
              className="w-full h-[450px] rounded-xl border-none"
              title={book.title}
            />
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center pb-6 border-b border-white/10">
                <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">Modul Digital E-Perpus</span>
                <h2 className="text-2xl font-bold text-white mt-1">{book.title}</h2>
                <p className="text-xs text-slate-400 mt-2">Koleksi Terdaftar: Register {book.register} • Kategori {book.category}</p>
              </div>

              <div className="space-y-4 text-slate-200">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Sinopsis & Ringkasan Materi</h3>
                <p className="whitespace-pre-wrap text-slate-300">
                  {book.description || 'Deskripsi atau konten digital belum ditambahkan untuk buku ini. Anda dapat melengkapi sinopsis di modul Koleksi Buku (KIB E).'}
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider">Informasi Inventaris Fisik (KIB E)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>Lokasi Rak: <span className="text-white font-medium">{book.shelfLocation || '-'}</span></div>
                  <div>Bahasa: <span className="text-white font-medium">{book.language || 'Indonesia'}</span></div>
                  <div>Jumlah Halaman: <span className="text-white font-medium">{book.pages || '-'} hlm</span></div>
                  <div>Stok Tersedia: <span className="text-emerald-400 font-medium">{book.stock} eksemplar</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold"
          >
            Tutup Pembaca
          </button>
        </div>
      </div>
    </Modal>
  );
}
