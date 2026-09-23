import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'max';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    max: 'max-w-full'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm print:bg-white print:backdrop-blur-none">
      <div className={`bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col max-h-[94vh] sm:max-h-[90vh] text-slate-50 print:border-none print:shadow-none print:bg-white print:text-black`}>
        <div className="flex justify-between items-center px-4 py-3.5 sm:px-5 sm:py-4 border-b border-white/10 print:hidden">
          <h2 className="text-base sm:text-lg font-semibold text-white truncate pr-2">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto mobile-scroll-container">
          {children}
        </div>
      </div>
    </div>
  );
}
