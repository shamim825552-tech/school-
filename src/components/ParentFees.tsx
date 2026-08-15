import { User, FeeStatus } from '../types';
import { getStudents, getFees, toBanglaNum } from '../data';
import { Wallet, AlertCircle } from 'lucide-react';

interface Props {
  user: User;
}

const statusLabel: Record<FeeStatus, string> = { due: 'বকেয়া', paid: 'পরিশোধিত', partial: 'আংশিক পরিশোধিত' };
const statusColor: Record<FeeStatus, string> = {
  due: 'bg-red-100 text-red-600',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
};

export default function ParentFees({ user }: Props) {
  const child = getStudents().find(s => s.id === user.childId);
  const fees = getFees().filter(f => f.studentId === user.childId).sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  if (!child) {
    return <div className="bg-white rounded-xl p-12 text-center"><p className="text-lg text-gray-400">শিক্ষার্থীর তথ্য পাওয়া যায়নি</p></div>;
  }

  const totalDue = fees.filter(f => f.status !== 'paid').reduce((s, f) => s + (f.amount - f.paidAmount), 0);

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl p-6 text-white ${totalDue > 0 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}>
        <div className="flex items-center gap-3">
          {totalDue > 0 ? <AlertCircle size={28} /> : <Wallet size={28} />}
          <div>
            <p className="text-sm opacity-90">মোট বকেয়া</p>
            <p className="text-2xl font-bold">৳{toBanglaNum(totalDue)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {fees.map(f => (
          <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{f.title}{f.month ? ` — ${f.month}` : ''}</p>
              <p className="text-xs text-gray-500">শেষ তারিখ: {f.dueDate}</p>
              {f.status === 'paid' && f.paidDate && <p className="text-xs text-green-600">পরিশোধ: {f.paidDate}</p>}
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">৳{toBanglaNum(f.amount)}</p>
              <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[f.status]}`}>{statusLabel[f.status]}</span>
            </div>
          </div>
        ))}
      </div>

      {fees.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">কোনো ফি ইনভয়েস পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}
