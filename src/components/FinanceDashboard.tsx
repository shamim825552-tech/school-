import { useMemo, useState } from 'react';
import { getFees, getExpenses, getSalaries, getStudents, getClasses, toBanglaNum } from '../data';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, PiggyBank, BarChart3 } from 'lucide-react';

function monthKey(d: Date): string { return d.toISOString().slice(0, 7); }
function monthLabelBn(key: string): string {
  const d = new Date(key + '-01');
  return d.toLocaleDateString('bn-BD', { month: 'short', year: '2-digit' });
}

export default function FinanceDashboard() {
  const fees = getFees();
  const expenses = getExpenses();
  const salaries = getSalaries();
  const students = getStudents();
  const classes = getClasses();
  const [classFilter, setClassFilter] = useState('');

  // গত ৬ মাসের income vs expense ট্রেন্ড
  const last6Months = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(d));
    }
    return months.map(key => {
      const feeIncome = fees.filter(f => f.paidDate && f.paidDate.startsWith(key)).reduce((s, f) => s + f.paidAmount, 0);
      const otherIncome = expenses.filter(e => e.type === 'income' && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const otherExpense = expenses.filter(e => e.type === 'expense' && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const salaryExpense = salaries.filter(s => s.status === 'paid' && s.paidDate && s.paidDate.startsWith(key)).reduce((s, r) => s + r.netAmount, 0);
      return { key, label: monthLabelBn(key), income: feeIncome + otherIncome, expense: otherExpense + salaryExpense };
    });
  }, [fees, expenses, salaries]);

  const maxVal = Math.max(...last6Months.map(m => Math.max(m.income, m.expense)), 1);

  const totalFeeCollected = fees.reduce((s, f) => s + f.paidAmount, 0);
  const totalFeeDue = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.amount - f.paidAmount), 0);
  const feeCollectionRate = (totalFeeCollected + totalFeeDue) > 0 ? (totalFeeCollected / (totalFeeCollected + totalFeeDue)) * 100 : 0;
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalOtherIncome = expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalSalaryPaid = salaries.filter(s => s.status === 'paid').reduce((s, r) => s + r.netAmount, 0);
  const totalSalaryDue = salaries.filter(s => s.status === 'due').reduce((s, r) => s + r.netAmount, 0);
  const netBalance = (totalFeeCollected + totalOtherIncome) - (totalExpense + totalSalaryPaid);

  // ব্যয়ের ক্যাটাগরি-ভিত্তিক বিভাজন
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter(e => e.type === 'expense').forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    const arr = Object.entries(map).map(([category, amount]) => ({ category, amount }));
    return arr.sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [expenses]);
  const maxCategoryAmt = Math.max(...expenseByCategory.map(c => c.amount), 1);

  // বকেয়া ফি — শিক্ষার্থী ভিত্তিক তালিকা
  const dueList = useMemo(() => {
    const map: Record<string, { studentId: string; due: number; count: number }> = {};
    fees.filter(f => f.status !== 'paid').forEach(f => {
      const student = students.find(s => s.id === f.studentId);
      if (classFilter && student?.classId !== classFilter) return;
      if (!map[f.studentId]) map[f.studentId] = { studentId: f.studentId, due: 0, count: 0 };
      map[f.studentId].due += (f.amount - f.paidAmount);
      map[f.studentId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.due - a.due).slice(0, 15);
  }, [fees, students, classFilter]);

  const studentInfo = (id: string) => students.find(s => s.id === id);
  const className = (id?: string) => classes.find(c => c.id === id)?.name || '';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2"><PiggyBank size={24} /> আর্থিক পরিদর্শন</h2>
        <p className="text-emerald-100 text-sm">ফি, আয়-ব্যয় ও বেতন — একটি সম্মিলিত ওভারভিউ</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-xs text-white/80">নিট ব্যালেন্স</p>
            <p className={`text-xl font-bold ${netBalance < 0 ? 'text-red-200' : ''}`}>৳{toBanglaNum(netBalance)}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-xs text-white/80">ফি আদায়ের হার</p>
            <p className="text-xl font-bold">{toBanglaNum(Math.round(feeCollectionRate))}%</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-xs text-white/80">মোট বকেয়া (ফি+বেতন)</p>
            <p className="text-xl font-bold">৳{toBanglaNum(totalFeeDue + totalSalaryDue)}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div>
          <div><p className="text-xs text-gray-500">ফি আদায়</p><p className="text-lg font-bold text-gray-800">৳{toBanglaNum(totalFeeCollected)}</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-11 h-11 bg-red-50 rounded-lg flex items-center justify-center"><AlertCircle size={20} className="text-red-600" /></div>
          <div><p className="text-xs text-gray-500">ফি বকেয়া</p><p className="text-lg font-bold text-gray-800">৳{toBanglaNum(totalFeeDue)}</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-11 h-11 bg-orange-50 rounded-lg flex items-center justify-center"><TrendingDown size={20} className="text-orange-600" /></div>
          <div><p className="text-xs text-gray-500">মোট ব্যয় (পরিচালন)</p><p className="text-lg font-bold text-gray-800">৳{toBanglaNum(totalExpense)}</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-11 h-11 bg-cyan-50 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-cyan-600" /></div>
          <div><p className="text-xs text-gray-500">বেতন পরিশোধ/বকেয়া</p><p className="text-sm font-bold text-gray-800">৳{toBanglaNum(totalSalaryPaid)} / ৳{toBanglaNum(totalSalaryDue)}</p></div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 6-month trend chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-emerald-600" />
            <h3 className="font-bold text-gray-800 text-sm">গত ৬ মাসের আয়-ব্যয় ট্রেন্ড</h3>
          </div>
          <div className="flex items-end gap-3 h-44">
            {last6Months.map(m => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center gap-1" style={{ height: '150px' }}>
                  <div className="w-1/2 bg-green-500 rounded-t-md" style={{ height: `${(m.income / maxVal) * 100}%`, minHeight: m.income > 0 ? '4px' : 0 }} title={`আয়: ৳${m.income}`} />
                  <div className="w-1/2 bg-red-400 rounded-t-md" style={{ height: `${(m.expense / maxVal) * 100}%`, minHeight: m.expense > 0 ? '4px' : 0 }} title={`ব্যয়: ৳${m.expense}`} />
                </div>
                <span className="text-xs text-gray-500 font-medium">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 justify-center">
            <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 bg-green-500 rounded-sm" /> আয়</span>
            <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 bg-red-400 rounded-sm" /> ব্যয়</span>
          </div>
        </div>

        {/* Expense category breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm mb-4">ব্যয়ের ক্যাটাগরি বিভাজন</h3>
          {expenseByCategory.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">কোনো ব্যয় রেকর্ড নেই</p>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.map(c => (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{c.category}</span>
                    <span className="text-gray-500">৳{toBanglaNum(c.amount)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(c.amount / maxCategoryAmt) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Due fee list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><AlertCircle size={18} className="text-red-500" /> শীর্ষ বকেয়া তালিকা</h3>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none">
            <option value="">সব ক্লাস</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="divide-y">
          {dueList.map(d => {
            const student = studentInfo(d.studentId);
            return (
              <div key={d.studentId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{student?.name || 'অজানা'}</p>
                  <p className="text-xs text-gray-500">{className(student?.classId)} {student?.section} • রোল {toBanglaNum(student?.roll || 0)} • {toBanglaNum(d.count)}টি ইনভয়েস</p>
                </div>
                <span className="text-sm font-bold text-red-500">৳{toBanglaNum(d.due)}</span>
              </div>
            );
          })}
          {dueList.length === 0 && <p className="text-center text-gray-400 text-sm py-8">কোনো বকেয়া নেই 🎉</p>}
        </div>
      </div>
    </div>
  );
}
