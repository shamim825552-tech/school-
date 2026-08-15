import { useState, useMemo } from 'react';
import { SalaryRecord, SalaryMethod } from '../types';
import { getUsers, getSalaries, saveSalaries, toBanglaNum, formatDate, getTodayStr } from '../data';
import { Wallet2, Plus, Trash2, X, Save, CheckCircle2 } from 'lucide-react';

const MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

export default function PayrollManager() {
  const teachers = getUsers().filter(u => u.role === 'teacher');
  const [salaries, setSalaries] = useState<SalaryRecord[]>(getSalaries());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    teacherId: '', month: MONTHS[new Date().getMonth()], year: String(new Date().getFullYear()),
    basicAmount: '', bonus: '0', deduction: '0',
  });

  const teacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'অজানা';

  const sorted = useMemo(() => [...salaries].sort((a, b) => b.timestamp - a.timestamp), [salaries]);

  const totalPaid = salaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.netAmount, 0);
  const totalDue = salaries.filter(s => s.status === 'due').reduce((sum, s) => sum + s.netAmount, 0);

  const openAdd = () => {
    setForm({ teacherId: '', month: MONTHS[new Date().getMonth()], year: String(new Date().getFullYear()), basicAmount: '', bonus: '0', deduction: '0' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.teacherId || !form.basicAmount) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const basic = parseFloat(form.basicAmount) || 0;
    const bonus = parseFloat(form.bonus) || 0;
    const deduction = parseFloat(form.deduction) || 0;
    const newRecord: SalaryRecord = {
      id: `salary-${Date.now()}`, teacherId: form.teacherId, month: form.month, year: form.year,
      basicAmount: basic, bonus, deduction, netAmount: basic + bonus - deduction, status: 'due', timestamp: Date.now(),
    };
    const updated = [...salaries, newRecord];
    saveSalaries(updated);
    setSalaries(updated);
    setShowForm(false);
  };

  const markPaid = (record: SalaryRecord, method: SalaryMethod) => {
    const updated = salaries.map(s => s.id === record.id ? { ...s, status: 'paid' as const, paidDate: getTodayStr(), method } : s);
    saveSalaries(updated);
    setSalaries(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই বেতন রেকর্ডটি মুছে ফেলতে চান?')) return;
    const updated = salaries.filter(s => s.id !== id);
    saveSalaries(updated);
    setSalaries(updated);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">মোট পরিশোধিত</p>
          <p className="text-xl font-bold text-green-600">৳{toBanglaNum(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">মোট বকেয়া</p>
          <p className="text-xl font-bold text-red-500">৳{toBanglaNum(totalDue)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">শিক্ষক বেতন ব্যবস্থাপনা</h3>
        <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Plus size={18} /> নতুন বেতন এন্ট্রি
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map(s => (
          <div key={s.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.status === 'paid' ? 'border-green-500' : 'border-amber-400'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{teacherName(s.teacherId)}</p>
                <p className="text-xs text-gray-500">{s.month} {s.year}</p>
                <p className="text-sm text-gray-700 mt-1">
                  মূল: ৳{toBanglaNum(s.basicAmount)} + বোনাস: ৳{toBanglaNum(s.bonus)} − কর্তন: ৳{toBanglaNum(s.deduction)} = <span className="font-bold">৳{toBanglaNum(s.netAmount)}</span>
                </p>
                {s.status === 'paid' && s.paidDate && (
                  <p className="text-xs text-green-600 mt-1">পরিশোধ: {formatDate(s.paidDate)}{s.method ? ` (${s.method})` : ''}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {s.status === 'paid' ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    <CheckCircle2 size={14} /> পরিশোধিত
                  </span>
                ) : (
                  <select onChange={e => e.target.value && markPaid(s, e.target.value as SalaryMethod)} defaultValue=""
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                    <option value="" disabled>পরিশোধ করুন</option>
                    <option value="cash">নগদ</option>
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ (মোবাইল)</option>
                    <option value="bank">ব্যাংক</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                )}
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Wallet2 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-gray-400">কোনো বেতন রেকর্ড নেই</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন বেতন এন্ট্রি</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষক *</label>
                <select value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="">নির্বাচন করুন</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">মাস</label>
                  <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বছর</label>
                  <input type="text" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">মূল বেতন *</label>
                <input type="number" value={form.basicAmount} onChange={e => setForm({ ...form, basicAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">বোনাস</label>
                  <input type="number" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">কর্তন</label>
                  <input type="number" value={form.deduction} onChange={e => setForm({ ...form, deduction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
