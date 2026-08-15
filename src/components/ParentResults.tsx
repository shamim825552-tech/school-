import { useState, useMemo } from 'react';
import { User } from '../types';
import { getStudents, getExams, getSubjects, getResults, getGrade, toBanglaNum } from '../data';
import { computeExamAnalytics } from '../utils/examAnalytics';
import { Award, GraduationCap, Trophy } from 'lucide-react';

interface Props {
  user: User;
}

export default function ParentResults({ user }: Props) {
  const child = getStudents().find(s => s.id === user.childId);
  const exams = getExams().filter(e => e.classId === child?.classId);
  const [examId, setExamId] = useState(exams[0]?.id || '');
  const exam = exams.find(e => e.id === examId);
  const subjects = useMemo(() => getSubjects().filter(s => s.classId === exam?.classId), [exam?.classId]);
  const results = getResults().filter(r => r.examId === examId && r.studentId === child?.id);

  if (!child) {
    return <div className="bg-white rounded-xl p-12 text-center"><p className="text-lg text-gray-400">শিক্ষার্থীর তথ্য পাওয়া যায়নি</p></div>;
  }

  const totalObtained = results.reduce((s, r) => s + r.marksObtained, 0);
  const totalFull = results.reduce((s, r) => s + r.fullMarks, 0);
  const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
  const overallGrade = totalFull > 0 ? getGrade(percentage) : null;

  const classmates = useMemo(() => exam ? getStudents().filter(s => s.classId === exam.classId) : [], [exam]);
  const analytics = useMemo(() => exam ? computeExamAnalytics(classmates, subjects, getResults(), exam.id) : null, [exam, classmates, subjects]);
  const myRow = analytics?.rows.find(r => r.student.id === child.id);

  return (
    <div className="space-y-4">
      {exams.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Award size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">এখনো কোনো পরীক্ষার ফলাফল প্রকাশিত হয়নি</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <label className="block text-xs font-medium text-gray-500 mb-1">পরীক্ষা নির্বাচন করুন</label>
            <select value={examId} onChange={e => setExamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
              {exams.map(e => <option key={e.id} value={e.id}>{e.name} — {e.academicYear}</option>)}
            </select>
          </div>

          {overallGrade && (
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">সর্বমোট প্রাপ্ত নম্বর</p>
                <p className="text-3xl font-bold">{toBanglaNum(totalObtained)}/{toBanglaNum(totalFull)}</p>
                <p className="text-purple-200 text-sm mt-1">{toBanglaNum(Math.round(percentage))}%</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-col">
                <GraduationCap size={22} />
                <span className="text-lg font-bold mt-1">{overallGrade.letter}</span>
              </div>
            </div>
          )}

          {myRow && myRow.rank > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><Trophy size={18} className="text-amber-500" /></div>
                <div><p className="text-xs text-gray-500">শ্রেণিতে মেধাক্রম</p><p className="text-lg font-bold text-gray-800">{toBanglaNum(myRow.rank)}</p></div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">GPA</p>
                <p className="text-lg font-bold text-gray-800">{myRow.gpa.toFixed(2)} <span className={`text-xs font-medium ${myRow.passed ? 'text-green-600' : 'text-red-500'}`}>({myRow.passed ? 'পাস' : 'ফেল'})</span></p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y">
              {subjects.map(subject => {
                const r = results.find(x => x.subjectId === subject.id);
                const grade = r ? getGrade((r.marksObtained / r.fullMarks) * 100) : null;
                return (
                  <div key={subject.id} className="flex items-center justify-between px-4 py-3">
                    <p className="font-medium text-gray-800 text-sm">{subject.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{r ? `${toBanglaNum(r.marksObtained)}/${toBanglaNum(r.fullMarks)}` : '—'}</span>
                      {grade && (
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${grade.letter === 'F' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                          {grade.letter}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {results.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">এই পরীক্ষার ফলাফল এখনো যোগ করা হয়নি</p>}
          </div>
        </>
      )}
    </div>
  );
}
