import React, { useState, useEffect, useRef } from 'react';
import { Camera, Scan, X, AlertCircle, RefreshCw, Check } from 'lucide-react';
import Modal from './Modal';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  promptText?: string;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode / QR Code',
  promptText = 'Arahkan barcode buku atau kartu anggota ke kamera'
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setManualCode('');
      setCameraError('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Kamera tidak didukung oleh browser Anda. Gunakan input manual atau barcode scanner USB.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Izin akses kamera belum diberikan atau kamera sedang digunakan aplikasi lain. Anda tetap dapat memasukkan kode secara manual atau menggunakan scanner USB.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-xs text-slate-400">{promptText}</p>

        {/* Video stream container with scanner reticle */}
        <div className="relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* Animated Scanner Laser Overlay */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-32 border-2 border-blue-400/80 rounded-xl relative shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5"></div>
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse absolute top-1/2"></div>
                </div>
                <span className="text-[10px] text-blue-300 font-mono tracking-wider mt-2 bg-slate-900/80 px-2 py-0.5 rounded-full border border-blue-500/20">
                  SCANNER OPTIK AKTIF
                </span>
              </div>
            </>
          ) : (
            <div className="p-4 text-center">
              <Camera className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-slate-400 max-w-xs">{cameraError || 'Menghubungkan ke kamera...'}</p>
              {cameraError && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Coba Sambungkan Lagi
                </button>
              )}
            </div>
          )}
        </div>

        {/* Manual Barcode / USB Scanner Gun Input */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Scan className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Ketik kode / scan dengan barcode scanner USB..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
            >
              <Check className="w-4 h-4" /> Pilih
            </button>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            Mendukung pemindai Barcode Gun USB, input nomor Register KIB E, NISN siswa, atau kode ISBN.
          </p>
        </form>
      </div>
    </Modal>
  );
}
