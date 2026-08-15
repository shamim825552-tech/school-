import { useState, useMemo } from 'react';
import { User, SchoolEvent, EventCategory } from '../types';
import { getEvents, saveEvents, formatDate, getTodayStr } from '../data';
import { CalendarDays, Plus, Trash2, X, Save } from 'lucide-react';

interface Props {
  user: User;
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  exam: 'পরীক্ষা', holiday: 'ছুটি', meeting: 'সভা', sports: 'ক্রীড়া', cultural: 'সাংস্কৃতিক', other: 'অন্যান্য',
};
const CATEGORY_COLORS: Record<EventCategory, string> = {
  exam: 'bg-red-100 text-red-700', holiday: 'bg-green-100 text-green-700', meeting: 'bg-blue-100 text-blue-700',
  sports: 'bg-orange-100 text-orange-700', cultural: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600',
};

export default function EventManager({ user }: Props) {
  const [events, setEvents] = useState<SchoolEvent[]>(getEvents());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: getTodayStr(), endDate: '', category: 'other' as EventCategory });

  const sorted = useMemo(() => [...events].sort((a, b) => a.date.localeCompare(b.date)), [events]);
  const today = getTodayStr();
  const upcoming = sorted.filter(e => (e.endDate || e.date) >= today);
  const past = sorted.filter(e => (e.endDate || e.date) < today);

  const openAdd = () => {
    setForm({ title: '', description: '', date: getTodayStr(), endDate: '', category: 'other' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.date) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const newEvent: SchoolEvent = {
      id: `event-${Date.now()}`, title: form.title, description: form.description || undefined,
      date: form.date, endDate: form.endDate || undefined, category: form.category,
      createdBy: user.name, timestamp: Date.now(),
    };
    const updated = [...events, newEvent];
    saveEvents(updated);
    setEvents(updated);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই ইভেন্টটি মুছে ফেলতে চান?')) return;
    const updated = events.filter(e => e.id !== id);
    saveEvents(updated);
    setEvents(updated);
  };

  const renderEvent = (e: SchoolEvent) => (
    <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex flex-col items-center justify-center shrink-0 text-indigo-600">
          <CalendarDays size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800 text-sm">{e.title}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[e.category]}`}>{CATEGORY_LABELS[e.category]}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{formatDate(e.date)}{e.endDate ? ` — ${formatDate(e.endDate)}` : ''}</p>
          {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
        </div>
      </div>
      <button onClick={() => handleDelete(e.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 shrink-0"><Trash2 size={14} /></button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">স্কুল ইভেন্ট ক্যালেন্ডার</h3>
        <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Plus size={18} /> নতুন ইভেন্ট
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase">আসন্ন</p>
        {upcoming.map(renderEvent)}
        {upcoming.length === 0 && <p className="text-sm text-gray-400 py-4">কোনো আসন্ন ইভেন্ট নেই</p>}
      </div>

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase">অতীত</p>
          {past.slice().reverse().map(e => (
            <div key={e.id} className="opacity-60">{renderEvent(e)}</div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন ইভেন্ট যোগ করুন</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ধরন</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as EventCategory })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">তারিখ *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শেষ তারিখ (ঐচ্ছিক)</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ (ঐচ্ছিক)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
