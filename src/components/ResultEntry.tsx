import { useState, useMemo } from 'react';
import { User, ResultRecord } from '../types';
import { getExams, getSubjects, getStudents, getClasses, getResults, saveResults, getGrade, toBanglaNum } from '../data';
import { ClipboardList, Save, Award } from 'lucide-react';

interface Props {
  user: User;
}

export default function ResultEntry({ user }: Props) {
  const isTeacher = user.role === 'teacher';
  const allClasses = getClasses();
  const classes = isTeacher ? allClasses.filter(c => c.id === user.assignedClass) : allClasses;
  const allExams = getExams();
  const exams = isTeacher ? allExams.filter(e => e.classId === user.assignedClass) : allExams;

  const [examId, setExamId] = useState(exams[0]?.id || '');
  const [section, setSection] = useState('');
  const results = getResults();

  const exam = exams.find(e => e.id === examId);
  const subjects = useMemo(() => getSubjects().filter(s => s.classId === exam?.classId), [exam?.classId]);
  const students = useMemo(() => {
    if (!exam) return [];
    return getStudents().filter(s => s.classId === exam.classId && (!section || s.section === section));
  }, [exam, section]);
  const sections = classes.find(c => c.id === exam?.classId)?.sections || [];

  // marksGrid[studentId][subjectId] = string value while editing
  const [marksGrid, setMarksGrid] = useState<Record<string, Record<string, string>>>({});

  const getMark = (studentId: string, subjectId: string): string => {
    if (marksGrid[studentId]?.[subjectId] !== undefined) return marksGrid[studentId][subjectId];
    const existing = results.find(r => r.examId === examId && r.studentId === studentId && r.subjectId === subjectId);
    return existing ? String(existing.marksObtained) : '';
  };

  const setMark = (studentId: string, subjectId: string, value: string) => {
    setMarksGrid(prev => ({ ...prev, [studentId]: { ...prev[studentId], [subjectId]: value } }));
  };

  const handleSaveAll = () => {
    if (!exam) return;
    let updated = [...results];
    students.forEach(student => {
      subjects.forEach(subject => {
        const raw = getMark(student.id, subject.id);
        if (raw === '') return;
        const marks = Number(raw);
        if (isNaN(marks)) return;
        const existingIdx = updated.findIndex(r => r.examId === examId && r.studentId === student.id && r.subjectId === subject.id);
        const record: ResultRecord = {
          id: existingIdx >= 0 ? updated[existingIdx].id : `res-${examId}-${student.id}-${subject.id}`,
          examId, studentId: student.id, subjectId: subject.id,
          marksObtained: marks, fullMarks: subject.fullMarks,
        };
        if (existingIdx >= 0) updated[existingIdx] = record;
        else updated.push(record);
      });
    });
    saveResults(updated);
    setMarksGrid({});
    alert('ফলাফল সংরক্ষণ করা হয়েছে!');
  };

  const studentTotal = (studentId: string) => {
    let obtained = 0, full = 0;
    subjects.forEach(subject => {
      const raw = getMark(studentId, subject.id);
      if (raw !== '' && !isNaN(Number(raw))) {
        obtained += Number(raw);
        full += subject.fullMarks;
      }
    });
    return { obtained, full };
  };

  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm">
        <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-400">কোনো পরীক্ষা তৈরি করা হয়নি। {isTeacher ? 'অ্যাডমিনকে জানান।' : '"পরীক্ষা" পেইজ থেকে একটি পরীক্ষা তৈরি করুন।'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">পরীক্ষা নির্বাচন করুন</label>
          <select value={examId} onChange={e => { setExamId(e.target.value); setSection(''); }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
            <option value="">নির্বাচন করুন</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name} — {allClasses.find(c => c.id === e.classId)?.name}</option>)}
          </select>
        </div>
        {sections.length > 0 && (
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">সেকশন</label>
            <select value={section} onChange={e => setSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
              <option value="">সব সেকশন</option>
              {sections.map(s => <option key={s} value={s}>সেকশন {s}</option>)}
            </select>
          </div>
        )}
      </div>

      {exam && subjects.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          এই ক্লাসের জন্য কোনো সাবজেক্ট যোগ করা হয়নি।
        </div>
      )}

      {exam && subjects.length > 0 && students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 font-semibold text-gray-600">রোল / নাম</th>
                {subjects.map(s => (
                  <th key={s.id} className="text-center p-3 font-semibold text-gray-600 whitespace-nowrap">
                    {s.name}<br /><span className="text-xs text-gray-400">({toBanglaNum(s.fullMarks)})</span>
                  </th>
                ))}
                <th className="text-center p-3 font-semibold text-gray-600">মোট</th>
                <th className="text-center p-3 font-semibold text-gray-600">গ্রেড</th>
              </tr>
            </thead>
            <tbody>
              {students.sort((a, b) => a.roll - b.roll).map(student => {
                const { obtained, full } = studentTotal(student.id);
                const percentage = full > 0 ? (obtained / full) * 100 : 0;
                const grade = full > 0 ? getGrade(percentage) : null;
                return (
                  <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-medium text-gray-800">{toBanglaNum(student.roll)}. {student.name}</span>
                    </td>
                    {subjects.map(subject => (
                      <td key={subject.id} className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={subject.fullMarks}
                          value={getMark(student.id, subject.id)}
                          onChange={e => setMark(student.id, subject.id, e.target.value)}
                          className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </td>
                    ))}
                    <td className="p-3 text-center font-semibold text-gray-700">
                      {full > 0 ? `${toBanglaNum(obtained)}/${toBanglaNum(full)}` : '—'}
                    </td>
                    <td className="p-3 text-center">
                      {grade && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          grade.letter === 'F' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                        }`}>{grade.letter}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {exam && subjects.length > 0 && students.length === 0 && (
        <p className="text-center text-gray-400 py-10">এই ক্লাস/সেকশনে কোনো শিক্ষার্থী নেই</p>
      )}

      {exam && subjects.length > 0 && students.length > 0 && (
        <button onClick={handleSaveAll}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <Save size={18} /> সব ফলাফল সংরক্ষণ করুন
        </button>
      )}

      {!exam && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Award size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">একটি পরীক্ষা নির্বাচন করুন</p>
        </div>
      )}
    </div>
  );
}
