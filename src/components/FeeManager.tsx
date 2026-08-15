import { useState, useMemo } from 'react';
import { FeeInvoice, FeeStatus } from '../types';
import { getFees, saveFees, getStudents, getClasses, toBanglaNum } from '../data';
import { Plus, Trash2, X, Save, Wallet, CheckCircle2, Clock, AlertCircle, Printer } from 'lucide-react';

const statusLabel: Record<FeeStatus, string> = { due: 'বকেয়া', paid: 'পরিশোধিত', partial: 'আংশিক পরিশোধিত' };
const statusColor: Record<FeeStatus, string> = {
  due: 'bg-red-100 text-red-600',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
};

export default function FeeManager() {
  const students = getStudents();
  const classes = getClasses();
  const [fees, setFees] = useState<FeeInvoice[]>(getFees());
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeeStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('cash');

  const [form, setForm] = useState({
    scope: 'student' as 'student' | 'class',
    studentId: '', classId: '', title: '', amount: '', month: '', year: String(new Date().getFullYear()), dueDate: '',
  });

  const className = (id: string) => classes.find(c => c.id === id)?.name || '';
  const studentName = (id: string) => students.find(s => s.id === id)?.name || 'অজানা';

  const filtered = useMemo(() => {
    return fees.filter(f => {
      const student = students.find(s => s.id === f.studentId);
      if (classFilter && student?.classId !== classFilter) return false;
      if (statusFilter && f.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => (b.dueDate > a.dueDate ? 1 : -1));
  }, [fees, classFilter, statusFilter, students]);

  const totals = useMemo(() => {
    const due = fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    const collected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    return { due, collected };
  }, [fees]);

  const openAdd = () => {
    setForm({ scope: 'student', studentId: students[0]?.id || '', classId: classes[0]?.id || '', title: '', amount: '', month: '', year: String(new Date().getFullYear()), dueDate: '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.amount || !form.dueDate) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const targetStudents = form.scope === 'student'
      ? students.filter(s => s.id === form.studentId)
      : students.filter(s => s.classId === form.classId);
    if (targetStudents.length === 0) { alert('কোনো শিক্ষার্থী পাওয়া যায়নি!'); return; }

    const newInvoices: FeeInvoice[] = targetStudents.map(s => ({
      id: `fee-${Date.now()}-${s.id}`,
      studentId: s.id,
      title: form.title,
      amount: Number(form.amount),
      month: form.month || undefined,
      year: form.year,
      dueDate: form.dueDate,
      status: 'due',
      paidAmount: 0,
    }));
    const updated = [...fees, ...newInvoices];
    saveFees(updated);
    setFees(updated);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই ইনভয়েসটি মুছে ফেলতে চান?')) return;
    const updated = fees.filter(f => f.id !== id);
    saveFees(updated);
    setFees(updated);
  };

  const openPay = (f: FeeInvoice) => {
    setPayingId(f.id);
    setPayAmount(String(f.amount - f.paidAmount));
    setPayMethod('cash');
  };

  const handlePrintReceipt = (f: FeeInvoice) => {
    const student = students.find(s => s.id === f.studentId);
    const win = window.open('', '_blank', 'width=420,height=600');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>পেমেন্ট রশিদ</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Noto Sans Bengali', Arial, sans-serif; padding: 24px; color: #1f2937; }
            h2 { text-align: center; margin-bottom: 4px; }
            p.sub { text-align: center; color: #6b7280; margin-top: 0; margin-bottom: 20px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            td { padding: 8px 4px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            td.label { color: #6b7280; width: 45%; }
            td.value { font-weight: 600; text-align: right; }
            .total { font-size: 18px; margin-top: 16px; text-align: right; font-weight: 700; }
            .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <h2>ভোলাচং উচ্চ বিদ্যালয়</h2>
          <p class="sub">পেমেন্ট রশিদ / Payment Receipt</p>
          <table>
            <tr><td class="label">শিক্ষার্থীর নাম</td><td class="value">${student?.name ?? ''}</td></tr>
            <tr><td class="label">ক্লাস</td><td class="value">${className(student?.classId || '')} ${student ? '- সেকশন ' + student.section : ''}</td></tr>
            <tr><td class="label">ফি এর শিরোনাম</td><td class="value">${f.title}</td></tr>
            <tr><td class="label">মেয়াদ</td><td class="value">${f.month ? f.month + ' ' : ''}${f.year}</td></tr>
            <tr><td class="label">মোট পরিমাণ</td><td class="value">৳${toBanglaNum(f.amount)}</td></tr>
            <tr><td class="label">পরিশোধিত পরিমাণ</td><td class="value">৳${toBanglaNum(f.paidAmount)}</td></tr>
            <tr><td class="label">পরিশোধের তারিখ</td><td class="value">${f.paidDate ?? ''}</td></tr>
            <tr><td class="label">পদ্ধতি</td><td class="value">${f.method ?? ''}</td></tr>
            <tr><td class="label">স্ট্যাটাস</td><td class="value">${statusLabel[f.status]}</td></tr>
          </table>
          <div class="footer">এই রশিদটি কম্পিউটার জেনারেটেড, স্বাক্ষরের প্রয়োজন নেই।</div>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleRecordPayment = () => {
    if (!payingId) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { alert('সঠিক পরিমাণ দিন'); return; }
    const updated = fees.map(f => {
      if (f.id !== payingId) return f;
      const newPaid = f.paidAmount + amount;
      const status: FeeStatus = newPaid >= f.amount ? 'paid' : 'partial';
      return { ...f, paidAmount: Math.min(newPaid, f.amount), status, paidDate: new Date().toISOString().split('T')[0], method: payMethod };
    });
    saveFees(updated);
    setFees(updated);
    setPayingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle2 size={20} className="text-green-600" /></div>
          <div>
            <p className="text-lg font-bold text-green-600">৳{toBanglaNum(totals.collected)}</p>
            <p className="text-xs text-gray-500">মোট আদায়</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><AlertCircle size={20} className="text-red-500" /></div>
          <div>
            <p className="text-lg font-bold text-red-500">৳{toBanglaNum(totals.due)}</p>
            <p className="text-xs text-gray-500">মোট বকেয়া</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">সব ক্লাস</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as FeeStatus | '')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">সব স্ট্যাটাস</option>
            <option value="due">বকেয়া</option>
            <option value="partial">আংশিক পরিশোধিত</option>
            <option value="paid">পরিশোধিত</option>
          </select>
        </div>
        <button onClick={openAdd} disabled={students.length === 0}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition disabled:opacity-40">
          <Plus size={18} /> নতুন ফি ইনভয়েস
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(f => (
          <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Wallet size={18} className="text-emerald-600" /></div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{f.title} — {studentName(f.studentId)}</p>
                <p className="text-xs text-gray-500">
                  {className(students.find(s => s.id === f.studentId)?.classId || '')} • মেয়াদ: {f.dueDate}
                  {f.month ? ` • ${f.month}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-bold text-gray-800">৳{toBanglaNum(f.amount)}</p>
                {f.paidAmount > 0 && f.status !== 'paid' && <p className="text-xs text-gray-500">পরিশোধিত: ৳{toBanglaNum(f.paidAmount)}</p>}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusColor[f.status]}`}>{statusLabel[f.status]}</span>
              {f.status !== 'paid' && (
                <button onClick={() => openPay(f)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">পেমেন্ট নিন</button>
              )}
              {f.paidAmount > 0 && (
                <button onClick={() => handlePrintReceipt(f)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="রশিদ প্রিন্ট করুন"><Printer size={16} /></button>
              )}
              <button onClick={() => handleDelete(f.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Clock size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">কোনো ফি ইনভয়েস পাওয়া যায়নি</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন ফি ইনভয়েস</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...form, scope: 'student' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.scope === 'student' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600'}`}>
                  একজন শিক্ষার্থী
                </button>
                <button onClick={() => setForm({ ...form, scope: 'class' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.scope === 'class' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600'}`}>
                  পুরো ক্লাস
                </button>
              </div>
              {form.scope === 'student' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষার্থী *</label>
                  <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} — {className(s.classId)}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ক্লাস *</label>
                  <select value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ফি এর শিরোনাম *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: মাসিক বেতন / ভর্তি ফি / পরীক্ষার ফি" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ (৳) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">মাস (ঐচ্ছিক)</label>
                  <input type="text" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: জানুয়ারি" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বছর</label>
                  <input type="text" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শেষ তারিখ *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> তৈরি করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {payingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">পেমেন্ট রেকর্ড করুন</h3>
              <button onClick={() => setPayingId(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ (৳)</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পদ্ধতি</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="cash">নগদ (Cash)</option>
                  <option value="bkash">বিকাশ</option>
                  <option value="nagad">নগদ (bKash-Nagad app)</option>
                  <option value="bank">ব্যাংক</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setPayingId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleRecordPayment} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
