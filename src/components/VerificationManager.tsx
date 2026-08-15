import { useState } from 'react';
import { User, ParentVerification, VerificationStatus } from '../types';
import { getVerifications, saveVerifications } from '../data';
import {
  BadgeCheck, ShieldAlert, Clock3, Printer, Search, X, FileImage, IdCard,
} from 'lucide-react';

const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: 'পর্যালোচনাধীন', verified: 'ভেরিফাইড', rejected: 'প্রত্যাখ্যাত',
};
const STATUS_COLOR: Record<VerificationStatus, string> = {
  pending: 'bg-amber-100 text-amber-700', verified: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700',
};
const STATUS_ICON: Record<VerificationStatus, React.ReactNode> = {
  pending: <Clock3 size={13} />, verified: <BadgeCheck size={13} />, rejected: <ShieldAlert size={13} />,
};

interface Props {
  currentUser: User;
}

export default function VerificationManager({ currentUser }: Props) {
  const [items, setItems] = useState<ParentVerification[]>(getVerifications());
  const [filter, setFilter] = useState<'' | VerificationStatus>('');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<ParentVerification | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectFor, setShowRejectFor] = useState<ParentVerification | null>(null);
  const [printTarget, setPrintTarget] = useState<ParentVerification | null>(null);

  const refresh = (updated: ParentVerification[]) => {
    saveVerifications(updated);
    setItems(updated);
  };

  const filtered = items
    .filter(v => (filter ? v.status === filter : true))
    .filter(v => !search || v.parentName.includes(search) || v.parentPhone.includes(search) || (v.childName ?? '').includes(search))
    .sort((a, b) => b.submittedAt - a.submittedAt);

  const verify = (v: ParentVerification) => {
    const updated = items.map(x => x.id === v.id ? {
      ...x, status: 'verified' as VerificationStatus, verifiedBy: currentUser.id,
      verifiedByName: currentUser.name, verifiedAt: Date.now(), rejectionReason: undefined, updatedAt: Date.now(),
    } : x);
    refresh(updated);
    setActive(null);
  };

  const confirmReject = () => {
    if (!showRejectFor) return;
    const updated = items.map(x => x.id === showRejectFor.id ? {
      ...x, status: 'rejected' as VerificationStatus, verifiedBy: currentUser.id,
      verifiedByName: currentUser.name, verifiedAt: Date.now(),
      rejectionReason: rejectReason.trim() || 'তথ্য/ছবি সঠিক নয়', updatedAt: Date.now(),
    } : x);
    refresh(updated);
    setShowRejectFor(null);
    setActive(null);
    setRejectReason('');
  };

  const handlePrint = (v: ParentVerification) => {
    setPrintTarget(v);
    setTimeout(() => { window.print(); }, 100);
  };

  const counts = {
    pending: items.filter(v => v.status === 'pending').length,
    verified: items.filter(v => v.status === 'verified').length,
    rejected: items.filter(v => v.status === 'rejected').length,
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 print:hidden"><IdCard size={20} /> অভিভাবক ভেরিফিকেশন</h3>
        <p className="text-sm text-gray-500 print:hidden">অভিভাবকের NID ও সন্তানের জন্ম নিবন্ধন যাচাই করুন এবং ভেরিফাই ব্যাজ দিন</p>
      </div>

      <div className="grid grid-cols-3 gap-3 print:hidden">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.pending}</p>
          <p className="text-xs text-amber-600">পর্যালোচনাধীন</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{counts.verified}</p>
          <p className="text-xs text-emerald-600">ভেরিফাইড</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{counts.rejected}</p>
          <p className="text-xs text-red-600">প্রত্যাখ্যাত</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="অভিভাবক/সন্তানের নাম বা ফোন দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value as '' | VerificationStatus)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">সকল স্ট্যাটাস</option>
            <option value="pending">পর্যালোচনাধীন</option>
            <option value="verified">ভেরিফাইড</option>
            <option value="rejected">প্রত্যাখ্যাত</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 print:hidden">
        {filtered.map(v => (
          <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{v.parentName}</p>
                <p className="text-xs text-gray-500">{v.parentPhone} {v.childName ? `· সন্তান: ${v.childName}` : ''}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[v.status]}`}>
                {STATUS_ICON[v.status]} {STATUS_LABEL[v.status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="border border-gray-100 rounded-lg p-2 text-center">
                {v.nidImage ? <img src={v.nidImage} className="h-16 w-full object-cover rounded-md mb-1" /> : <div className="h-16 flex items-center justify-center text-gray-300"><FileImage size={20} /></div>}
                <p className="text-[10px] text-gray-500">NID {v.nidNumber ? `· ${v.nidNumber}` : ''}</p>
              </div>
              <div className="border border-gray-100 rounded-lg p-2 text-center">
                {v.birthRegImage ? <img src={v.birthRegImage} className="h-16 w-full object-cover rounded-md mb-1" /> : <div className="h-16 flex items-center justify-center text-gray-300"><FileImage size={20} /></div>}
                <p className="text-[10px] text-gray-500">জন্ম নিবন্ধন {v.birthRegNumber ? `· ${v.birthRegNumber}` : ''}</p>
              </div>
            </div>
            {v.status === 'rejected' && v.rejectionReason && (
              <p className="text-xs text-red-500 mt-2">কারণ: {v.rejectionReason}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setActive(v)} className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">বিস্তারিত দেখুন</button>
              <button onClick={() => handlePrint(v)} className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50" title="প্রিন্ট"><Printer size={15} /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400"><p>কোনো আবেদন পাওয়া যায়নি</p></div>
        )}
      </div>

      {/* Detail modal */}
      {active && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">{active.parentName}</h3>
              <button onClick={() => setActive(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">NID কার্ড — {active.nidNumber || 'নম্বর দেওয়া হয়নি'}</p>
                {active.nidImage ? <img src={active.nidImage} className="w-full rounded-lg border" /> : <p className="text-sm text-gray-400">ছবি নেই</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">সন্তানের জন্ম নিবন্ধন — {active.birthRegNumber || 'নম্বর দেওয়া হয়নি'}</p>
                {active.birthRegImage ? <img src={active.birthRegImage} className="w-full rounded-lg border" /> : <p className="text-sm text-gray-400">ছবি নেই</p>}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowRejectFor(active)} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">প্রত্যাখ্যান করুন</button>
              <button onClick={() => verify(active)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                <BadgeCheck size={16} /> ভেরিফাই করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {showRejectFor && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b"><h3 className="font-bold text-gray-800">প্রত্যাখ্যানের কারণ</h3></div>
            <div className="p-5">
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="যেমন: ছবি অস্পষ্ট, তথ্য মিলছে না..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowRejectFor(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">বাতিল</button>
              <button onClick={confirmReject} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">প্রত্যাখ্যান করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* প্রিন্টযোগ্য এলাকা */}
      {printTarget && (
        <div className="hidden print:block">
          <div className="p-6 space-y-6">
            <div className="text-center border-b pb-3">
              <img src="/images/logo.png" className="w-14 h-14 object-cover rounded-full mx-auto mb-2" />
              <h1 className="text-xl font-bold">ভোলাচং উচ্চ বিদ্যালয়</h1>
              <p className="text-sm text-gray-500">অভিভাবক পরিচয় যাচাই কপি</p>
            </div>
            <div>
              <p className="text-sm font-semibold">অভিভাবক: {printTarget.parentName} ({printTarget.parentPhone})</p>
              {printTarget.childName && <p className="text-sm">সন্তান: {printTarget.childName}</p>}
              <p className="text-sm">স্ট্যাটাস: {STATUS_LABEL[printTarget.status]}</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold mb-2">জাতীয় পরিচয়পত্র (NID) {printTarget.nidNumber ? `— ${printTarget.nidNumber}` : ''}</p>
                {printTarget.nidImage && <img src={printTarget.nidImage} className="w-full border rounded" />}
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">জন্ম নিবন্ধন {printTarget.birthRegNumber ? `— ${printTarget.birthRegNumber}` : ''}</p>
                {printTarget.birthRegImage && <img src={printTarget.birthRegImage} className="w-full border rounded" />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
