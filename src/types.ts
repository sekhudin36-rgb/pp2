export interface Book {
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
  qtyTersedia?: number;
  qtyTerpakai?: number;
  qtyRusak?: number;
  source: string;
  price: number;
  condition: string;
  status: string;
  description: string;
  shelfLocation: string;
  language: string;
  pages: number;
  size?: string;
  material?: string;
  acquisitionYear?: string;
  coverContent?: string;
  ebookUrl?: string;
  ddcCode?: string;
  tags?: string[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: 'Siswa' | 'Guru' | 'Staf' | 'Umum';
  gender: 'Laki-laki' | 'Perempuan';
  photo?: string;
  status: 'Aktif' | 'Nonaktif';
  nisNip: string;
  kelas?: string;
  joinedAt: string;
}

export interface Transaction {
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
  bookNumber?: string;
  fineAmount?: number;
  book?: Book;
  member?: Member;
}

export interface Visitor {
  id: string;
  memberId?: string;
  name: string;
  role: string;
  kelasOrDept?: string;
  nisNip?: string;
  purpose: string;
  notes?: string;
  visitedAt: string;
}

export interface SettingsData {
  libraryName: string;
  institutionName: string;
  npsn?: string;
  accreditation?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  headLibrarian: string;
  headLibrarianNip?: string;
  principalName: string;
  principalNip?: string;
  maxBorrowDays: number;
  maxBorrowItems: number;
  finePerDay: number;
  autoBackupInterval?: string;
  syncMode?: 'hybrid' | 'offline_only' | 'online_cloud';
}

export interface SystemUser {
  id: string;
  username: string;
  password?: string;
  role: string;
  avatar?: string;
}

export interface BorrowRequest {
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
