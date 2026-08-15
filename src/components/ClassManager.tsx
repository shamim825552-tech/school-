import { useState } from 'react';
import { ClassInfo } from '../types';
import { getClasses, saveClasses, getUsers, getStudents, toBanglaNum } from '../data';
import { Plus, Edit2, Trash2, X, Save, BookOpen, Users, GraduationCap } from 'lucide-react';

export default function ClassManager() {
  const [classes, setClasses] = useState<ClassInfo[]>(getClasses());
  const users = getUsers();
  const students = getStudents();
  const teachers = users.filter(u => u.role === 'teacher');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClassInfo | null>(null);
  const [form, setForm] = useState({ name: '', sections: '', assignedTeacherId: '' });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', sections: '', assignedTeacherId: '' });
    setShowForm(true);
  };

  const openEdit = (cls: ClassInfo) => {
    setEditing(cls);
    setForm({ name: cls.name, sections: cls.sections.join(', '), assignedTeacherId: cls.assignedTeacherId || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.sections) { alert('সব তথ্য পূরণ করুন!'); return; }
    const sections = form.sections.split(',').map(s => s.trim()).filter(Boolean);
    let updated: ClassInfo[];
    if (editing) {
      updated = classes.map(c =>
        c.id === editing.id
          ? { ...c, name: form.name, sections, assignedTeacherId: form.assignedTeacherId }
          : c
      );
    } else {
      const newClass: ClassInfo = {
        id: `class-${Date.now()}`,
        name: form.name,
        sections,
        assignedTeacherId: form.assignedTeacherId,
      };
      updated = [...classes, newClass];
    }
    saveClasses(updated);
    setClasses(updated);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('আপনি কি এই ক্লাস মুছে ফেলতে চান?')) return;
    const updated = classes.filter(c => c.id !== id);
    saveClasses(updated);
    setClasses(updated);
  };

  const getTeacherName = (id?: string) => {
    if (!id) return 'নির্ধারিত নয়';
    return teachers.find(t => t.id === id)?.name || 'অজানা';
  };

  const getStudentCount = (classId: string) => students.filter(s => s.classId === classId).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">ক্লাস ও সেকশন ব্যবস্থাপনা</h3>
          <p className="text-sm text-gray-500">মোট: {toBanglaNum(classes.length)} টি ক্লাস</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Plus size={18} /> নতুন ক্লাস যোগ করুন
        </button>
      </div>

      {/* Class Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen size={24} />
                  <h4 className="font-bold text-lg">{cls.name}</h4>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(cls)} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cls.id)} className="p-1.5 bg-white/20 rounded-lg hover:bg-red-500/50 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Users size={16} className="text-blue-600" />
                <span className="text-gray-600">শিক্ষার্থী: <strong>{toBanglaNum(getStudentCount(cls.id))}</strong> জন</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap size={16} className="text-green-600" />
                <span className="text-gray-600">শিক্ষক: <strong>{getTeacherName(cls.assignedTeacherId)}</strong></span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {cls.sections.map(s => (
                  <span key={s} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    সেকশন {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                {editing ? 'ক্লাস সম্পাদনা' : 'নতুন ক্লাস যোগ করুন'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ক্লাসের নাম *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="যেমন: ষষ্ঠ শ্রেণি" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">সেকশনসমূহ * (কমা দিয়ে আলাদা)</label>
                <input type="text" value={form.sections} onChange={e => setForm({...form, sections: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="যেমন: ক, খ, গ" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">দায়িত্বপ্রাপ্ত শিক্ষক</label>
                <select value={form.assignedTeacherId} onChange={e => setForm({...form, assignedTeacherId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">নির্বাচন করুন</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
