const originalFetch = window.fetch;

const defaultDb = {
  books: [
    { id: '1', kodeBarang: '02.06.01.01.01', register: '0001', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', publisher: 'Addison-Wesley', year: '1999', isbn: '978-0135957059', category: 'Teknologi', stock: 5, source: 'Pembelian BOS', price: 150000, condition: 'Baik', status: 'Tersedia', description: 'Buku panduan bagi para pemrogram profesional.', shelfLocation: 'RAK 3A', language: 'Inggris', pages: 352, size: '23 cm', material: 'Kertas HVS', acquisitionYear: '2020' },
    { id: '2', kodeBarang: '02.06.01.01.01', register: '0002', title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', year: '2008', isbn: '978-0132350884', category: 'Teknologi', stock: 3, source: 'Pembelian BOS', price: 120000, condition: 'Baik', status: 'Terpakai', description: 'Panduan tata tulis kode yang bersih dan rapi.', shelfLocation: 'RAK 3A', language: 'Inggris', pages: 464, size: '23 cm', material: 'Kertas HVS', acquisitionYear: '2020' },
    { id: '3', kodeBarang: '02.06.01.01.01', register: '0003', title: 'Bumi Manusia', author: 'Pramoedya Ananta Toer', publisher: 'Hasta Mitra', year: '1980', isbn: '978-9799731234', category: 'Fiksi', stock: 12, source: 'Hibah', price: 85000, condition: 'Kurang Baik', status: 'Tersedia', description: 'Karya sastra legendaris Pramoedya Ananta Toer yang menceritakan perjuangan Minke.', shelfLocation: 'RAK 2A', language: 'Indonesia', pages: 535, size: '20 cm', material: 'Kertas Novel', acquisitionYear: '2018' },
    { id: '4', kodeBarang: '02.06.01.01.01', register: '0004', title: 'Buku Paket Bahasa Indonesia Kelas VII', author: 'Kemendikbud', publisher: 'Pusat Perbukuan', year: '2021', isbn: '978-602-244-307-0', category: 'Buku Paket', stock: 40, source: 'Dana BOS', price: 45000, condition: 'Baik', status: 'Tersedia', description: 'Buku pelajaran Bahasa Indonesia Kurikulum Merdeka untuk SMP Kelas 7.', shelfLocation: 'RAK 1A', language: 'Indonesia', pages: 230, size: '25 cm', material: 'Kertas HVS', acquisitionYear: '2021' },
    { id: '5', kodeBarang: '02.06.01.01.01', register: '0005', title: 'Buku Paket Matematika Kelas VII', author: 'Kemendikbud', publisher: 'Pusat Perbukuan', year: '2021', isbn: '978-602-244-515-9', category: 'Buku Paket', stock: 40, source: 'Dana BOS', price: 52000, condition: 'Baik', status: 'Terpakai', description: 'Buku pelajaran Matematika Kurikulum Merdeka untuk SMP Kelas 7.', shelfLocation: 'RAK 1B', language: 'Indonesia', pages: 280, size: '25 cm', material: 'Kertas HVS', acquisitionYear: '2021' },
    { id: '6', kodeBarang: '02.06.01.01.01', register: '0006', title: 'Buku Paket Ilmu Pengetahuan Alam (IPA) Kelas VII', author: 'Kemendikbud', publisher: 'Pusat Perbukuan', year: '2021', isbn: '978-602-244-384-1', category: 'Buku Paket', stock: 40, source: 'Dana BOS', price: 48000, condition: 'Baik', status: 'Tersedia', description: 'Buku pelajaran Ilmu Pengetahuan Alam Kurikulum Merdeka untuk SMP Kelas 7.', shelfLocation: 'RAK 1C', language: 'Indonesia', pages: 250, size: '25 cm', material: 'Kertas HVS', acquisitionYear: '2021' },
    { id: '7', kodeBarang: '02.06.01.01.01', register: '0007', title: 'Kamus Besar Bahasa Indonesia (KBBI) Edisi V', author: 'Badan Pengembangan Bahasa', publisher: 'Balai Pustaka', year: '2016', isbn: '978-602-263-104-1', category: 'Referensi', stock: 5, source: 'Pembelian', price: 350000, condition: 'Baik', status: 'Tersedia', description: 'Edisi terbaru kamus resmi ekabahasa bahasa Indonesia.', shelfLocation: 'RAK Ref-1', language: 'Indonesia', pages: 2046, size: '26 cm', material: 'Kertas HVS Lux', acquisitionYear: '2017' },
    { id: '8', kodeBarang: '02.06.01.01.01', register: '0008', title: 'Atlas Lengkap Indonesia & Dunia', author: 'Drs. Sadiman', publisher: 'Karya Pembina Swajaya', year: '2019', isbn: '978-979-111-203-0', category: 'Referensi', stock: 8, source: 'Hibah', price: 65000, condition: 'Baik', status: 'Rusak', description: 'Atlas peta geografi lengkap wilayah Indonesia dan seluruh dunia.', shelfLocation: 'RAK Ref-2', language: 'Indonesia', pages: 120, size: '28 cm', material: 'Kertas Art Paper', acquisitionYear: '2019' },
    { id: '9', kodeBarang: '02.06.01.01.01', register: '0009', title: 'Laskar Pelangi', author: 'Andrea Hirata', publisher: 'Bentang Pustaka', year: '2005', isbn: '978-979-306-279-2', category: 'Fiksi', stock: 15, source: 'Pembelian', price: 79000, condition: 'Baik', status: 'Tersedia', description: 'Novel fiksi inspiratif mengenai kisah perjuangan anak-anak Belitong.', shelfLocation: 'RAK 2A', language: 'Indonesia', pages: 529, size: '20 cm', material: 'Kertas Novel', acquisitionYear: '2015' },
    { id: '10', kodeBarang: '02.06.01.01.01', register: '0010', title: 'Negeri 5 Menara', author: 'A. Fuadi', publisher: 'Gramedia Pustaka Utama', year: '2009', isbn: '978-979-224-845-6', category: 'Fiksi', stock: 10, source: 'Sumbangan', price: 85000, condition: 'Baik', status: 'Tersedia', description: 'Kisah persahabatan santri pondok pesantren Madani.', shelfLocation: 'RAK 2A', language: 'Indonesia', pages: 424, size: '20 cm', material: 'Kertas Novel', acquisitionYear: '2016' },
    { id: '11', kodeBarang: '02.06.01.01.01', register: '0011', title: 'Sang Pemimpi', author: 'Andrea Hirata', publisher: 'Bentang Pustaka', year: '2006', isbn: '978-979-122-701-8', category: 'Fiksi', stock: 12, source: 'Pembelian', price: 69000, condition: 'Baik', status: 'Tersedia', description: 'Sekuel kedua dari Tetralogi Laskar Pelangi.', shelfLocation: 'RAK 2A', language: 'Indonesia', pages: 292, size: '20 cm', material: 'Kertas Novel', acquisitionYear: '2015' },
    { id: '12', kodeBarang: '02.06.01.01.01', register: '0012', title: 'Biografi Ki Hajar Dewantara', author: 'Irna H.N. Hadi Soewito', publisher: 'Direktorat Jenderal Kebudayaan', year: '2019', isbn: '978-602-124-301-4', category: 'Biografi', stock: 6, source: 'Hibah', price: 55000, condition: 'Baik', status: 'Tersedia', description: 'Buku biografi bapak pendidikan nasional Indonesia, Ki Hajar Dewantara.', shelfLocation: 'RAK 2B', language: 'Indonesia', pages: 180, size: '21 cm', material: 'Kertas HVS', acquisitionYear: '2020' },
    { id: '13', kodeBarang: '02.06.01.01.01', register: '0013', title: 'Ensiklopedia Sains dan Teknologi', author: 'Dorling Kindersley', publisher: 'Lentera Abadi', year: '2012', isbn: '978-979-353-503-6', category: 'Referensi', stock: 4, source: 'Dana BOS', price: 450000, condition: 'Baik', status: 'Tersedia', description: 'Ensiklopedia ilmu pengetahuan alam lengkap disertai ilustrasi visual menarik.', shelfLocation: 'RAK Ref-1', language: 'Indonesia', pages: 640, size: '29 cm', material: 'Kertas Art Paper Premium', acquisitionYear: '2018' },
    { id: '14', kodeBarang: '02.06.01.01.01', register: '0014', title: 'Habis Gelap Terbitlah Terang', author: 'R.A. Kartini', publisher: 'Balai Pustaka', year: '1911', isbn: '978-979-407-203-5', category: 'Sejarah', stock: 7, source: 'Sumbangan Alumni', price: 60000, condition: 'Baik', status: 'Rusak', description: 'Kumpulan surat-surat bersejarah dari Raden Ajeng Kartini mengenai emansipasi wanita.', shelfLocation: 'RAK 2C', language: 'Indonesia', pages: 264, size: '21 cm', material: 'Kertas Buram Kuno', acquisitionYear: '2012' }
  ],
  members: [
    { id: '1', name: 'Muhammad Faiz', email: 'faiz.siswa@smp.belajar.id', phone: '08123456701', role: 'Siswa', gender: 'Laki-laki', nisNip: '102030', kelas: '7-A', joinedAt: new Date(Date.now() - 30*24*60*60*1000).toISOString() },
    { id: '2', name: 'Aisyah Putri', email: 'aisyah.siswa@smp.belajar.id', phone: '08123456702', role: 'Siswa', gender: 'Perempuan', nisNip: '102031', kelas: '7-A', joinedAt: new Date(Date.now() - 25*24*60*60*1000).toISOString() },
    { id: '3', name: 'Bambang Wijaya, S.Pd.', email: 'bambang.guru@smp.belajar.id', phone: '08123456703', role: 'Guru', gender: 'Laki-laki', nisNip: '197508212003121002', kelas: '', joinedAt: new Date(Date.now() - 60*24*60*60*1000).toISOString() },
    { id: '4', name: 'Siti Rahma', email: 'siti.siswa@smp.belajar.id', phone: '08123456704', role: 'Siswa', gender: 'Perempuan', nisNip: '102032', kelas: '7-B', joinedAt: new Date(Date.now() - 15*24*60*60*1000).toISOString() },
    { id: '5', name: 'Rian Hidayat', email: 'rian.siswa@smp.belajar.id', phone: '08123456705', role: 'Siswa', gender: 'Laki-laki', nisNip: '102033', kelas: '8-A', joinedAt: new Date(Date.now() - 5*24*60*60*1000).toISOString() }
  ],
  transactions: [
    {
      id: 't1',
      bookId: '9',
      memberId: '1',
      borrowDate: new Date(Date.now() - 4*24*60*60*1000).toISOString(),
      dueDate: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
      status: 'returned',
      returnDate: new Date().toISOString()
    },
    {
      id: 't2',
      bookId: '5',
      memberId: '2',
      borrowDate: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
      dueDate: new Date(Date.now() + 4*24*60*60*1000).toISOString().split('T')[0],
      status: 'borrowed'
    },
    {
      id: 't3',
      bookId: '7',
      memberId: '3',
      borrowDate: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
      dueDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
      status: 'borrowed'
    },
    {
      id: 't4',
      bookId: '3',
      memberId: '4',
      borrowDate: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
      dueDate: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0],
      status: 'returned',
      returnDate: new Date(Date.now() - 1*24*60*60*1000).toISOString()
    }
  ],
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
  users: [
    { id: 'u1', username: 'admin', password: '123456', role: 'Administrator' }
  ]
};

function getDb() {
  const data = localStorage.getItem('perpus_db');
  if (!data) return defaultDb;
  
  const parsed = JSON.parse(data);
  let updated = false;

  // Auto upgrade if old dataset is too small
  if (parsed.books && parsed.books.length <= 3) {
    parsed.books = defaultDb.books;
    parsed.members = defaultDb.members;
    parsed.transactions = defaultDb.transactions;
    parsed.users = defaultDb.users;
    localStorage.setItem('perpus_db', JSON.stringify(parsed));
  } else {
    if (parsed.books) {
      parsed.books = parsed.books.map((b: any) => {
        if (!b.status) {
          b.status = 'Tersedia';
          updated = true;
        }
        return b;
      });
    }
    
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = [
        { id: 'u1', username: 'admin', password: '123456', role: 'Administrator' }
      ];
      updated = true;
    }

    if (updated) {
      localStorage.setItem('perpus_db', JSON.stringify(parsed));
    }
  }
  return parsed;
}

