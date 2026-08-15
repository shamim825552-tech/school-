import { useState, useMemo } from 'react';
import { User, Announcement, AnnouncementAudience } from '../types';
import { getAnnouncements, saveAnnouncements, getClasses, formatDate } from '../data';
import { Plus, Trash2, X, Save, Megaphone, Pin, Users, GraduationCap } from 'lucide-react';

interface Props {
  user: User;
}

const audienceLabel: Record<AnnouncementAudience, string> = {
  all: 'সবার জন্য',
  teacher: 'শুধু শিক্ষক',
  parent: 'শুধু অভিভাবক',
};

export default function AnnouncementBoard({ user }: Props) {
  const isAdmin = user.role === 'admin';
  const classes = getClasses();
  const [items, setItems] = useState<Announcement[]>(getAnnouncements());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', message: '', audience: 'all' as AnnouncementAudience, classId: '', pinned: false,
  });

  const visible = useMemo(() => {
    let list = items;
    if (user.role === 'teacher') {
      list = list.filter(a => a.audience === 'all' || a.audience === 'teacher');
    } else if (user.role === 'parent') {
      list = list.filter(a => a.audience === 'all' || a.audience === 'parent');
    }
    return [...list].sort((a, b) => (b.pinned === a.pinned ? b.timestamp - a.timestamp : b.pinned ? 1 : -1));
  }, [items, user.role]);

  const openAdd = () => {
    setForm({ title: '', message: '', audience: 'all', classId: '', pinned: false });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.message) { alert('শিরোনাম ও বার্তা লিখুন!'); return; }
    const now = new Date();
    const newItem: Announcement = {
      id: `ann-${Date.now()}`,
      title: form.title,
      message: form.message,
      audience: form.audience,
      classId: form.classId || undefined,
      pinned: form.pinned,
      createdBy: user.name,
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
    };
    const updated = [newItem, ...items];
    saveAnnouncements(updated);
    setItems(updated);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই নোটিশটি মুছে ফেলতে চান?')) return;
    const updated = items.filter(a => a.id !== id);
    saveAnnouncements(updated);
    setItems(updated);
  };

  const className = (id?: string) => classes.find(c => c.id === id)?.name;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
            <Plus size={18} /> নতুন নোটিশ
          </button>
        </div>
      )}

      <div className="space-y-3">
        {visible.map(a => (
          <div key={a.id} className={`bg-white rounded-xl p-4 shadow-sm border ${a.pinned ? 'border-sky-300 ring-1 ring-sky-100' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                  <Megaphone size={18} className="text-sky-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin size={13} className="text-sky-600" />}
                    <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{a.message}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-2">
                    <span>{formatDate(a.date)}</span>
                    <span>•</span>
                    <span>{a.createdBy}</span>
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                      {a.audience === 'teacher' ? <GraduationCap size={11} /> : <Users size={11} />}
                      {audienceLabel[a.audience]}
                    </span>
                    {className(a.classId) && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{className(a.classId)}</span>
                    )}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Megaphone size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">কোনো নোটিশ নেই</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন নোটিশ</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: বার্ষিক ক্রীড়া প্রতিযোগিতা" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বার্তা *</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">কাদের জন্য</label>
                  <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as AnnouncementAudience })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                    <option value="all">সবার জন্য</option>
                    <option value="teacher">শুধু শিক্ষক</option>
                    <option value="parent">শুধু অভিভাবক</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নির্দিষ্ট ক্লাস (ঐচ্ছিক)</label>
                  <select value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                    <option value="">সব ক্লাস</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} />
                শীর্ষে পিন করুন
              </label>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> প্রকাশ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
