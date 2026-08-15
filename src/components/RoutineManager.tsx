import { useState, useMemo } from 'react';
import { User, RoutinePeriod, ROUTINE_DAYS } from '../types';
import { getRoutines, saveRoutines, getClasses, getUsers, toBanglaNum } from '../data';
import { Plus, Trash2, X, Save, CalendarClock } from 'lucide-react';

interface Props {
  user: User;
}

export default function RoutineManager({ user }: Props) {
  const isTeacher = user.role === 'teacher';
  const allClasses = getClasses();
  const classes = isTeacher ? allClasses.filter(c => c.id === user.assignedClass) : allClasses;
  const teachers = getUsers().filter(u => u.role === 'teacher');
  const [routines, setRoutines] = useState<RoutinePeriod[]>(getRoutines());
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [section, setSection] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    day: ROUTINE_DAYS[0] as string, period: '1', subjectName: '', teacherId: '', startTime: '', endTime: '',
  });

  const sections = allClasses.find(c => c.id === classId)?.sections || [];

  const filtered = useMemo(() => {
    return routines
      .filter(r => r.classId === classId && (!section || r.section === section))
      .sort((a, b) => ROUTINE_DAYS.indexOf(a.day as any) - ROUTINE_DAYS.indexOf(b.day as any) || a.period - b.period);
  }, [routines, classId, section]);

  const teacherName = (id?: string) => id ? (teachers.find(t => t.id === id)?.name || 'অজানা') : '—';

  const openAdd = () => {
    setForm({ day: ROUTINE_DAYS[0], period: '1', subjectName: '', teacherId: '', startTime: '', endTime: '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!classId || !section || !form.subjectName || !form.startTime || !form.endTime) { alert('সব প্রয়োজনীয় তথ্য পূরণ করুন!'); return; }
    const newPeriod: RoutinePeriod = {
      id: `rt-${Date.now()}`,
      classId, section, day: form.day as any, period: Number(form.period) || 1,
      subjectName: form.subjectName, teacherId: form.teacherId || undefined,
      startTime: form.startTime, endTime: form.endTime,
    };
    const updated = [...routines, newPeriod];
    saveRoutines(updated);
    setRoutines(updated);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই পিরিয়ডটি মুছে ফেলতে চান?')) return;
    const updated = routines.filter(r => r.id !== id);
    saveRoutines(updated);
    setRoutines(updated);
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm">
        <CalendarClock size={48} className="mx-auto text-gray-300 mb-4" />
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
            <option value="">সেকশন নির্বাচন করুন</option>
            {sections.map(s => <option key={s} value={s}>সেকশন {s}</option>)}
          </select>
        </div>
        <button onClick={openAdd} disabled={!section}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition disabled:opacity-40">
          <Plus size={18} /> নতুন পিরিয়ড
        </button>
      </div>

      {!section ? (
        <p className="text-center text-gray-400 py-10">রুটিন দেখতে একটি সেকশন নির্বাচন করুন</p>
      ) : (
        <div className="grid gap-3">
          {ROUTINE_DAYS.map(day => {
            const dayPeriods = filtered.filter(r => r.day === day);
            if (dayPeriods.length === 0) return null;
            return (
              <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2 font-semibold text-indigo-800 text-sm">{day}</div>
                <div className="divide-y">
                  {dayPeriods.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">{toBanglaNum(p.period)}</span>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{p.subjectName}</p>
                          <p className="text-xs text-gray-500">{p.startTime} - {p.endTime} • {teacherName(p.teacherId)}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-gray-400 py-10">কোনো পিরিয়ড যোগ করা হয়নি</p>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">নতুন পিরিয়ড যোগ করুন</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বার *</label>
                <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  {ROUTINE_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পিরিয়ড নম্বর *</label>
                <input type="number" min={1} value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">সাবজেক্ট *</label>
                <input type="text" value={form.subjectName} onChange={e => setForm({ ...form, subjectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: গণিত" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষক</label>
                <select value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="">নির্বাচন করুন</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শুরু *</label>
                  <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শেষ *</label>
                  <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
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
