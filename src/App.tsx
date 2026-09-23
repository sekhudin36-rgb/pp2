import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MobileBottomNav from './components/MobileBottomNav';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Catalog from './pages/Catalog';
import Members from './pages/Members';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Visitors from './pages/Visitors';
import Login from './pages/Login';
import Portal from './pages/Portal';
import CommandPalette from './components/CommandPalette';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import AiAssistantModal from './components/AiAssistantModal';
import { ToastProvider } from './components/Toast';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    navigate('/');
  };

  // Keyboard shortcut for Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Public Home Page ("Cari Koleksi Buku & Ajukan Pinjam Online" - Portal OPAC)
  if (location.pathname === '/' || location.pathname === '/portal') {
    return (
      <Portal 
        isAuthenticated={isAuthenticated}
        onBackToApp={() => {
          if (isAuthenticated) {
            navigate('/dashboard');
          } else {
            navigate('/login');
          }
        }}
      />
    );
  }

  // Dedicated Login Page for staff / librarian
  if (location.pathname === '/login') {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <Login 
        onLogin={handleLogin} 
        onOpenPortal={() => navigate('/')} 
      />
    );
  }

  // Guard all admin routes: if not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin} 
        onOpenPortal={() => navigate('/')} 
      />
    );
  }

  // Authenticated Admin Dashboard Layout
  return (
    <div className="h-screen h-[100dvh] w-full bg-slate-950 font-sans flex text-slate-50 relative overflow-hidden">
      {/* Ambient Lighting Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/25 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-[30%] h-[30%] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full h-full flex p-2 sm:p-6 gap-2.5 sm:gap-6">
        <Sidebar 
          onLogout={handleLogout}
          onOpenAi={() => setIsAiOpen(true)}
        />
        <div className="flex-1 flex flex-col gap-3 sm:gap-6 h-full min-w-0">
          <Topbar 
            onOpenSearch={() => setIsCommandPaletteOpen(true)}
            onOpenScan={() => setIsScannerOpen(true)}
            onOpenAi={() => setIsAiOpen(true)}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative rounded-2xl sm:rounded-3xl pb-28 lg:pb-4 pr-1 sm:pr-2 mobile-scroll-container">
            <Routes>
              <Route path="/dashboard" element={<Dashboard onOpenScan={() => setIsScannerOpen(true)} onOpenAi={() => setIsAiOpen(true)} />} />
              <Route path="/visitors" element={<Visitors />} />
              <Route path="/books" element={<Books />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/members" element={<Members />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar with Quick Actions & Menu Drawer */}
      <MobileBottomNav
        onOpenScan={() => setIsScannerOpen(true)}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        onLogout={handleLogout}
      />

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenAi={() => setIsAiOpen(true)}
        onOpenScan={() => setIsScannerOpen(true)}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setIsScannerOpen(false);
          setIsCommandPaletteOpen(true);
        }}
      />

      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}
