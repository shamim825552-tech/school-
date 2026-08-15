import { useRef, useState } from 'react';
import { Student, User } from '../types';
import { getStudents, saveStudents, getClasses, getUsers, saveUsers, toBanglaNum } from '../data';
import { Plus, Edit2, Trash2, Search, X, Save, UserPlus, Eye, EyeOff, KeyRound, RotateCcw, Camera, IdCard } from 'lucide-react';
import { fileToResizedDataUrl } from '../utils/imageFile';

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>(getStudents());
  const [users, setUsers] = useState<User[]>(getUsers());
  const classes = getClasses();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [visiblePasswordId, setVisiblePasswordId] = useState<string | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', roll: '', classId: '', section: '', parentName: '', parentPhone: '', password: '',
    photo: '', studentIdNo: '', bloodGroup: '', dateOfBirth: '', address: '',
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const getLinkedParent = (studentId: string) => users.find(u => u.role === 'parent' && u.childId === studentId);

  const filtered = students.filter(s => {
    if (search && !s.name.includes(search) && !s.parentName.includes(search)) return false;
    if (filterClass && s.classId !== filterClass) return false;
    if (filterSection && s.section !== filterSection) return false;
    return true;
  });

  const availableSections = filterClass
    ? classes.find(c => c.id === filterClass)?.sections || []
    : [];

  const formSections = form.classId
    ? classes.find(c => c.id === form.classId)?.sections || []
    : [];

  const openAdd = () => {
    setEditingStudent(null);
    setForm({
      name: '', roll: '', classId: '', section: '', parentName: '', parentPhone: '', password: '',
      photo: '', studentIdNo: '', bloodGroup: '', dateOfBirth: '', address: '',
    });
    setShowFormPassword(false);
    setShowForm(true);
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    const linkedParent = getLinkedParent(student.id);
    setForm({
      name: student.name,
      roll: String(student.roll),
      classId: student.classId,
      section: student.section,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      password: linkedParent?.password || '',
      photo: student.photo || '',
      studentIdNo: student.studentIdNo || '',
      bloodGroup: student.bloodGroup || '',
      dateOfBirth: student.dateOfBirth || '',
      address: student.address || '',
    });
    setShowFormPassword(false);
    setShowForm(true);
  };

  const handlePhotoChange = async (file: File) => {
    setPhotoUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file, 500, 0.85);
      setForm(f => ({ ...f, photo: dataUrl }));
    } catch {
      alert('ছবি আপলোড করা যায়নি।');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.name || !form.roll || !form.classId || !form.section || !form.parentName || !form.parentPhone) {
      alert('সব তথ্য পূরণ করুন!');
      return;
    }
    const currentUsers = getUsers();
    let updatedUsers = currentUsers;
    let updatedStudents: Student[];
    const autoIdNo = (roll: string, classId: string) => `VHS-${classId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${roll.padStart(3, '0')}`;

    if (editingStudent) {
      updatedStudents = students.map(s =>
        s.id === editingStudent.id
          ? {
              ...s, name: form.name, roll: parseInt(form.roll), classId: form.classId, section: form.section,
              parentName: form.parentName, parentPhone: form.parentPhone,
              photo: form.photo || s.photo,
              studentIdNo: form.studentIdNo.trim() || s.studentIdNo || autoIdNo(form.roll, form.classId),
              bloodGroup: form.bloodGroup.trim() || undefined,
              dateOfBirth: form.dateOfBirth.trim() || undefined,
              address: form.address.trim() || undefined,
              cardUpdatedAt: Date.now(),
            }
          : s
      );
      // ইতিমধ্যে লিংক করা অভিভাবক অ্যাকাউন্ট থাকলে নাম/ফোন/পাসওয়ার্ড আপডেট করা হচ্ছে
      // অ্যাডমিন এখানে পাসওয়ার্ড পরিবর্তন করলে তা সরাসরি সংরক্ষণ হয়; অভিভাবক
      // নিজে পাসওয়ার্ড পরিবর্তন করলেও এই একই ফিল্ড আপডেট হয়, তাই অ্যাডমিন সবসময়
      // অভিভাবকের সর্বশেষ পাসওয়ার্ড এখানে দেখতে ও প্রয়োজনে বদলাতে পারবেন।
      const linkedParent = currentUsers.find(u => u.role === 'parent' && u.childId === editingStudent.id);
      if (linkedParent) {
        updatedUsers = currentUsers.map(u =>
          u.id === linkedParent.id
            ? { ...u, name: form.parentName, phone: form.parentPhone, password: form.password.trim() || u.password }
            : u
        );
      } else {
        const duplicate = currentUsers.find(u => u.role === 'parent' && u.phone === form.parentPhone);
        if (!duplicate) {
          const newParentUser: User = {
            id: `parent-${Date.now()}`,
            name: form.parentName,
            role: 'parent',
            phone: form.parentPhone,
            password: form.password.trim() || form.parentPhone, // অ্যাডমিন দিলে সেটাই, না দিলে ডিফল্ট = ফোন নম্বর
            childId: editingStudent.id,
          };
          updatedUsers = [...currentUsers, newParentUser];
        }
      }
    } else {
      const newStudent: Student = {
        id: `student-${Date.now()}`,
        name: form.name,
        roll: parseInt(form.roll),
        classId: form.classId,
        section: form.section,
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        photo: form.photo || undefined,
        studentIdNo: form.studentIdNo.trim() || autoIdNo(form.roll, form.classId),
        bloodGroup: form.bloodGroup.trim() || undefined,
        dateOfBirth: form.dateOfBirth.trim() || undefined,
        address: form.address.trim() || undefined,
        cardUpdatedAt: Date.now(),
      };
      updatedStudents = [...students, newStudent];
      // নতুন শিক্ষার্থীর জন্য অভিভাবক লগইন অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে তৈরি
      const duplicate = currentUsers.find(u => u.role === 'parent' && u.phone === form.parentPhone);
      if (!duplicate) {
        const newParentUser: User = {
          id: `parent-${Date.now()}`,
          name: form.parentName,
          role: 'parent',
          phone: form.parentPhone,
          password: form.password.trim() || form.parentPhone, // অ্যাডমিন দিলে সেটাই, না দিলে ডিফল্ট = ফোন নম্বর
          childId: newStudent.id,
        };
        updatedUsers = [...currentUsers, newParentUser];
      }
    }

    saveStudents(updatedStudents);
    setStudents(updatedStudents);
    if (updatedUsers !== currentUsers) {
      saveUsers(updatedUsers);
      setUsers(updatedUsers);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('আপনি কি এই শিক্ষার্থী মুছে ফেলতে চান?')) return;
    const updated = students.filter(s => s.id !== id);
    saveStudents(updated);
    setStudents(updated);
    // শিক্ষার্থীর সাথে লিংক করা অভিভাবক অ্যাকাউন্টও মুছে ফেলা হচ্ছে
    const currentUsers = getUsers();
    const linkedParent = currentUsers.find(u => u.role === 'parent' && u.childId === id);
    if (linkedParent) {
      const updatedUsers = currentUsers.filter(u => u.id !== linkedParent.id);
      saveUsers(updatedUsers);
      setUsers(updatedUsers);
    }
  };

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || classId;

  const handleResetAllPasswords = () => {
    if (!confirm('সব অভিভাবকের পাসওয়ার্ড তাদের ফোন নম্বরে রিসেট করতে চান? এটি বাতিল করা যাবে না।')) return;
    const currentUsers = getUsers();
    const updated = currentUsers.map(u => (u.role === 'parent' ? { ...u, password: u.phone } : u));
    saveUsers(updated);
    setUsers(updated);
    alert('সকল অভিভাবকের পাসওয়ার্ড তাদের ফোন নম্বরে রিসেট করা হয়েছে।');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">শিক্ষার্থী তালিকা</h3>
          <p className="text-sm text-gray-500">মোট: {toBanglaNum(students.length)} জন শিক্ষার্থী</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleResetAllPasswords} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            <RotateCcw size={16} /> সব পাসওয়ার্ড রিসেট
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
            <UserPlus size={18} /> নতুন শিক্ষার্থী যোগ করুন
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="নাম বা অভিভাবকের নামে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>
          <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSection(''); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
            <option value="">সকল শ্রেণি</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {availableSections.length > 0 && (
            <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
              <option value="">সকল সেকশন</option>
              {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-600">রোল</th>
                <th className="text-left p-3 font-semibold text-gray-600">নাম</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden md:table-cell">শ্রেণি</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden md:table-cell">সেকশন</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden lg:table-cell">অভিভাবক</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden lg:table-cell">ফোন</th>
                <th className="text-left p-3 font-semibold text-gray-600 hidden lg:table-cell">পাসওয়ার্ড</th>
                <th className="text-right p-3 font-semibold text-gray-600">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="p-3 font-bold text-blue-600">{toBanglaNum(student.roll)}</td>
                  <td className="p-3">
                    <div>
                      <p className="font-semibold text-gray-800">{student.name}</p>
                      <p className="text-xs text-gray-500 md:hidden">{getClassName(student.classId)} - {student.section}</p>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-gray-600">{getClassName(student.classId)}</td>
                  <td className="p-3 hidden md:table-cell">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">{student.section}</span>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-gray-600">{student.parentName}</td>
                  <td className="p-3 hidden lg:table-cell text-gray-500">{student.parentPhone}</td>
                  <td className="p-3 hidden lg:table-cell">
                    {(() => {
                      const linkedParent = getLinkedParent(student.id);
                      if (!linkedParent) return <span className="text-gray-300">—</span>;
                      const isVisible = visiblePasswordId === student.id;
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-gray-600 min-w-[70px]">
                            {isVisible ? linkedParent.password : '•'.repeat(Math.max(6, linkedParent.password.length))}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisiblePasswordId(isVisible ? null : student.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="পাসওয়ার্ড দেখুন"
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(student)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(student.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editingStudent ? <Edit2 size={20} /> : <Plus size={20} />}
                {editingStudent ? 'শিক্ষার্থী সম্পাদনা' : 'নতুন শিক্ষার্থী যোগ করুন'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhotoChange(e.target.files[0])} />
                <button type="button" onClick={() => photoInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0 hover:border-green-400 transition">
                  {form.photo ? <img src={form.photo} className="w-full h-full object-cover" /> : <Camera size={22} className="text-gray-400" />}
                </button>
                <div className="text-xs text-gray-500">
                  <p className="font-medium text-gray-600">শিক্ষার্থীর ছবি</p>
                  <p>{photoUploading ? 'আপলোড হচ্ছে...' : 'ক্লিক করে ছবি যোগ করুন — এটি আইডি কার্ডে দেখাবে'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষার্থীর নাম *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="নাম লিখুন" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">রোল *</label>
                  <input type="number" value={form.roll} onChange={e => setForm({...form, roll: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="রোল" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">শ্রেণি *</label>
                  <select value={form.classId} onChange={e => setForm({...form, classId: e.target.value, section: ''})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="">নির্বাচন</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সেকশন *</label>
                  <select value={form.section} onChange={e => setForm({...form, section: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                    <option value="">নির্বাচন</option>
                    {formSections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">অভিভাবকের নাম *</label>
                <input type="text" value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="অভিভাবকের নাম" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">অভিভাবকের ফোন *</label>
                <input type="text" value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="01XXXXXXXXX" />
                <p className="text-xs text-gray-400 mt-1">
                  এই নম্বর দিয়েই অভিভাবক লগইন করতে পারবেন।
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <KeyRound size={14} /> অভিভাবকের পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none pr-10"
                    placeholder={editingStudent ? 'পরিবর্তন না করলে খালি রাখুন' : 'খালি রাখলে ডিফল্ট = ফোন নম্বর'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {editingStudent
                    ? 'অভিভাবক নিজে পাসওয়ার্ড পরিবর্তন করলেও এখানে সবসময় তার বর্তমান পাসওয়ার্ড দেখা যাবে এবং আপনি চাইলে তা এখান থেকেও বদলাতে পারবেন।'
                    : 'না দিলে ডিফল্ট পাসওয়ার্ড হবে অভিভাবকের ফোন নম্বর।'}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5"><IdCard size={15} /> আইডি কার্ডের তথ্য (ঐচ্ছিক)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">আইডি নম্বর</label>
                    <input type="text" value={form.studentIdNo} onChange={e => setForm({ ...form, studentIdNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="খালি রাখলে স্বয়ংক্রিয়ভাবে তৈরি হবে" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">রক্তের গ্রুপ</label>
                    <select value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">নির্বাচন করুন</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">জন্ম তারিখ</label>
                    <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ঠিকানা</label>
                    <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="গ্রাম/এলাকা" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">
                বাতিল
              </button>
              <button onClick={handleSave} className="flex-1 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
