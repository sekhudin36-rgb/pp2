import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, BookOpen, Lightbulb, RefreshCw, X } from 'lucide-react';
import Modal from './Modal';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function AiAssistantModal({ isOpen, onClose }: AiAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Halo! Saya Asisten AI Perpustakaan. Saya dapat membantu merekomendasikan buku bacaan, menyusun rencana literasi sekolah, klasifikasi kode DDC, hingga membuat ringkasan dan sinopsis buku. Ada yang bisa saya bantu?',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Rekomendasi buku fiksi inspiratif untuk siswa SMP',
    'Klasifikasi DDC untuk buku kurikulum merdeka',
    'Tips meningkatkan minat baca siswa di perpustakaan',
    'Ide program literasi sekolah 15 menit sebelum KBM'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });
      const data = await res.json();
      
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'Maaf, belum dapat menghasilkan respon saat ini. Coba pertanyaan lainnya.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      // Local smart fallback
      const fallbackReplies: Record<string, string> = {
        default: `Berikut rekomendasi dan catatan dari AI Perpustakaan:\n1. **Kategori Fiksi Inspiratif**: 'Laskar Pelangi' karya Andrea Hirata, 'Negeri 5 Menara' karya A. Fuadi, dan 'Bumi Manusia' karya Pramoedya Ananta Toer.\n2. **Kategori Kurikulum Merdeka**: Buku Paket Bahasa Indonesia & Matematika Kelas VII Pusat Perbukuan.\n3. **Klasifikasi DDC**: 000 (Karya Umum), 300 (Ilmu Sosial), 500 (Sains Alam), 800 (Sastra & Fiksi).`
      };

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallbackReplies.default,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiReply]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asisten Pintar Pustakawan AI">
      <div className="flex flex-col h-[520px] max-h-[75vh]">
        {/* Chips Quick prompts */}
        <div className="flex gap-2 overflow-x-auto pb-3 pt-1 text-xs border-b border-white/5 scrollbar-none">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 shrink-0 text-left transition-all flex items-center gap-1.5"
            >
              <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Chat message bubbles */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/20'
                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-500'}`}>
                  {msg.timestamp}
                </div>
              </div>
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs py-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-2xl border border-white/10">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>Asisten AI sedang menyusun tanggapan...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-3 border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Tanyakan hal tentang perpustakaan, literasi, atau koleksi..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" /> Kirim
          </button>
        </form>
      </div>
    </Modal>
  );
}
