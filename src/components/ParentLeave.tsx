import { useState } from 'react';
import { User, LeaveApplication } from '../types';
import { getStudents, getLeaveApplications, saveLeaveApplications, getTodayStr, formatDate } from '../data';
import { CalendarOff, Plus, X, Save } from 'lucide-react';

interface Props {
  user: User;
}

export default function ParentLeave({ user }: Props) {
  const child = getStudents().find(s => s.id === user.childId);
  const [applications, setApplications] = useState<LeaveApplication[]>(getLeaveApplications());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromDate: getTodayStr(), toDate: getTodayStr(), reason: '' });

  const myApplications = child
    ? applications.filter(a => a.studentId === child.id).sort((a, b) => b.timestamp - a.timestamp)
    : [];

  if (!child) {
    return <div className="bg-white rounded-xl p-12 text-center"><p className="text-lg text-gray-400">শিক্ষার্থীর তথ্য পাওয়া যায়নি</p></div>;
  }

  const openForm = () => {
    setForm({ fromDate: getTodayStr(), toDate: getTodayStr(), reason: '' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.fromDate || !form.toDate || !form.reason) { alert('সব তথ্য পূরণ করুন!'); return; }
    if (form.toDate < form.fromDate) { alert('শেষ তারিখ শুরুর তারিখের আগে হতে পারবে না!'); return; }
    const newApp: LeaveApplication = {
      id: `leave-${Date.now()}`, studentId: child.id, fromDate: form.fromDate, toDate: form.toDate,
      reason: form.reason, appliedBy: user.id, status: 'pending', date: getTodayStr(), timestamp: Date.now(),
    };
    const updated = [...applications, newApp];
    saveLeaveApplications(updated);
    setApplications(updated);
    setShowForm(false);
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">অনুমোদিত</span>;
    if (status === 'rejected') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">প্রত্যাখ্যাত</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">অপেক্ষমাণ</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">ছুটির আবেদন</h3>
        <button onClick={openForm} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Plus size={18} /> নতুন আবেদন
        </button>
      </div>

      <div className="space-y-3">
        {myApplications.map(app => (
          <div key={app.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
            app.status === 'approved' ? 'border-green-500' : app.status === 'rejected' ? 'border-red-400' : 'border-amber-400'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{formatDate(app.fromDate)} — {formatDate(app.toDate)}</p>
                <p className="text-sm text-gray-600 mt-1">{app.reason}</p>
                {app.responseNote && <p className="text-xs text-gray-400 mt-2 italic">স্কুলের প্রতিক্রিয়া: {app.responseNote}</p>}
              </div>
              {statusBadge(app.status)}
            </div>
          </div>
        ))}
        {myApplications.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <CalendarOff size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-gray-400">কোনো ছুটির আবেদন নেই</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন ছুটির আবেদন</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শুরুর তারিখ *</label>
                  <input type="date" value={form.fromDate} onChange={e => setForm({ ...form, fromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শেষ তারিখ *</label>
                  <input type="date" value={form.toDate} onChange={e => setForm({ ...form, toDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ছুটির কারণ *</label>
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none" placeholder="কারণ লিখুন..." />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSubmit} className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> আবেদন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
