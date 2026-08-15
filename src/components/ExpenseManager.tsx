import { useState, useMemo } from 'react';
import { ExpenseRecord, ExpenseType } from '../types';
import { getExpenses, saveExpenses, toBanglaNum, formatDate, getFees } from '../data';
import { Plus, Trash2, X, Save, Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';

export default function ExpenseManager() {
  const [items, setItems] = useState<ExpenseRecord[]>(getExpenses());
  const fees = getFees();
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', category: '', type: 'expense' as ExpenseType, amount: '', date: new Date().toISOString().split('T')[0], note: '',
  });

  const filtered = useMemo(() => {
    return items.filter(e => !monthFilter || e.date.startsWith(monthFilter)).sort((a, b) => b.date.localeCompare(a.date));
  }, [items, monthFilter]);

  const feeCollectedThisMonth = useMemo(() => {
    return fees.filter(f => f.paidDate && f.paidDate.startsWith(monthFilter)).reduce((sum, f) => sum + f.paidAmount, 0);
  }, [fees, monthFilter]);

  const totalIncome = filtered.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0) + feeCollectedThisMonth;
  const totalExpense = filtered.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const openAdd = () => {
    setForm({ title: '', category: '', type: 'expense', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.category || !form.amount) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const newItem: ExpenseRecord = {
      id: `exp-${Date.now()}`, title: form.title, category: form.category, type: form.type,
      amount: parseFloat(form.amount) || 0, date: form.date, note: form.note || undefined,
    };
    const updated = [...items, newItem];
    saveExpenses(updated);
    setItems(updated);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই এন্ট্রিটি মুছে ফেলতে চান?')) return;
    const updated = items.filter(e => e.id !== id);
    saveExpenses(updated);
    setItems(updated);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Plus size={18} /> নতুন এন্ট্রি
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div>
          <div>
            <p className="text-xs text-gray-500">মোট আয় (ফি সহ)</p>
            <p className="text-lg font-bold text-gray-800">৳{toBanglaNum(totalIncome)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-11 h-11 bg-red-50 rounded-lg flex items-center justify-center"><TrendingDown size={20} className="text-red-600" /></div>
          <div>
            <p className="text-xs text-gray-500">মোট ব্যয়</p>
            <p className="text-lg font-bold text-gray-800">৳{toBanglaNum(totalExpense)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${balance >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
            <Scale size={20} className={balance >= 0 ? 'text-blue-600' : 'text-red-600'} />
          </div>
          <div>
            <p className="text-xs text-gray-500">নিট ব্যালেন্স</p>
            <p className={`text-lg font-bold ${balance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>৳{toBanglaNum(balance)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(e => (
          <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${e.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
                {e.type === 'income' ? <TrendingUp size={18} className="text-green-600" /> : <TrendingDown size={18} className="text-red-600" />}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{e.title}</p>
                <p className="text-xs text-gray-500">{e.category} • {formatDate(e.date)}</p>
                {e.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{e.note}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`font-bold text-sm ${e.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {e.type === 'income' ? '+' : '-'}৳{toBanglaNum(e.amount)}
              </span>
              <button onClick={() => handleDelete(e.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">এই মাসে কোনো লেনদেন নেই</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন লেনদেন</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...form, type: 'expense' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${form.type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>ব্যয়</button>
                <button onClick={() => setForm({ ...form, type: 'income' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${form.type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>আয়</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: শিক্ষক বেতন" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি *</label>
                  <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: বেতন" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ (৳) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নোট (ঐচ্ছিক)</label>
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
