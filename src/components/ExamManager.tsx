import { useState } from 'react';
import { Subject, Exam } from '../types';
import { getSubjects, saveSubjects, getExams, saveExams, getClasses, toBanglaNum } from '../data';
import { Plus, Edit2, Trash2, X, Save, BookMarked, CalendarDays } from 'lucide-react';

export default function ExamManager() {
  const classes = getClasses();
  const [tab, setTab] = useState<'subjects' | 'exams'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>(getSubjects());
  const [exams, setExams] = useState<Exam[]>(getExams());

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ classId: '', name: '', fullMarks: '100' });

  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({ name: '', classId: '', academicYear: String(new Date().getFullYear()), examDate: '' });

  const className = (id: string) => classes.find(c => c.id === id)?.name || 'অজানা';

  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({ classId: classes[0]?.id || '', name: '', fullMarks: '100' });
    setShowSubjectForm(true);
  };
  const openEditSubject = (s: Subject) => {
    setEditingSubject(s);
    setSubjectForm({ classId: s.classId, name: s.name, fullMarks: String(s.fullMarks) });
    setShowSubjectForm(true);
  };
  const saveSubjectForm = () => {
    if (!subjectForm.classId || !subjectForm.name) { alert('সব তথ্য পূরণ করুন!'); return; }
    let updated: Subject[];
    if (editingSubject) {
      updated = subjects.map(s => s.id === editingSubject.id
        ? { ...s, classId: subjectForm.classId, name: subjectForm.name, fullMarks: Number(subjectForm.fullMarks) || 100 }
        : s);
    } else {
      updated = [...subjects, {
        id: `subj-${Date.now()}`, classId: subjectForm.classId, name: subjectForm.name,
        fullMarks: Number(subjectForm.fullMarks) || 100,
      }];
    }
    saveSubjects(updated);
    setSubjects(updated);
    setShowSubjectForm(false);
  };
  const deleteSubject = (id: string) => {
    if (!confirm('এই সাবজেক্টটি মুছে ফেলতে চান?')) return;
    const updated = subjects.filter(s => s.id !== id);
    saveSubjects(updated);
    setSubjects(updated);
  };

  const openAddExam = () => {
    setEditingExam(null);
    setExamForm({ name: '', classId: classes[0]?.id || '', academicYear: String(new Date().getFullYear()), examDate: '' });
    setShowExamForm(true);
  };
  const openEditExam = (e: Exam) => {
    setEditingExam(e);
    setExamForm({ name: e.name, classId: e.classId, academicYear: e.academicYear, examDate: e.examDate });
    setShowExamForm(true);
  };
  const saveExamForm = () => {
    if (!examForm.name || !examForm.classId || !examForm.examDate) { alert('সব তথ্য পূরণ করুন!'); return; }
    let updated: Exam[];
    if (editingExam) {
      updated = exams.map(e => e.id === editingExam.id ? { ...e, ...examForm } : e);
    } else {
      updated = [...exams, { id: `exam-${Date.now()}`, ...examForm }];
    }
    saveExams(updated);
    setExams(updated);
    setShowExamForm(false);
  };
  const deleteExam = (id: string) => {
    if (!confirm('এই পরীক্ষাটি মুছে ফেলতে চান? এর সাথে যুক্ত সব ফলাফলও মুছে যেতে পারে।')) return;
    const updated = exams.filter(e => e.id !== id);
    saveExams(updated);
    setExams(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-fit">
        <button onClick={() => setTab('subjects')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'subjects' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          সাবজেক্ট
        </button>
        <button onClick={() => setTab('exams')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'exams' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          পরীক্ষা
        </button>
      </div>

      {classes.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          প্রথমে "ক্লাস ও সেকশন" পেইজ থেকে অন্তত একটি ক্লাস যোগ করুন।
        </div>
      )}

      {tab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">মোট: {toBanglaNum(subjects.length)} টি সাবজেক্ট</p>
            <button onClick={openAddSubject} disabled={classes.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition disabled:opacity-40">
              <Plus size={18} /> নতুন সাবজেক্ট
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map(s => (
              <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BookMarked size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{className(s.classId)} • পূর্ণমান: {toBanglaNum(s.fullMarks)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditSubject(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={14} /></button>
                  <button onClick={() => deleteSubject(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          {subjects.length === 0 && <p className="text-center text-gray-400 py-10">কোনো সাবজেক্ট যোগ করা হয়নি</p>}
        </div>
      )}

      {tab === 'exams' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">মোট: {toBanglaNum(exams.length)} টি পরীক্ষা</p>
            <button onClick={openAddExam} disabled={classes.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition disabled:opacity-40">
              <Plus size={18} /> নতুন পরীক্ষা
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exams.map(e => (
              <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-purple-600" />
                    <p className="font-semibold text-gray-800 text-sm">{e.name}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditExam(e)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={14} /></button>
                    <button onClick={() => deleteExam(e.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{className(e.classId)} • {e.academicYear}</p>
                <p className="text-xs text-gray-500">তারিখ: {e.examDate}</p>
              </div>
            ))}
          </div>
          {exams.length === 0 && <p className="text-center text-gray-400 py-10">কোনো পরীক্ষা যোগ করা হয়নি</p>}
        </div>
      )}

      {showSubjectForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">{editingSubject ? 'সাবজেক্ট সম্পাদনা' : 'নতুন সাবজেক্ট'}</h3>
              <button onClick={() => setShowSubjectForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ক্লাস *</label>
                <select value={subjectForm.classId} onChange={e => setSubjectForm({ ...subjectForm, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">সাবজেক্টের নাম *</label>
                <input type="text" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="যেমন: বাংলা" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পূর্ণমান</label>
                <input type="number" value={subjectForm.fullMarks} onChange={e => setSubjectForm({ ...subjectForm, fullMarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowSubjectForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={saveSubjectForm} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      {showExamForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-800">{editingExam ? 'পরীক্ষা সম্পাদনা' : 'নতুন পরীক্ষা'}</h3>
              <button onClick={() => setShowExamForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরীক্ষার নাম *</label>
                <input type="text" value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="যেমন: অর্ধবার্ষিক পরীক্ষা" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ক্লাস *</label>
                <select value={examForm.classId} onChange={e => setExamForm({ ...examForm, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষাবর্ষ *</label>
                <input type="text" value={examForm.academicYear} onChange={e => setExamForm({ ...examForm, academicYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">পরীক্ষার তারিখ *</label>
                <input type="date" value={examForm.examDate} onChange={e => setExamForm({ ...examForm, examDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowExamForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition">বাতিল</button>
              <button onClick={saveExamForm} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center justify-center gap-2">
                <Save size={16} /> সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
