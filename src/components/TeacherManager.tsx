import { useState } from 'react';
import { User } from '../types';
import { getUsers, saveUsers, getClasses, toBanglaNum } from '../data';
import { Plus, Edit2, Trash2, X, Save, UserPlus } from 'lucide-react';

export default function TeacherManager() {
  const [users, setUsers] = useState<User[]>(getUsers());
  const classes = getClasses();
  const teachers = users.filter(u => u.role === 'teacher');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '', assignedClass: '', assignedSection: '' });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', password: 'teacher123', assignedClass: '', assignedSection: '' });
    setShowForm(true);
  };

  const openEdit = (teacher: User) => {
    setEditing(teacher);
    setForm({
      name: teacher.name,
      phone: teacher.phone,
      password: teacher.password,
      assignedClass: teacher.assignedClass || '',
      assignedSection: teacher.assignedSection || '',
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.password) { alert('সব তথ্য পূরণ করুন!'); return; }
    let updated: User[];
    if (editing) {
      updated = users.map(u =>
        u.id === editing.id
          ? { ...u, name: form.name, phone: form.phone, password: form.password, assignedClass: form.assignedClass, assignedSection: form.assignedSection }
          : u
      );
    } else {
      const newTeacher: User = {
        id: `teacher-${Date.now()}`,
        name: form.name,
        phone: form.phone,
        password: form.password,
        role: 'teacher',
        assignedClass: form.assignedClass,
        assignedSection: form.assignedSection,
      };
      updated = [...users, newTeacher];
    }
    saveUsers(updated);
    setUsers(updated);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('আপনি কি এই শিক্ষক মুছে ফেলতে চান?')) return;
    const updated = users.filter(u => u.id !== id);
    saveUsers(updated);
    setUsers(updated);
  };

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || '-';
  const sections = form.assignedClass ? classes.find(c => c.id === form.assignedClass)?.sections || [] : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">শিক্ষক তালিকা</h3>
          <p className="text-sm text-gray-500">মোট: {toBanglaNum(teachers.length)} জন শিক্ষক</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <UserPlus size={18} /> নতুন শিক্ষক যোগ করুন
        </button>
      </div>

      {/* Teacher Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  {teacher.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{teacher.name}</h4>
                  <p className="text-xs text-gray-500">{teacher.phone}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(teacher)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(teacher.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">নির্ধারিত শ্রেণি:</p>
              <p className="text-sm font-semibold text-gray-700">
                {teacher.assignedClass ? `${getClassName(teacher.assignedClass)} - সেকশন ${teacher.assignedSection || '-'}` : 'নির্ধারিত নয়'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {teachers.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          <p className="text-lg">কোনো শিক্ষক পাওয়া যায়নি</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editing ? <Edit2 size={20} /> : <Plus size={20} />}
                {editing ? 'শিক্ষক সম্পাদনা' : 'নতুন শিক্ষক যোগ করুন'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">নাম *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="শিক্ষকের নাম" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর *</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড *</label>
                  <input type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">নির্ধারিত শ্রেণি</label>
                  <select value={form.assignedClass} onChange={e => setForm({...form, assignedClass: e.target.value, assignedSection: ''})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">নির্বাচন করুন</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সেকশন</label>
                  <select value={form.assignedSection} onChange={e => setForm({...form, assignedSection: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">নির্বাচন করুন</option>
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
