import { useRef, useState } from 'react';
import { Student, User } from '../types';
import { getStudents, saveStudents, toBanglaNum } from '../data';
import { fileToResizedDataUrl } from '../utils/imageFile';
import StudentIDCard from './StudentIDCard';
import { Camera, Save, IdCard, X } from 'lucide-react';

interface Props {
  user: User;
}

export default function TeacherStudentCards({ user }: Props) {
  const allStudents = getStudents();
  const myStudents = allStudents.filter(
    s => s.classId === user.assignedClass && (!user.assignedSection || s.section === user.assignedSection)
  );
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ photo: '', studentIdNo: '', bloodGroup: '', dateOfBirth: '', address: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      photo: s.photo || '', studentIdNo: s.studentIdNo || '', bloodGroup: s.bloodGroup || '',
      dateOfBirth: s.dateOfBirth || '', address: s.address || '',
    });
  };

  const handlePhoto = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file, 500, 0.85);
      setForm(f => ({ ...f, photo: dataUrl }));
    } catch {
      alert('ছবি আপলোড করা যায়নি।');
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    if (!editing) return;
    const updated = allStudents.map(s => s.id === editing.id ? {
      ...s,
      photo: form.photo || s.photo,
      studentIdNo: form.studentIdNo.trim() || s.studentIdNo,
      bloodGroup: form.bloodGroup.trim() || undefined,
      dateOfBirth: form.dateOfBirth.trim() || undefined,
      address: form.address.trim() || undefined,
      cardUpdatedAt: Date.now(),
    } : s);
    saveStudents(updated);
    setEditing(null);
  };

  if (!user.assignedClass) {
    return <div className="text-center py-16 text-gray-400">আপনার কোনো শ্রেণি নির্ধারণ করা হয়নি।</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><IdCard size={20} /> শিক্ষার্থী আইডি কার্ড সম্পাদনা</h3>
        <p className="text-sm text-gray-500">আপনার শ্রেণির শিক্ষার্থীদের ছবি ও কার্ডের তথ্য যোগ/সম্পাদনা করুন</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {myStudents.map(s => (
          <div key={s.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center overflow-hidden shrink-0">
              {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <span className="font-bold text-teal-700">{s.name.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">{s.name}</p>
              <p className="text-xs text-gray-500">রোল {toBanglaNum(s.roll)}</p>
            </div>
            <button onClick={() => openEdit(s)} className="text-xs font-medium text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50">এডিট</button>
          </div>
        ))}
        {myStudents.length === 0 && <p className="text-gray-400 col-span-full text-center py-10">কোনো শিক্ষার্থী পাওয়া যায়নি</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-gray-800">{editing.name} — কার্ড সম্পাদনা</h3>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                  {form.photo ? <img src={form.photo} className="w-full h-full object-cover" /> : <Camera size={20} className="text-gray-400" />}
                </button>
                <p className="text-xs text-gray-500">{uploading ? 'আপলোড হচ্ছে...' : 'ক্লিক করে ছবি যোগ করুন'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">আইডি নম্বর</label>
                  <input value={form.studentIdNo} onChange={e => setForm({ ...form, studentIdNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">রক্তের গ্রুপ</label>
                  <select value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                    <option value="">নির্বাচন</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">জন্ম তারিখ</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ঠিকানা</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                </div>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2">প্রিভিউ</p>
                <StudentIDCard student={{ ...editing, ...form, bloodGroup: form.bloodGroup || undefined, dateOfBirth: form.dateOfBirth || undefined }} className="" compact />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">বাতিল</button>
              <button onClick={save} className="flex-1 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
