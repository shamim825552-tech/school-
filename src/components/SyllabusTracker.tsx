import { useState, useMemo } from 'react';
import { User, SyllabusItem, SyllabusStatus } from '../types';
import { getSyllabus, saveSyllabus, getClasses, getTodayStr } from '../data';
import { Plus, Trash2, X, Save, ListChecks, CheckCircle2, CircleDot, Circle } from 'lucide-react';

interface Props {
  user: User;
}

const statusLabel: Record<SyllabusStatus, string> = { pending: 'বাকি আছে', in_progress: 'চলমান', completed: 'সম্পন্ন' };
const statusColor: Record<SyllabusStatus, string> = {
  pending: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};
const statusIcon: Record<SyllabusStatus, React.ReactNode> = {
  pending: <Circle size={14} />, in_progress: <CircleDot size={14} />, completed: <CheckCircle2 size={14} />,
};

export default function SyllabusTracker({ user }: Props) {
  const isTeacher = user.role === 'teacher';
  const allClasses = getClasses();
  const classes = isTeacher ? allClasses.filter(c => c.id === user.assignedClass) : allClasses;
  const [items, setItems] = useState<SyllabusItem[]>(getSyllabus());
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [section, setSection] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subjectName: '', topic: '' });

  const sections = allClasses.find(c => c.id === classId)?.sections || [];

  const filtered = useMemo(() => {
    return items.filter(i => i.classId === classId && (!section || i.section === section));
  }, [items, classId, section]);

  const progress = useMemo(() => {
    if (filtered.length === 0) return 0;
    const done = filtered.filter(i => i.status === 'completed').length;
    return Math.round((done / filtered.length) * 100);
  }, [filtered]);

  const openAdd = () => {
    setForm({ subjectName: '', topic: '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!classId || !section || !form.subjectName || !form.topic) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const newItem: SyllabusItem = {
      id: `syl-${Date.now()}`, classId, section, subjectName: form.subjectName, topic: form.topic,
      status: 'pending', teacherId: user.id, updatedDate: getTodayStr(),
    };
    const updated = [...items, newItem];
    saveSyllabus(updated);
    setItems(updated);
    setShowForm(false);
  };

  const cycleStatus = (item: SyllabusItem) => {
    const next: Record<SyllabusStatus, SyllabusStatus> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
    const updated = items.map(i => i.id === item.id ? { ...i, status: next[i.status], updatedDate: getTodayStr() } : i);
    saveSyllabus(updated);
    setItems(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই বিষয়টি মুছে ফেলতে চান?')) return;
    const updated = items.filter(i => i.id !== id);
    saveSyllabus(updated);
    setItems(updated);
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm">
        <ListChecks size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-400">কোনো ক্লাস পাওয়া যায়নি</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {!isTeacher && (
            <select value={classId} onChange={e => { setClassId(e.target.value); setSection(''); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <select value={section} onChange={e => setSection(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">সব সেকশন</option>
            {sections.map(s => <option key={s} value={s}>সেকশন {s}</option>)}
          </select>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Plus size={18} /> নতুন টপিক
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 font-medium">সিলেবাস অগ্রগতি</span>
            <span className="text-teal-700 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-teal-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => cycleStatus(item)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 ${statusColor[item.status]}`}>
                {statusIcon[item.status]} {statusLabel[item.status]}
              </button>
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{item.topic}</p>
                <p className="text-xs text-gray-500">{item.subjectName} • সেকশন {item.section}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 shrink-0"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-gray-400 py-10">কোনো সিলেবাস টপিক যোগ করা হয়নি</p>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন সিলেবাস টপিক</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {!section && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs">
                  উপরে একটি সেকশন নির্বাচন করে নিন, তারপর টপিক যোগ করুন।
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">সাবজেক্ট *</label>
                <input type="text" value={form.subjectName} onChange={e => setForm({ ...form, subjectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: গণিত" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">টপিক / অধ্যায় *</label>
                <input type="text" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: ৩য় অধ্যায় - বীজগণিত" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} disabled={!section} className="flex-1 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-40">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
