import { useState } from 'react';
import { User, Complaint, ComplaintCategory } from '../types';
import { getComplaints, saveComplaints, getTodayStr, formatDate } from '../data';
import { MessageSquareWarning, Plus, X, Save } from 'lucide-react';

interface Props {
  user: User;
}

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  academic: 'একাডেমিক', behavior: 'আচরণ', facility: 'সুযোগ-সুবিধা',
  transport: 'পরিবহন', financial: 'আর্থিক', other: 'অন্যান্য',
};

export default function ComplaintBox({ user }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>(getComplaints());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'academic' as ComplaintCategory, subject: '', message: '' });

  const myComplaints = complaints
    .filter(c => c.submittedById === user.id)
    .sort((a, b) => b.timestamp - a.timestamp);

  const openForm = () => {
    setForm({ category: 'academic', subject: '', message: '' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.subject || !form.message) { alert('সব তথ্য পূরণ করুন!'); return; }
    const newComplaint: Complaint = {
      id: `complaint-${Date.now()}`, submittedById: user.id, submittedByName: user.name,
      submittedByRole: user.role, phone: user.phone, category: form.category, subject: form.subject,
      message: form.message, status: 'open', date: getTodayStr(), timestamp: Date.now(),
    };
    const updated = [...complaints, newComplaint];
    saveComplaints(updated);
    setComplaints(updated);
    setShowForm(false);
  };

  const statusBadge = (status: string) => {
    if (status === 'resolved') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">সমাধান হয়েছে</span>;
    if (status === 'in_progress') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">প্রক্রিয়াধীন</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">খোলা</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">অভিযোগ ও পরামর্শ</h3>
        <button onClick={openForm} className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Plus size={18} /> নতুন অভিযোগ/পরামর্শ
        </button>
      </div>

      <div className="space-y-3">
        {myComplaints.map(c => (
          <div key={c.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
            c.status === 'resolved' ? 'border-green-500' : c.status === 'in_progress' ? 'border-blue-400' : 'border-amber-400'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-800 text-sm">{c.subject}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{CATEGORY_LABELS[c.category]}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{c.message}</p>
                <p className="text-xs text-gray-400 mt-2">{formatDate(c.date)}</p>
                {c.adminReply && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                    <span className="font-medium text-gray-700">প্রশাসনের উত্তর: </span>{c.adminReply}
                  </div>
                )}
              </div>
              {statusBadge(c.status)}
            </div>
          </div>
        ))}
        {myComplaints.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <MessageSquareWarning size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-gray-400">কোনো অভিযোগ বা পরামর্শ নেই</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন অভিযোগ / পরামর্শ</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিষয়ের ধরন</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ComplaintCategory })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিষয় *</label>
                <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="সংক্ষিপ্ত বিষয়" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত *</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none" placeholder="বিস্তারিত লিখুন..." />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSubmit} className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> পাঠান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
