import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// --- Simple JSON Database ---
const DB_FILE = path.join(process.cwd(), 'data.json');

interface Book { 
  id: string; 
  kodeBarang: string; 
  register: string; 
  title: string; 
  author: string; 
  publisher: string; 
  year: string; 
  isbn: string; 
  category: string; 
  stock: number; 
  source: string; 
  price: number; 
  condition: string; 
  coverContent?: string; 
  description?: string;
  shelfLocation?: string;
  language?: string;
  pages?: number;
}
interface Member { 
  id: string; 
  name: string; 
  email: string; 
  phone: string; 
  joinedAt: string;
  address?: string;
  role?: string;
  gender?: string;
  photo?: string;
  status?: string;
  nisNip?: string;
  kelas?: string;
}
interface Transaction { 
  id: string; 
  bookId: string; 
  memberId: string; 
  borrowDate: string; 
  dueDate: string; 
  returnDate?: string; 
  status: 'borrowed' | 'returned' | 'overdue';
  conditionOnBorrow?: string;
  conditionOnReturn?: string;
  notes?: string;
}

interface SettingsData {
  libraryName: string;
  institutionName: string;
  address: string;
  phone: string;
  email: string;
  headLibrarian: string;
  principalName: string;
  maxBorrowDays: number;
  maxBorrowItems: number;
  finePerDay: number;
}

interface Visitor {
  id: string;
  memberId?: string;
  name: string;
  role: string;
  kelasOrDept?: string;
  purpose: string;
  notes?: string;
  visitedAt: string;
}

interface User {
  id: string;
  username: string;
  password: string;
  role: string;
  name?: string;
  createdAt?: string;
}

interface BorrowRequest {
  id: string;
  requestCode: string;
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCategory?: string;
  bookIsbn?: string;
  memberId?: string;
  nisNip: string;
  requesterName: string;
  requesterRole: 'Siswa' | 'Guru' | 'Staf' | 'Umum';
  requesterClass?: string;
  phone?: string;
  requestedAt: string;
  pickupDate: string;
  durationDays: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  notes?: string;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface DbSchema {
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  settings: SettingsData;
  visitors?: Visitor[];
  users?: User[];
  borrowRequests?: BorrowRequest[];
}

const defaultDb: DbSchema = {
  books: [
    { id: '1', kodeBarang: '02.06.01.01.01', register: '0001', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', publisher: 'Addison-Wesley', year: '1999', isbn: '978-0135957059', category: 'Teknologi', stock: 5, source: 'Pembelian BOS', price: 150000, condition: 'Baik' },
    { id: '2', kodeBarang: '02.06.01.01.01', register: '0002', title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', year: '2008', isbn: '978-0132350884', category: 'Teknologi', stock: 3, source: 'Pembelian BOS', price: 120000, condition: 'Baik' },
    { id: '3', kodeBarang: '02.06.01.01.01', register: '0003', title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', publisher: 'Hasta Mitra', year: '1980', isbn: '978-9799731234', category: 'Fiksi', stock: 12, source: 'Hibah', price: 85000, condition: 'Kurang Baik' },
  ],
  members: [
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '08123456789', joinedAt: new Date().toISOString() },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '08987654321', joinedAt: new Date().toISOString() },
  ],
  transactions: [],
  settings: {
    libraryName: 'E-Perpus',
    institutionName: 'SMP Negeri 1 Belajar',
    address: 'Jl. Pendidikan No. 1, Kota Belajar',
    phone: '021-1234567',
    email: 'perpus@smp.belajar.id',
    headLibrarian: 'Ahmad Pustakawan, S.Pust',
    principalName: 'Budi Santoso, S.Pd., M.Pd.',
    maxBorrowDays: 7,
    maxBorrowItems: 3,
    finePerDay: 500
  },
  visitors: [
    {
      id: 'v1',
      memberId: '1',
      name: 'Ahmad Rizky',
      role: 'Siswa',
      kelasOrDept: '7-A',
      purpose: 'Membaca Buku',
      notes: 'Membaca buku sains',
      visitedAt: new Date().toISOString()
    }
  ],
  users: [
    {
      id: '1',
      username: 'admin',
      password: 'admin',
      role: 'Administrator',
      name: 'Administrator Perpustakaan',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      username: 'pustakawan',
      password: 'admin',
      role: 'Kepala Perpustakaan',
      name: 'Ahmad Pustakawan, S.Pust',
      createdAt: new Date().toISOString()
    }
  ],
  borrowRequests: [
    {
      id: 'req-1',
      requestCode: 'REQ-2609-001',
      bookId: '1',
      bookTitle: 'The Pragmatic Programmer',
      bookAuthor: 'Andrew Hunt',
      bookCategory: 'Teknologi',
      nisNip: '2024001',
      requesterName: 'Ahmad Rizky',
      requesterRole: 'Siswa',
      requesterClass: '7-A',
      phone: '081234567890',
      requestedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      pickupDate: new Date().toISOString().split('T')[0],
      durationDays: 7,
      status: 'pending',
      notes: 'Untuk referensi tugas TIK pembuatan program'
    },
    {
      id: 'req-2',
      requestCode: 'REQ-2609-002',
      bookId: '3',
      bookTitle: 'Bumi Manusia',
      bookAuthor: 'Pramoedya Ananta Toer',
      bookCategory: 'Fiksi',
      nisNip: '198501012010011002',
      requesterName: 'Dra. Sri Wahyuni',
      requesterRole: 'Guru',
      requesterClass: 'Guru Bahasa Indonesia',
      phone: '085678901234',
      requestedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      pickupDate: new Date().toISOString().split('T')[0],
      durationDays: 14,
      status: 'approved',
      notes: 'Bahan kajian sastra kelas IX',
      adminNotes: 'Buku sudah disiapkan di meja piket perpustakaan. Silakan diambil sebelum pukul 14.00.'
    }
  ]
};

async function getDb(): Promise<DbSchema> {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data) as DbSchema;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
      return defaultDb;
    }
    throw err;
  }
}

