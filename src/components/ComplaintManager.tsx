import { useState, useMemo } from 'react';
import { User, Complaint, ComplaintCategory, ComplaintStatus } from '../types';
import { getComplaints, saveComplaints, formatDate } from '../data';
import { MessageSquareWarning, Search, Reply, CheckCircle2 } from 'lucide-react';

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  academic: 'একাডেমিক', behavior: 'আচরণ', facility: 'সুযোগ-সুবিধা',
  transport: 'পরিবহন', financial: 'আর্থিক', other: 'অন্যান্য',
};
const ROLE_LABELS: Record<string, string> = { admin: 'অ্যাডমিন', teacher: 'শিক্ষক', parent: 'অভিভাবক' };

export default function ComplaintManager() {
  const [complaints, setComplaints] = useState<Complaint[]>(getComplaints());
  const [filter, setFilter] = useState<ComplaintStatus | 'all'>('open');
  const [search, setSearch] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const visible = useMemo(() => {
    let list = complaints;
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (search) list = list.filter(c => c.subject.toLowerCase().includes(search.toLowerCase()) || c.submittedByName.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a, b) => b.timestamp - a.timestamp);
  }, [complaints, filter, search]);

  const openReply = (c: Complaint) => {
    setReplyingId(c.id);
    setReply(c.adminReply || '');
  };

  const submitReply = (c: Complaint, status: ComplaintStatus) => {
    const updated = complaints.map(item => item.id === c.id ? { ...item, adminReply: reply || item.adminReply, status } : item);
    saveComplaints(updated);
    setComplaints(updated);
    setReplyingId(null);
    setReply('');
  };

  const statusBadge = (status: string) => {
    if (status === 'resolved') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">সমাধান হয়েছে</span>;
    if (status === 'in_progress') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">প্রক্রিয়াধীন</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">খোলা</span>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 bg-gray-50 p-1 rounded-lg">
          {(['open', 'in_progress', 'resolved', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filter === f ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
              {f === 'open' ? 'খোলা' : f === 'in_progress' ? 'প্রক্রিয়াধীন' : f === 'resolved' ? 'সমাধান' : 'সব'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
        </div>
      </div>

      <div className="space-y-3">
        {visible.map(c => (
          <div key={c.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
            c.status === 'resolved' ? 'border-green-500' : c.status === 'in_progress' ? 'border-blue-400' : 'border-amber-400'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 text-sm">{c.subject}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{CATEGORY_LABELS[c.category]}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{c.submittedByName} ({ROLE_LABELS[c.submittedByRole]}){c.phone ? ` · ${c.phone}` : ''} · {formatDate(c.date)}</p>
                <p className="text-sm text-gray-600 mt-2">{c.message}</p>
                {c.adminReply && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                    <span className="font-medium text-gray-700">প্রশাসনের উত্তর: </span>{c.adminReply}
                  </div>
                )}
                {replyingId === c.id && (
                  <div className="mt-3 space-y-2">
                    <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none" placeholder="উত্তর লিখুন..." />
                    <div className="flex gap-2">
                      <button onClick={() => submitReply(c, 'in_progress')} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">প্রক্রিয়াধীন হিসেবে চিহ্নিত করুন</button>
                      <button onClick={() => submitReply(c, 'resolved')} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">সমাধান হয়েছে</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                {statusBadge(c.status)}
                {c.status !== 'resolved' && replyingId !== c.id && (
                  <button onClick={() => openReply(c)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700">
                    <Reply size={14} /> উত্তর দিন
                  </button>
                )}
                {c.status === 'resolved' && <CheckCircle2 size={20} className="text-green-500" />}
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <MessageSquareWarning size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-gray-400">কোনো অভিযোগ বা পরামর্শ পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}
