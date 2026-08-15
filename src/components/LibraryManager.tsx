import { useState, useMemo } from 'react';
import { User, LibraryBook, BookIssue } from '../types';
import { getBooks, saveBooks, getBookIssues, saveBookIssues, getStudents, formatDate, getTodayStr } from '../data';
import { Plus, Trash2, X, Save, BookMarked, Search, Undo2, BookUp } from 'lucide-react';

interface Props {
  user: User;
}

export default function LibraryManager({ user }: Props) {
  const isAdmin = user.role === 'admin';
  const students = getStudents();
  const [books, setBooks] = useState<LibraryBook[]>(getBooks());
  const [issues, setIssues] = useState<BookIssue[]>(getBookIssues());
  const [tab, setTab] = useState<'books' | 'issues'>('books');
  const [search, setSearch] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [bookForm, setBookForm] = useState({ title: '', author: '', category: '', isbn: '', totalCopies: '1' });
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '', dueDate: '' });

  const filteredBooks = useMemo(() => books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())
  ), [books, search]);

  const studentName = (id: string) => students.find(s => s.id === id)?.name || 'অজানা';
  const bookTitle = (id: string) => books.find(b => b.id === id)?.title || 'অজানা';

  const openAddBook = () => {
    setBookForm({ title: '', author: '', category: '', isbn: '', totalCopies: '1' });
    setShowBookForm(true);
  };

  const handleSaveBook = () => {
    if (!bookForm.title || !bookForm.author || !bookForm.totalCopies) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const copies = parseInt(bookForm.totalCopies) || 1;
    const newBook: LibraryBook = {
      id: `book-${Date.now()}`, title: bookForm.title, author: bookForm.author,
      category: bookForm.category || 'সাধারণ', isbn: bookForm.isbn || undefined,
      totalCopies: copies, availableCopies: copies,
    };
    const updated = [...books, newBook];
    saveBooks(updated);
    setBooks(updated);
    setShowBookForm(false);
  };

  const handleDeleteBook = (id: string) => {
    if (!confirm('এই বইটি মুছে ফেলতে চান?')) return;
    const updated = books.filter(b => b.id !== id);
    saveBooks(updated);
    setBooks(updated);
  };

  const openIssue = () => {
    setIssueForm({ bookId: '', studentId: '', dueDate: '' });
    setShowIssueForm(true);
  };

  const handleIssue = () => {
    if (!issueForm.bookId || !issueForm.studentId || !issueForm.dueDate) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const book = books.find(b => b.id === issueForm.bookId);
    if (!book || book.availableCopies < 1) { alert('এই বইয়ের কোনো কপি বর্তমানে উপলব্ধ নেই!'); return; }

    const newIssue: BookIssue = {
      id: `issue-${Date.now()}`, bookId: issueForm.bookId, studentId: issueForm.studentId,
      issueDate: getTodayStr(), dueDate: issueForm.dueDate, status: 'issued',
    };
    const updatedIssues = [...issues, newIssue];
    saveBookIssues(updatedIssues);
    setIssues(updatedIssues);

    const updatedBooks = books.map(b => b.id === book.id ? { ...b, availableCopies: b.availableCopies - 1 } : b);
    saveBooks(updatedBooks);
    setBooks(updatedBooks);
    setShowIssueForm(false);
  };

  const handleReturn = (issue: BookIssue) => {
    const updatedIssues = issues.map(i => i.id === issue.id ? { ...i, status: 'returned' as const, returnDate: getTodayStr() } : i);
    saveBookIssues(updatedIssues);
    setIssues(updatedIssues);

    const book = books.find(b => b.id === issue.bookId);
    if (book) {
      const updatedBooks = books.map(b => b.id === book.id ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b);
      saveBooks(updatedBooks);
      setBooks(updatedBooks);
    }
  };

  const activeIssues = issues.filter(i => i.status === 'issued').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const todayStr = getTodayStr();

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-fit">
        <button onClick={() => setTab('books')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'books' ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>বই তালিকা</button>
        <button onClick={() => setTab('issues')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'issues' ? 'bg-sky-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>ইস্যুকৃত বই</button>
      </div>

      {tab === 'books' && (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="বই খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <button onClick={openIssue} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
                  <BookUp size={18} /> বই ইস্যু করুন
                </button>
                <button onClick={openAddBook} className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
                  <Plus size={18} /> নতুন বই
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBooks.map(b => (
              <div key={b.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                      <BookMarked size={18} className="text-sky-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{b.title}</p>
                      <p className="text-xs text-gray-500">{b.author}</p>
                      <p className="text-xs text-gray-400 mt-1">{b.category}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDeleteBook(b.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 shrink-0"><Trash2 size={14} /></button>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-full font-medium ${b.availableCopies > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {b.availableCopies} / {b.totalCopies} উপলব্ধ
                  </span>
                </div>
              </div>
            ))}
          </div>
          {filteredBooks.length === 0 && <p className="text-center text-gray-400 py-10">কোনো বই পাওয়া যায়নি</p>}
        </>
      )}

      {tab === 'issues' && (
        <div className="space-y-3">
          {activeIssues.map(issue => {
            const overdue = issue.dueDate < todayStr;
            return (
              <div key={issue.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${overdue ? 'border-red-400' : 'border-emerald-500'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{bookTitle(issue.bookId)}</p>
                    <p className="text-xs text-gray-500">শিক্ষার্থী: {studentName(issue.studentId)}</p>
                    <p className={`text-xs mt-1 ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                      ফেরতের শেষ তারিখ: {formatDate(issue.dueDate)}{overdue ? ' (মেয়াদোত্তীর্ণ)' : ''}
                    </p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleReturn(issue)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700">
                      <Undo2 size={14} /> ফেরত নিন
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {activeIssues.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <BookMarked size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg text-gray-400">বর্তমানে কোনো বই ইস্যু করা নেই</p>
            </div>
          )}
        </div>
      )}

      {showBookForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন বই যোগ করুন</h3>
              <button onClick={() => setShowBookForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বইয়ের নাম *</label>
                <input type="text" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">লেখক *</label>
                <input type="text" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বিষয়</label>
                  <input type="text" value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: গল্প" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">মোট কপি *</label>
                  <input type="number" min={1} value={bookForm.totalCopies} onChange={e => setBookForm({ ...bookForm, totalCopies: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN (ঐচ্ছিক)</label>
                <input type="text" value={bookForm.isbn} onChange={e => setBookForm({ ...bookForm, isbn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowBookForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSaveBook} className="flex-1 py-2 bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      {showIssueForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">বই ইস্যু করুন</h3>
              <button onClick={() => setShowIssueForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বই *</label>
                <select value={issueForm.bookId} onChange={e => setIssueForm({ ...issueForm, bookId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="">নির্বাচন করুন</option>
                  {books.filter(b => b.availableCopies > 0).map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} উপলব্ধ)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষার্থী *</label>
                <select value={issueForm.studentId} onChange={e => setIssueForm({ ...issueForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="">নির্বাচন করুন</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} (রোল {s.roll})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ফেরতের শেষ তারিখ *</label>
                <input type="date" value={issueForm.dueDate} onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowIssueForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleIssue} className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> ইস্যু করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