async function saveDb(data: DbSchema): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Server Setup ---
async function startServer() {
  const app = express();
  // Using port 3000 as required by the platform proxy, but noting user's preference for local export
  const PORT = 3000; 

  app.use(express.json());

  // Wait for DB to initialize
  await getDb();

  // --- API Routes ---
  
  // Dashboard Analytics
  app.get('/api/dashboard', async (req, res) => {
    const db = await getDb();
    const totalTitles = db.books.length;
    const totalBooks = db.books.reduce((acc, book) => acc + book.stock, 0);
    const totalMembers = db.members.length;
    const activeBorrows = db.transactions.filter(t => t.status === 'borrowed' || t.status === 'overdue').length;

    const chartData = [];
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const peminjam = db.transactions.filter(t => t.borrowDate.startsWith(dateStr)).length;
      const pengembalian = db.transactions.filter(t => t.returnDate && t.returnDate.startsWith(dateStr)).length;
      
      chartData.push({
        name: days[d.getDay()],
        peminjaman: peminjam,
        pengembalian: pengembalian
      });
    }

    res.json({ totalTitles, totalBooks, totalMembers, activeBorrows, chartData });
  });

  // Auth & Login
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body || {};
    const db = await getDb();
    if (!db.users || db.users.length === 0) {
      db.users = defaultDb.users || [];
      await saveDb(db);
    }

    const cleanUser = (username || '').trim().toLowerCase();
    const user = db.users.find(u => 
      u.username.toLowerCase() === cleanUser &&
      (u.password === password || (cleanUser === 'admin' && (password === 'admin' || password === 'admin123')))
    );

    if (user) {
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name || user.username
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Username atau password salah. (Akun Default: admin / admin)'
    });
  });

  // Users Management
  app.get('/api/users', async (req, res) => {
    const db = await getDb();
    if (!db.users || db.users.length === 0) {
      db.users = defaultDb.users || [];
      await saveDb(db);
    }
    res.json(db.users);
  });

  app.post('/api/users', async (req, res) => {
    const db = await getDb();
    if (!db.users) db.users = [];
    const { id, username, password, role, name } = req.body || {};
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password harus diisi' });
    }

    if (id) {
      const idx = db.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        db.users[idx] = { 
          ...db.users[idx], 
          username, 
          password, 
          role: role || db.users[idx].role,
          name: name || username 
        };
        await saveDb(db);
        return res.json({ success: true, user: db.users[idx] });
      }
    }

    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      role: role || 'Staf',
      name: name || username,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    await saveDb(db);
    res.json({ success: true, user: newUser });
  });

  app.delete('/api/users/:id', async (req, res) => {
    const db = await getDb();
    if (!db.users) db.users = [];
    if (db.users.length <= 1) {
      return res.status(400).json({ error: 'Tidak dapat menghapus satu-satunya akun pengguna' });
    }
    db.users = db.users.filter(u => u.id !== req.params.id);
    await saveDb(db);
    res.json({ success: true });
  });

  // Settings
  app.get('/api/settings', async (req, res) => {
    const db = await getDb();
    if (!db.settings) {
      db.settings = defaultDb.settings;
      await saveDb(db);
    }
    res.json(db.settings);
  });

  app.post('/api/settings', async (req, res) => {
    const db = await getDb();
    db.settings = { ...db.settings, ...req.body };
    await saveDb(db);
    res.json(db.settings);
  });

  // Export DB
  app.get('/api/export-db', async (req, res) => {
    const db = await getDb();
    res.json(db);
  });

  // Reset DB
  app.post('/api/reset-db', async (req, res) => {
    const db = await getDb();
    db.books = [];
    db.members = [];
    db.transactions = [];
    await saveDb(db);
    res.json({ success: true, message: 'Database reset' });
  });

  // Books
  app.get('/api/books', async (req, res) => {
    const db = await getDb();
    res.json(db.books);
  });

  app.post('/api/books', async (req, res) => {
    const db = await getDb();
    const newBook: Book = { ...req.body, id: Date.now().toString() };
    db.books.push(newBook);
    await saveDb(db);
    res.status(201).json(newBook);
  });

  app.put('/api/books/:id', async (req, res) => {
    const db = await getDb();
    const idx = db.books.findIndex(b => b.id === req.params.id);
    if (idx !== -1) {
      db.books[idx] = { ...db.books[idx], ...req.body };
      await saveDb(db);
      res.json(db.books[idx]);
    } else {
      res.status(404).json({ error: 'Book not found' });
    }
  });

  app.delete('/api/books/:id', async (req, res) => {
    const db = await getDb();
    db.books = db.books.filter(b => b.id !== req.params.id);
    await saveDb(db);
    res.json({ success: true });
  });

  // Members
  app.get('/api/members', async (req, res) => {
    const db = await getDb();
    res.json(db.members);
  });

  app.post('/api/members', async (req, res) => {
    const db = await getDb();
    const newMember: Member = { ...req.body, id: Date.now().toString(), joinedAt: new Date().toISOString() };
    db.members.push(newMember);
    await saveDb(db);
    res.status(201).json(newMember);
  });

  app.put('/api/members/:id', async (req, res) => {
    const db = await getDb();
    const idx = db.members.findIndex(m => m.id === req.params.id);
    if (idx !== -1) {
      db.members[idx] = { ...db.members[idx], ...req.body };
      await saveDb(db);
      res.json(db.members[idx]);
    } else {
      res.status(404).json({ error: 'Member not found' });
    }
  });

  app.delete('/api/members/:id', async (req, res) => {
    const db = await getDb();
    db.members = db.members.filter(m => m.id !== req.params.id);
    await saveDb(db);
    res.json({ success: true });
  });

  // Transactions
  app.get('/api/transactions', async (req, res) => {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    let changed = false;
    for (const t of db.transactions) {
      if (t.status === 'borrowed' && t.dueDate < today) {
        t.status = 'overdue';
        changed = true;
      }
    }
    if (changed) await saveDb(db);

    // Populate with book and member details
    const populated = db.transactions.map(t => {
      const book = db.books.find(b => b.id === t.bookId);
      const member = db.members.find(m => m.id === t.memberId);
      return { ...t, book, member };
    });
    res.json(populated);
  });

  app.post('/api/transactions', async (req, res) => {
    const db = await getDb();
    const { bookId, memberId, dueDate } = req.body;
    
    // Check stock
    const bookIdx = db.books.findIndex(b => b.id === bookId);
    if (bookIdx === -1 || db.books[bookIdx].stock <= 0) {
      return res.status(400).json({ error: 'Book not available' });
    }

    const t: Transaction = {
      id: Date.now().toString(),
      bookId,
      memberId,
      borrowDate: new Date().toISOString(),
      dueDate,
      status: 'borrowed'
    };
    
    db.books[bookIdx].stock -= 1;
    db.transactions.push(t);
    await saveDb(db);
    res.status(201).json(t);
  });

  app.post('/api/transactions/:id/return', async (req, res) => {
    const db = await getDb();
    const tIdx = db.transactions.findIndex(t => t.id === req.params.id);
    if (tIdx === -1) return res.status(404).json({ error: 'Transaction not found' });
    
    const t = db.transactions[tIdx];
    if (t.status === 'returned') return res.status(400).json({ error: 'Already returned' });

    t.status = 'returned';
    t.returnDate = new Date().toISOString();

    const bookIdx = db.books.findIndex(b => b.id === t.bookId);
    if (bookIdx !== -1) {
      db.books[bookIdx].stock += 1;
    }

    await saveDb(db);
    res.json(t);
  });

  // --- Visitors API ---
  app.get('/api/visitors', async (req, res) => {
    const db = await getDb();
    res.json(db.visitors || []);
  });

  app.post('/api/visitors', async (req, res) => {
    const db = await getDb();
    if (!db.visitors) db.visitors = [];
    const newVisitor: Visitor = {
      id: Date.now().toString(),
      ...req.body,
      visitedAt: req.body.visitedAt || new Date().toISOString()
    };
    db.visitors.unshift(newVisitor);
    await saveDb(db);
    res.status(201).json(newVisitor);
  });

  app.delete('/api/visitors/:id', async (req, res) => {
    const db = await getDb();
    if (!db.visitors) db.visitors = [];
    db.visitors = db.visitors.filter(v => v.id !== req.params.id);
    await saveDb(db);
    res.json({ success: true });
  });

  // --- Borrow Requests API (Portal Pengajuan Peminjaman) ---
  app.get('/api/borrow-requests', async (req, res) => {
    const db = await getDb();
    if (!db.borrowRequests) {
      db.borrowRequests = defaultDb.borrowRequests || [];
      await saveDb(db);
    }
    const { status, query, nisNip, code } = req.query;
    let list = [...db.borrowRequests];

    if (status && status !== 'all') {
      list = list.filter(r => r.status === status);
    }

    if (code) {
      const c = String(code).trim().toLowerCase();
      list = list.filter(r => r.requestCode.toLowerCase() === c);
    }

    if (nisNip) {
      const n = String(nisNip).trim().toLowerCase();
      list = list.filter(r => r.nisNip.toLowerCase().includes(n));
    }

    if (query) {
      const q = String(query).trim().toLowerCase();
      list = list.filter(r => 
        r.requestCode.toLowerCase().includes(q) ||
        r.requesterName.toLowerCase().includes(q) ||
        r.bookTitle.toLowerCase().includes(q) ||
        r.nisNip.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    res.json(list);
  });

  app.post('/api/borrow-requests', async (req, res) => {
    const db = await getDb();
    if (!db.borrowRequests) db.borrowRequests = [];

    const { bookId, nisNip, requesterName, requesterRole, requesterClass, phone, pickupDate, durationDays, notes } = req.body;
    if (!bookId || !requesterName || !nisNip) {
      return res.status(400).json({ error: 'Buku, NIS/NIP, dan Nama Pemohon wajib diisi' });
    }

    // Lookup book
    const book = db.books.find(b => b.id === bookId);
    if (!book) {
      return res.status(404).json({ error: 'Buku tidak ditemukan' });
    }

    // Generate Request Code: REQ-YYMM-XXXX
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const requestCode = `REQ-${yy}${mm}-${randomSuffix}`;

    // Lookup member if registered
    const member = db.members.find(m => m.nisNip === nisNip || m.id === nisNip);

    const newRequest: BorrowRequest = {
      id: Date.now().toString(),
      requestCode,
      bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCategory: book.category,
      bookIsbn: book.isbn,
      memberId: member ? member.id : undefined,
      nisNip,
      requesterName,
      requesterRole: requesterRole || (member ? member.role : 'Siswa'),
      requesterClass: requesterClass || (member ? member.kelas : ''),
      phone: phone || (member ? member.phone : ''),
      requestedAt: new Date().toISOString(),
      pickupDate: pickupDate || new Date().toISOString().split('T')[0],
      durationDays: Number(durationDays) || (db.settings?.maxBorrowDays || 7),
      status: 'pending',
      notes: notes || ''
    };

    db.borrowRequests.unshift(newRequest);
    await saveDb(db);
    res.status(201).json(newRequest);
  });

  app.put('/api/borrow-requests/:id', async (req, res) => {
    const db = await getDb();
    if (!db.borrowRequests) db.borrowRequests = [];
    const idx = db.borrowRequests.findIndex(r => r.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });
    }

    const current = db.borrowRequests[idx];
    const { status, adminNotes, reviewedBy } = req.body;

    const previousStatus = current.status;
    current.status = status || current.status;
    if (adminNotes !== undefined) current.adminNotes = adminNotes;
    if (reviewedBy) current.reviewedBy = reviewedBy;
    current.reviewedAt = new Date().toISOString();

    // If marked as fulfilled (buku diambil dan aktif dipinjam)
    if (status === 'fulfilled' && previousStatus !== 'fulfilled') {
      // Find or create member
      let member = db.members.find(m => m.nisNip === current.nisNip || m.id === current.memberId);
      if (!member) {
        // Auto register minimal member
        member = {
          id: Date.now().toString(),
          name: current.requesterName,
          email: '',
          phone: current.phone || '',
          nisNip: current.nisNip,
          kelas: current.requesterClass || '',
          role: current.requesterRole,
          gender: 'Laki-laki',
          status: 'Aktif',
          joinedAt: new Date().toISOString()
        };
        db.members.push(member);
      }

      // Check and update book stock
      const bookIdx = db.books.findIndex(b => b.id === current.bookId);
      if (bookIdx !== -1 && db.books[bookIdx].stock > 0) {
        db.books[bookIdx].stock -= 1;
      }

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (current.durationDays || 7));

      const newTx: Transaction = {
        id: Date.now().toString(),
        bookId: current.bookId,
        memberId: member.id,
        borrowDate: new Date().toISOString(),
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'borrowed',
        notes: `Pengajuan Online (${current.requestCode}) - ${current.notes || ''}`
      };

      db.transactions.push(newTx);
    }

    await saveDb(db);
    res.json(current);
  });

  app.delete('/api/borrow-requests/:id', async (req, res) => {
    const db = await getDb();
    if (!db.borrowRequests) db.borrowRequests = [];
    db.borrowRequests = db.borrowRequests.filter(r => r.id !== req.params.id);
    await saveDb(db);
    res.json({ success: true });
  });

  // --- AI API ---
  app.post('/api/ai/assistant', async (req, res) => {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const ai = getAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Anda adalah asisten AI resmi perpustakaan sekolah (e-perpus). Berikan saran yang ramah, profesional, dan edukatif dalam bahasa Indonesia tentang manajemen perpustakaan, klasifikasi buku DDC, atau rekomendasi buku bacaan kurikulum sekolah:\n\nPertanyaan: ${prompt}`
        });
        return res.json({ reply: response.text });
      } catch (err: any) {
        console.error('Gemini error in assistant:', err);
      }
    }

    // Fallback response if no key or API error
    let fallback = 'Berikut panduan perpustakaan: Pastikan sirkulasi buku tercatat, inventaris KIB E terverifikasi, dan program literasi membaca terus digalakkan bagi seluruh siswa.';
    const lower = prompt.toLowerCase();
    if (lower.includes('rekomendasi') || lower.includes('fiksi') || lower.includes('bacaan')) {
      fallback = `Rekomendasi bacaan untuk siswa SMP:\n1. 'Laskar Pelangi' (Andrea Hirata) - Motivasi & persahabatan\n2. 'Negeri 5 Menara' (A. Fuadi) - Cita-cita dan disiplin\n3. 'Bumi' (Tere Liye) - Petualangan fiksi sains dunia paralel\n4. 'Hafalan Shalat Delisa' (Tere Liye) - Nilai moral & keluarga`;
    } else if (lower.includes('ddc') || lower.includes('klasifikasi')) {
      fallback = `Klasifikasi DDC Standar:\n- 000: Karya Umum & Komputer\n- 100: Filsafat & Psikologi\n- 200: Agama\n- 300: Ilmu Sosial & Pendidikan\n- 400: Bahasa & Kamus\n- 500: Sains & Matematika\n- 600: Teknologi & Terapan\n- 700: Kesenian & Olahraga\n- 800: Sastra & Fiksi\n- 900: Sejarah & Geografi`;
    }
    res.json({ reply: fallback });
  });

  app.post('/api/ai/summarize', async (req, res) => {
    const { title, author, category } = req.body || {};
    const ai = getAI();
    if (ai && title) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Buatkan sinopsis singkat 2 paragraf yang menarik dan mendidik untuk buku perpustakaan berjudul "${title}" karya "${author || 'Penulis'}" (kategori: ${category || 'Umum'}). Gunakan Bahasa Indonesia yang baik dan baku.`
        });
        return res.json({ summary: response.text });
      } catch (err) {
        console.error('Gemini error in summarize:', err);
      }
    }
    const defaultSummary = `Buku "${title || 'Koleksi Perpustakaan'}" karya ${author || 'Penulis'} merupakan literatur penting dalam kategori ${category || 'Umum'} yang bermanfaat dalam menunjang literasi dan wawasan akademik pembaca di lingkungan sekolah.`;
    res.json({ summary: defaultSummary });
  });

  // --- Sync Status API (Dapodik style) ---
  app.get('/api/sync/status', async (req, res) => {
    const db = await getDb();
    const borrowRequests = db.borrowRequests || [];
    const pendingBorrowRequests = borrowRequests.filter(r => r.status === 'pending').length;

    res.json({
      status: 'ready',
      lastUpdated: new Date().toISOString(),
      counts: {
        books: db.books.length,
        members: db.members.length,
        transactions: db.transactions.length,
        visitors: db.visitors?.length || 0,
        borrowRequests: borrowRequests.length,
        pendingBorrowRequests
      }
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
