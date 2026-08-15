import { useState, useMemo } from 'react';
import { User, Homework } from '../types';
import { getHomeworks, saveHomeworks, getClasses, toBanglaNum, formatDate } from '../data';
import { Plus, Trash2, X, Save, NotebookPen, CalendarDays } from 'lucide-react';

interface Props {
  user: User;
}

export default function HomeworkManager({ user }: Props) {
  const isTeacher = user.role === 'teacher';
  const allClasses = getClasses();
  const classes = isTeacher ? allClasses.filter(c => c.id === user.assignedClass) : allClasses;
  const [homeworks, setHomeworks] = useState<Homework[]>(getHomeworks());
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [section, setSection] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    subjectName: '', title: '', description: '', assignedDate: new Date().toISOString().split('T')[0], dueDate: '',
  });

  const sections = allClasses.find(c => c.id === classId)?.sections || [];

  const filtered = useMemo(() => {
    return homeworks
      .filter(h => h.classId === classId && (!section || h.section === section))
      .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
  }, [homeworks, classId, section]);

  const openAdd = () => {
    setForm({ subjectName: '', title: '', description: '', assignedDate: new Date().toISOString().split('T')[0], dueDate: '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!classId || !section || !form.subjectName || !form.title || !form.dueDate) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const newHw: Homework = {
      id: `hw-${Date.now()}`,
      classId, section, subjectName: form.subjectName, title: form.title, description: form.description,
      assignedDate: form.assignedDate, dueDate: form.dueDate, teacherId: user.id,
    };
    const updated = [...homeworks, newHw];
    saveHomeworks(updated);
    setHomeworks(updated);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই হোমওয়ার্কটি মুছে ফেলতে চান?')) return;
    const updated = homeworks.filter(h => h.id !== id);
    saveHomeworks(updated);
    setHomeworks(updated);
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm">
        <NotebookPen size={48} className="mx-auto text-gray-300 mb-4" />
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
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Plus size={18} /> নতুন হোমওয়ার্ক
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map(hw => (
          <div key={hw.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                  <NotebookPen size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{hw.title}</p>
                  <p className="text-xs text-gray-500">{hw.subjectName} • সেকশন {hw.section}</p>
                  {hw.description && <p className="text-sm text-gray-600 mt-1">{hw.description}</p>}
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <CalendarDays size={12} />
                    <span>জমার শেষ তারিখ: {formatDate(hw.dueDate)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(hw.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 shrink-0"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-gray-400 py-10">কোনো হোমওয়ার্ক পাওয়া যায়নি</p>}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন হোমওয়ার্ক</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {!section && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs">
                  উপরে একটি সেকশন নির্বাচন করে নিন, তারপর হোমওয়ার্ক যোগ করুন।
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">সাবজেক্ট *</label>
                <input type="text" value={form.subjectName} onChange={e => setForm({ ...form, subjectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: ইংরেজি" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: ৫ম অধ্যায়ের অনুশীলনী" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিস্তারিত</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">প্রদানের তারিখ</label>
                  <input type="date" value={form.assignedDate} onChange={e => setForm({ ...form, assignedDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">জমার শেষ তারিখ *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} disabled={!section} className="flex-1 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-40">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
