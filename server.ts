import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs/promises';
import path from 'path';

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

interface DbSchema {
  books: Book[];
  members: Member[];
  transactions: Transaction[];
  settings: SettingsData;
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
  }
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