function saveDb(db: any) {
  localStorage.setItem('perpus_db', JSON.stringify(db));
}

// Initialize
if (!localStorage.getItem('perpus_db')) {
  saveDb(defaultDb);
}

const mockResponse = (data: any, status = 200) => {
  return Promise.resolve(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  }));
};

Object.defineProperty(window, 'fetch', {
  value: async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
    
    if (!url.startsWith('/api/')) {
      return originalFetch(input, init);
    }

  const method = init?.method || (input instanceof Request ? input.method : 'GET');
  const body = init?.body ? JSON.parse(init.body as string) : {};
  const db = getDb();

  // Handle delay for realistic feel
  await new Promise(r => setTimeout(r, 100));

  console.log(`[Mock API] ${method} ${url}`, body);

  try {
    // Books
    if (url === '/api/books') {
      if (method === 'GET') return mockResponse(db.books);
      if (method === 'POST') {
        const newBook = { ...body, id: Date.now().toString() };
        db.books.push(newBook);
        saveDb(db);
        return mockResponse(newBook, 201);
      }
    }
    if (url.startsWith('/api/books/')) {
      const id = url.split('/').pop();
      if (method === 'PUT') {
        const idx = db.books.findIndex((b: any) => b.id === id);
        if (idx !== -1) {
          db.books[idx] = { ...db.books[idx], ...body };
          saveDb(db);
          return mockResponse(db.books[idx]);
        }
        return mockResponse({ error: 'Not found' }, 404);
      }
      if (method === 'DELETE') {
        db.books = db.books.filter((b: any) => b.id !== id);
        saveDb(db);
        return mockResponse({ success: true });
      }
    }

    // Members
    if (url === '/api/members/bulk-delete' && method === 'POST') {
      const { ids } = body;
      db.members = db.members.filter((m: any) => !ids.includes(m.id));
      saveDb(db);
      return mockResponse({ success: true });
    }
    if (url === '/api/members/bulk-edit-class' && method === 'POST') {
      const { ids, kelas } = body;
      db.members = db.members.map((m: any) => {
        if (ids.includes(m.id)) {
          return { ...m, kelas };
        }
        return m;
      });
      saveDb(db);
      return mockResponse({ success: true });
    }
    if (url === '/api/members') {
      if (method === 'GET') return mockResponse(db.members);
      if (method === 'POST') {
        const newMember = { ...body, id: Date.now().toString(), joinedAt: new Date().toISOString() };
        db.members.push(newMember);
        saveDb(db);
        return mockResponse(newMember, 201);
      }
    }
    if (url.startsWith('/api/members/')) {
      const id = url.split('/').pop();
      if (method === 'PUT') {
        const idx = db.members.findIndex((m: any) => m.id === id);
        if (idx !== -1) {
          db.members[idx] = { ...db.members[idx], ...body };
          saveDb(db);
          return mockResponse(db.members[idx]);
        }
        return mockResponse({ error: 'Not found' }, 404);
      }
      if (method === 'DELETE') {
        db.members = db.members.filter((m: any) => m.id !== id);
        saveDb(db);
        return mockResponse({ success: true });
      }
    }

    // Transactions
    if (url === '/api/transactions') {
      if (method === 'GET') {
        const today = new Date().toISOString().split('T')[0];
        let changed = false;
        for (const t of db.transactions) {
          if (t.status === 'borrowed' && t.dueDate < today) {
            t.status = 'overdue';
            changed = true;
          }
        }
        if (changed) saveDb(db);

        const populated = db.transactions.map((t: any) => ({
          ...t,
          book: db.books.find((b: any) => b.id === t.bookId),
          member: db.members.find((m: any) => m.id === t.memberId)
        }));
        return mockResponse(populated);
      }
      if (method === 'POST') {
        const { bookId, bookIds, bookNumbers, memberId, dueDate, conditionOnBorrow, notes } = body;
        const idsToProcess = Array.isArray(bookIds) ? bookIds : (bookId ? [bookId] : []);
        
        if (idsToProcess.length === 0) {
          return mockResponse({ error: 'Tidak ada buku yang dipilih untuk dipinjam' }, 400);
        }

        // Verify all selected books have available stock
        for (const bid of idsToProcess) {
          const bookIdx = db.books.findIndex((b: any) => b.id === bid);
          if (bookIdx === -1) {
            return mockResponse({ error: 'Buku tidak ditemukan' }, 400);
          }
          const b = db.books[bookIdx];
          const availableStock = b.qtyTersedia !== undefined ? b.qtyTersedia : b.stock;
          if (availableStock <= 0) {
            return mockResponse({ error: `Stok buku "${b.title}" tidak tersedia` }, 400);
          }
        }

        const nowStr = new Date().toISOString();
        const createdTransactions = [];

        for (let i = 0; i < idsToProcess.length; i++) {
          const bid = idsToProcess[i];
          const bNum = (bookNumbers && bookNumbers[i]) ? bookNumbers[i] : '';
          const bookIdx = db.books.findIndex((b: any) => b.id === bid);
          const b = db.books[bookIdx];

          // Decrement available stock (qtyTersedia) and increment borrowed count (qtyTerpakai)
          if (b.qtyTersedia !== undefined) {
            b.qtyTersedia = Math.max(0, b.qtyTersedia - 1);
          } else {
            b.qtyTersedia = Math.max(0, b.stock - 1);
          }

          if (b.qtyTerpakai !== undefined) {
            b.qtyTerpakai += 1;
          } else {
            b.qtyTerpakai = 1;
          }

          // Keep b.stock matched to available stock
          b.stock = b.qtyTersedia;

          const t = {
            id: (Date.now() + Math.floor(Math.random() * 1000) + i).toString(),
            bookId: bid,
            memberId,
            borrowDate: nowStr,
            dueDate,
            conditionOnBorrow: conditionOnBorrow || 'Baik',
            notes: notes || '',
            bookNumber: bNum,
            status: 'borrowed'
          };
          db.transactions.push(t);
          createdTransactions.push(t);
        }

        saveDb(db);
        return mockResponse(createdTransactions[0], 201);
      }
    }
    if (url.match(/\/api\/transactions\/.*\/return/)) {
      if (method === 'POST') {
        const id = url.split('/')[3];
        const tIdx = db.transactions.findIndex((t: any) => t.id === id);
        if (tIdx === -1) return mockResponse({ error: 'Not found' }, 404);
        const t = db.transactions[tIdx];
        if (t.status === 'returned') return mockResponse({ error: 'Already returned' }, 400);

        t.status = 'returned';
        t.returnDate = new Date().toISOString();
        const bookIdx = db.books.findIndex((b: any) => b.id === t.bookId);
        if (bookIdx !== -1) {
          const b = db.books[bookIdx];
          
          if (b.qtyTersedia !== undefined) {
            b.qtyTersedia += 1;
          } else {
            b.qtyTersedia = b.stock + 1;
          }

          if (b.qtyTerpakai !== undefined) {
            b.qtyTerpakai = Math.max(0, b.qtyTerpakai - 1);
          } else {
            b.qtyTerpakai = 0;
          }

          // Keep b.stock matched to available stock
          b.stock = b.qtyTersedia;
        }
        saveDb(db);
        return mockResponse(t);
      }
    }

    // Dashboard
    if (url === '/api/dashboard') {
      const totalTitles = db.books.length;
      const totalBooks = db.books.reduce((acc: number, book: any) => acc + book.stock, 0);
      const totalMembers = db.members.length;
      const activeBorrows = db.transactions.filter((t: any) => t.status === 'borrowed' || t.status === 'overdue').length;

      const chartData = [];
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const peminjam = db.transactions.filter((t: any) => t.borrowDate.startsWith(dateStr)).length;
        const pengembalian = db.transactions.filter((t: any) => t.returnDate && t.returnDate.startsWith(dateStr)).length;
        
        chartData.push({
          name: days[d.getDay()],
          peminjaman: peminjam,
          pengembalian: pengembalian
        });
      }

      return mockResponse({ totalTitles, totalBooks, totalMembers, activeBorrows, chartData });
    }

    // Settings
    if (url === '/api/settings') {
      if (method === 'GET') {
        if (!db.settings) {
          db.settings = defaultDb.settings;
          saveDb(db);
        }
        return mockResponse(db.settings);
      }
      if (method === 'POST') {
        db.settings = { ...db.settings, ...body };
        saveDb(db);
        return mockResponse(db.settings);
      }
    }

    // Users & Authentication
    if (url === '/api/login' && method === 'POST') {
      const { username, password } = body;
      const foundUser = db.users?.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (foundUser) {
        return mockResponse({ success: true, user: { username: foundUser.username, role: foundUser.role } });
      }
      return mockResponse({ error: 'Username atau password salah.' }, 401);
    }

    if (url === '/api/users') {
      if (method === 'GET') {
        return mockResponse(db.users || []);
      }
      if (method === 'POST') {
        const { id, username, password, role } = body;
        if (!db.users) db.users = [];
        
        if (id) {
          const idx = db.users.findIndex((u: any) => u.id === id);
          if (idx !== -1) {
            db.users[idx] = { ...db.users[idx], username, password, role };
          } else {
            return mockResponse({ error: 'Pengguna tidak ditemukan' }, 404);
          }
        } else {
          // Check if username already exists
          const exists = db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase());
          if (exists) {
            return mockResponse({ error: 'Username sudah digunakan' }, 400);
          }
          const newUser = { id: Date.now().toString(), username, password, role: role || 'Staf' };
          db.users.push(newUser);
        }
        saveDb(db);
        return mockResponse({ success: true, users: db.users });
      }
    }

    if (url.startsWith('/api/users/')) {
      const id = url.split('/').pop();
      if (method === 'DELETE') {
        if (!db.users) db.users = [];
        if (db.users.length <= 1) {
          return mockResponse({ error: 'Tidak dapat menghapus satu-satunya pengguna tersisa' }, 400);
        }
        db.users = db.users.filter((u: any) => u.id !== id);
        saveDb(db);
        return mockResponse({ success: true });
      }
    }

    // Tools
    if (url === '/api/export-db') {
      return mockResponse(db);
    }
    if (url === '/api/reset-db') {
      db.books = [];
      db.members = [];
      db.transactions = [];
      saveDb(db);
      return mockResponse({ success: true });
    }
    if (url === '/api/restore-db' && method === 'POST') {
      const { backupData } = body;
      if (!backupData) {
        return mockResponse({ error: 'Data backup kosong' }, 400);
      }
      try {
        const parsed = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
        if (!parsed.books || !parsed.members || !parsed.transactions) {
          return mockResponse({ error: 'Format data backup tidak sesuai. Harus mengandung buku, anggota, dan sirkulasi.' }, 400);
        }
        
        db.books = parsed.books || [];
        db.members = parsed.members || [];
        db.transactions = parsed.transactions || [];
        if (parsed.settings) db.settings = parsed.settings;
        if (parsed.users) db.users = parsed.users;
        
        saveDb(db);
        return mockResponse({ success: true });
      } catch (err: any) {
        return mockResponse({ error: 'JSON tidak valid: ' + err.message }, 400);
      }
    }

  } catch (e: any) {
    return mockResponse({ error: e.message }, 500);
  }

  return mockResponse({ error: 'Route not mocked' }, 404);
  },
  writable: true,
  configurable: true,
});
