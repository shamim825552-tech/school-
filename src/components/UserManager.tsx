import { useState } from 'react';
import { User, UserRole } from '../types';
import { getUsers, saveUsers, getStudents, saveStudents } from '../data';
import {
  ShieldCheck, ShieldOff, Trash2, Search, Clock, X, CheckCircle2, AlertTriangle,
} from 'lucide-react';

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'অ্যাডমিন', teacher: 'শিক্ষক', parent: 'অভিভাবক',
};
const ROLE_COLOR: Record<UserRole, string> = {
  admin: 'bg-blue-100 text-blue-700', teacher: 'bg-green-100 text-green-700', parent: 'bg-purple-100 text-purple-700',
};

interface Props {
  currentUser: User;
}

export default function UserManager({ currentUser }: Props) {
  const [users, setUsers] = useState<User[]>(getUsers());
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'' | UserRole>('');
  const [expiryTargetId, setExpiryTargetId] = useState<string | null>(null);
  const [expiryValue, setExpiryValue] = useState('');
  const [blockTargetId, setBlockTargetId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const refresh = (updated: User[]) => {
    saveUsers(updated);
    setUsers(updated);
  };

  const filtered = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false;
    if (search && !u.name.includes(search) && !u.phone.includes(search)) return false;
    return true;
  });

  const isExpired = (u: User) => !!u.expiresAt && Date.now() > u.expiresAt;

  const statusOf = (u: User) => {
    if (u.isBlocked) return { label: 'ব্লক করা', color: 'bg-red-100 text-red-700', icon: <ShieldOff size={13} /> };
    if (isExpired(u)) return { label: 'মেয়াদ শেষ', color: 'bg-orange-100 text-orange-700', icon: <Clock size={13} /> };
    return { label: 'সক্রিয়', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={13} /> };
  };

  const toggleBlock = (u: User) => {
    if (u.id === currentUser.id) {
      showToast('আপনি নিজের আইডি ব্লক করতে পারবেন না।');
      return;
    }
    if (u.isBlocked) {
      refresh(users.map(x => (x.id === u.id ? { ...x, isBlocked: false, blockedReason: undefined } : x)));
      showToast(`${u.name}-এর আইডি আনব্লক করা হয়েছে।`);
    } else {
      setBlockTargetId(u.id);
      setBlockReason('');
    }
  };

  const confirmBlock = () => {
    if (!blockTargetId) return;
    const target = users.find(u => u.id === blockTargetId);
    refresh(users.map(x => (x.id === blockTargetId ? { ...x, isBlocked: true, blockedReason: blockReason.trim() || undefined } : x)));
    showToast(`${target?.name ?? ''}-এর আইডি ব্লক করা হয়েছে।`);
    setBlockTargetId(null);
  };

  const handleDelete = (u: User) => {
    if (u.id === currentUser.id) {
      showToast('আপনি নিজের আইডি মুছে ফেলতে পারবেন না।');
      return;
    }
    if (u.role === 'admin' && users.filter(x => x.role === 'admin').length <= 1) {
      showToast('সর্বশেষ অ্যাডমিন আইডি মুছে ফেলা যাবে না।');
      return;
    }
    if (!confirm(`আপনি কি "${u.name}"-এর আইডি স্থায়ীভাবে মুছে ফেলতে চান? এটি বাতিল করা যাবে না।`)) return;

    refresh(users.filter(x => x.id !== u.id));

    // অভিভাবক ডিলিট হলে সংশ্লিষ্ট শিক্ষার্থীর সাথে লিংক তুলে দেওয়া হচ্ছে
    if (u.role === 'parent' && u.childId) {
      const students = getStudents();
      const updatedStudents = students.map(s => (s.id === u.childId ? { ...s, parentId: undefined } : s));
      saveStudents(updatedStudents);
    }
    showToast(`"${u.name}"-এর আইডি মুছে ফেলা হয়েছে।`);
  };

  const openExpiry = (u: User) => {
    setExpiryTargetId(u.id);
    setExpiryValue(u.expiresAt ? new Date(u.expiresAt).toISOString().slice(0, 16) : '');
  };

  const saveExpiry = () => {
    if (!expiryTargetId) return;
    const ms = expiryValue ? new Date(expiryValue).getTime() : undefined;
    refresh(users.map(x => (x.id === expiryTargetId ? { ...x, expiresAt: ms } : x)));
    showToast('মেয়াদ সংরক্ষণ করা হয়েছে।');
    setExpiryTargetId(null);
  };

  const clearExpiry = () => {
    if (!expiryTargetId) return;
    refresh(users.map(x => (x.id === expiryTargetId ? { ...x, expiresAt: undefined } : x)));
    setExpiryTargetId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">ইউজার ব্যবস্থাপনা</h3>
          <p className="text-sm text-gray-500">শিক্ষক ও অভিভাবকদের আইডি ব্লক/আনব্লক, মুছে ফেলা ও মেয়াদ নির্ধারণ করুন</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as '' | UserRole)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">সকল ভূমিকা</option>
            <option value="admin">অ্যাডমিন</option>
            <option value="teacher">শিক্ষক</option>
            <option value="parent">অভিভাবক</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-600">নাম</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden md:table-cell">ভূমিকা</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden md:table-cell">ফোন</th>
                <th className="text-left p-3 font-semibold text-gray-600">স্ট্যাটাস</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden lg:table-cell">মেয়াদ</th>
                <th className="text-right p-3 font-semibold text-gray-600">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const st = statusOf(u);
                return (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="p-3">
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500 md:hidden">{ROLE_LABEL[u.role]} · {u.phone}</p>
                      {u.blockedReason && <p className="text-xs text-red-500 mt-0.5">কারণ: {u.blockedReason}</p>}
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-gray-600">{u.phone}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-gray-500">
                      {u.expiresAt ? new Date(u.expiresAt).toLocaleString('bn-BD') : <span className="text-gray-300">অসীম</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <button onClick={() => toggleBlock(u)}
                          title={u.isBlocked ? 'আনব্লক করুন' : 'ব্লক করুন'}
                          className={`p-2 rounded-lg transition ${u.isBlocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-orange-500 hover:bg-orange-50'}`}>
                          {u.isBlocked ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                        </button>
                        <button onClick={() => openExpiry(u)} title="মেয়াদ নির্ধারণ করুন" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Clock size={16} />
                        </button>
                        <button onClick={() => handleDelete(u)} title="মুছে ফেলুন" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400"><p className="text-lg">কোনো ইউজার পাওয়া যায়নি</p></div>
          )}
        </div>
      </div>

      {/* Block reason modal */}
      {blockTargetId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ShieldOff size={20} className="text-red-500" /> আইডি ব্লক করুন</h3>
              <button onClick={() => setBlockTargetId(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-sm font-medium text-gray-700">কারণ (ঐচ্ছিক)</label>
              <textarea value={blockReason} onChange={e => setBlockReason(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500"
                placeholder="যেমন: বকেয়া ফি, নিয়ম লঙ্ঘন..." />
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setBlockTargetId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">বাতিল</button>
              <button onClick={confirmBlock} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">ব্লক করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Expiry modal */}
      {expiryTargetId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Clock size={20} className="text-blue-600" /> আইডির মেয়াদ নির্ধারণ</h3>
              <button onClick={() => setExpiryTargetId(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-sm font-medium text-gray-700">এই তারিখ/সময়ের পর আইডি স্বয়ংক্রিয়ভাবে লগইন বন্ধ হয়ে যাবে</label>
              <input type="datetime-local" value={expiryValue} onChange={e => setExpiryValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 flex items-center gap-1"><AlertTriangle size={12} /> খালি রাখলে মেয়াদ অসীম থাকবে</p>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={clearExpiry} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">মেয়াদ মুছুন</button>
              <button onClick={saveExpiry} className="flex-1 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
