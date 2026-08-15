import { useState, useMemo, useRef } from 'react';
import { User } from '../types';
import { getExams, getSubjects, getStudents, getClasses, getResults, toBanglaNum, formatDate } from '../data';
import { computeExamAnalytics, examLabel, StudentExamRow } from '../utils/examAnalytics';
import { BarChart3, Trophy, TrendingDown, Printer, Award, Medal } from 'lucide-react';

interface Props {
  user: User;
}

export default function ResultAnalytics({ user }: Props) {
  const isTeacher = user.role === 'teacher';
  const allClasses = getClasses();
  const classes = isTeacher ? allClasses.filter(c => c.id === user.assignedClass) : allClasses;
  const allExams = getExams();
  const exams = isTeacher ? allExams.filter(e => e.classId === user.assignedClass) : allExams;

  const [examId, setExamId] = useState(exams[0]?.id || '');
  const [section, setSection] = useState('');
  const [printStudent, setPrintStudent] = useState<StudentExamRow | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const exam = exams.find(e => e.id === examId);
  const sections = classes.find(c => c.id === exam?.classId)?.sections || [];
  const subjects = useMemo(() => getSubjects().filter(s => s.classId === exam?.classId), [exam?.classId]);
  const students = useMemo(() => {
    if (!exam) return [];
    return getStudents().filter(s => s.classId === exam.classId && (!section || s.section === section));
  }, [exam, section]);
  const results = getResults();

  const analytics = useMemo(() => {
    if (!exam) return null;
    return computeExamAnalytics(students, subjects, results, exam.id);
  }, [exam, students, subjects, results]);

  const handlePrint = (row: StudentExamRow) => {
    setPrintStudent(row);
    setTimeout(() => window.print(), 100);
  };

  if (exams.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm">
        <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-400">কোনো পরীক্ষা তৈরি করা হয়নি</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Print-only report card */}
      {printStudent && exam && (
        <div className="hidden print:block fixed inset-0 bg-white z-[999] p-8" ref={printRef}>
          <ReportCardPrint row={printStudent} examName={examLabel(exam)} />
        </div>
      )}

      <div className="print:hidden space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">পরীক্ষা নির্বাচন করুন</label>
            <select value={examId} onChange={e => { setExamId(e.target.value); setSection(''); }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
              <option value="">নির্বাচন করুন</option>
              {exams.map(e => <option key={e.id} value={e.id}>{examLabel(e)} — {allClasses.find(c => c.id === e.classId)?.name}</option>)}
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

        {!exam && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Award size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-gray-400">একটি পরীক্ষা নির্বাচন করুন</p>
          </div>
        )}

        {exam && analytics && analytics.totalAppeared === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
            এই পরীক্ষার জন্য এখনো কোনো ফলাফল এন্ট্রি করা হয়নি।
          </div>
        )}

        {exam && analytics && analytics.totalAppeared > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">অংশগ্রহণকারী</p>
                <p className="text-xl font-bold text-gray-800">{toBanglaNum(analytics.totalAppeared)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">পাসের হার</p>
                <p className="text-xl font-bold text-green-600">{toBanglaNum(Math.round(analytics.passRate))}%</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">গড় GPA</p>
                <p className="text-xl font-bold text-blue-600">{analytics.classAverageGpa.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">গড় নম্বর</p>
                <p className="text-xl font-bold text-purple-600">{toBanglaNum(Math.round(analytics.classAveragePercentage))}%</p>
              </div>
            </div>

            {/* Top performers & weak performers */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={18} className="text-amber-500" />
                  <h3 className="font-bold text-gray-800 text-sm">শীর্ষ শিক্ষার্থী</h3>
                </div>
                <div className="space-y-2">
                  {analytics.topPerformers.map((row, i) => (
                    <div key={row.student.id} className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg">
                      <Medal size={16} className={i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : 'text-orange-400'} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{row.student.name}</p>
                        <p className="text-xs text-gray-500">রোল {toBanglaNum(row.student.roll)}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-600">GPA {row.gpa.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown size={18} className="text-red-500" />
                  <h3 className="font-bold text-gray-800 text-sm">অতিরিক্ত মনোযোগ প্রয়োজন</h3>
                </div>
                <div className="space-y-2">
                  {analytics.weakPerformers.map(row => (
                    <div key={row.student.id} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{row.student.name}</p>
                        <p className="text-xs text-gray-500">রোল {toBanglaNum(row.student.roll)} • {row.failedSubjects > 0 ? `${toBanglaNum(row.failedSubjects)}টি বিষয়ে ফেল` : 'পাস'}</p>
                      </div>
                      <span className="text-sm font-bold text-red-500">{toBanglaNum(Math.round(row.percentage))}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject-wise average */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm mb-4">বিষয়ভিত্তিক গড় ফলাফল</h3>
              <div className="space-y-3">
                {analytics.subjectAverages.map(sa => (
                  <div key={sa.subject.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{sa.subject.name}</span>
                      <span className="text-gray-500">গড় {toBanglaNum(Math.round(sa.average))}% • পাস {toBanglaNum(Math.round(sa.passRate))}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${sa.average >= 60 ? 'bg-green-500' : sa.average >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${Math.min(sa.average, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Merit list table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <div className="p-4 border-b flex items-center gap-2">
                <BarChart3 size={18} className="text-green-600" />
                <h3 className="font-bold text-gray-800 text-sm">মেধাক্রম তালিকা</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-center p-3 font-semibold text-gray-600">মেধাক্রম</th>
                    <th className="text-left p-3 font-semibold text-gray-600">নাম / রোল</th>
                    <th className="text-center p-3 font-semibold text-gray-600">নম্বর</th>
                    <th className="text-center p-3 font-semibold text-gray-600">GPA</th>
                    <th className="text-center p-3 font-semibold text-gray-600">গ্রেড</th>
                    <th className="text-center p-3 font-semibold text-gray-600">অবস্থা</th>
                    <th className="text-center p-3 font-semibold text-gray-600">রিপোর্ট কার্ড</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.rows.map(row => (
                    <tr key={row.student.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3 text-center">
                        {row.rank > 0 ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            row.rank === 1 ? 'bg-amber-100 text-amber-700' : row.rank <= 3 ? 'bg-gray-100 text-gray-600' : 'text-gray-500'
                          }`}>{toBanglaNum(row.rank)}</span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-gray-800">{row.student.name}</p>
                        <p className="text-xs text-gray-500">রোল {toBanglaNum(row.student.roll)}</p>
                      </td>
                      <td className="p-3 text-center text-gray-700">
                        {row.totalFull > 0 ? `${toBanglaNum(row.totalObtained)}/${toBanglaNum(row.totalFull)}` : '—'}
                      </td>
                      <td className="p-3 text-center font-semibold text-gray-800">{row.totalFull > 0 ? row.gpa.toFixed(2) : '—'}</td>
                      <td className="p-3 text-center">
                        {row.overallGrade && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.overallGrade.letter === 'F' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {row.overallGrade.letter}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {row.totalFull > 0 ? (
                          row.passed
                            ? <span className="text-xs font-medium text-green-600">পাস</span>
                            : <span className="text-xs font-medium text-red-500">ফেল</span>
                        ) : <span className="text-xs text-gray-400">অনুপস্থিত</span>}
                      </td>
                      <td className="p-3 text-center">
                        {row.totalFull > 0 && (
                          <button onClick={() => handlePrint(row)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                            <Printer size={13} /> প্রিন্ট
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReportCardPrint({ row, examName }: { row: StudentExamRow; examName: string }) {
  return (
    <div className="max-w-2xl mx-auto border-2 border-gray-800 p-6">
      <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
        <h1 className="text-xl font-bold">ভোলাচং উচ্চ বিদ্যালয়</h1>
        <p className="text-sm text-gray-600">একাডেমিক রিপোর্ট কার্ড</p>
        <p className="text-sm font-semibold mt-1">{examName}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <p><span className="text-gray-500">নাম:</span> <span className="font-semibold">{row.student.name}</span></p>
        <p><span className="text-gray-500">রোল:</span> <span className="font-semibold">{toBanglaNum(row.student.roll)}</span></p>
        <p><span className="text-gray-500">শ্রেণি/শাখা:</span> <span className="font-semibold">{row.student.section}</span></p>
        <p><span className="text-gray-500">তারিখ:</span> <span className="font-semibold">{formatDate(new Date().toISOString().split('T')[0])}</span></p>
      </div>
      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 p-2 text-left">বিষয়</th>
            <th className="border border-gray-400 p-2">পূর্ণমান</th>
            <th className="border border-gray-400 p-2">প্রাপ্ত নম্বর</th>
            <th className="border border-gray-400 p-2">গ্রেড</th>
          </tr>
        </thead>
        <tbody>
          {row.subjectMarks.map(sm => (
            <tr key={sm.subject.id}>
              <td className="border border-gray-400 p-2">{sm.subject.name}</td>
              <td className="border border-gray-400 p-2 text-center">{toBanglaNum(sm.fullMarks)}</td>
              <td className="border border-gray-400 p-2 text-center">{sm.grade ? toBanglaNum(sm.marksObtained) : '—'}</td>
              <td className="border border-gray-400 p-2 text-center font-semibold">{sm.grade?.letter || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="border border-gray-400 p-2"><span className="text-gray-500">সর্বমোট:</span> <span className="font-bold">{toBanglaNum(row.totalObtained)}/{toBanglaNum(row.totalFull)} ({toBanglaNum(Math.round(row.percentage))}%)</span></div>
        <div className="border border-gray-400 p-2"><span className="text-gray-500">GPA:</span> <span className="font-bold">{row.gpa.toFixed(2)} ({row.overallGrade?.letter})</span></div>
        <div className="border border-gray-400 p-2"><span className="text-gray-500">মেধাক্রম:</span> <span className="font-bold">{row.rank > 0 ? toBanglaNum(row.rank) : '—'}</span></div>
        <div className="border border-gray-400 p-2"><span className="text-gray-500">ফলাফল:</span> <span className={`font-bold ${row.passed ? 'text-green-700' : 'text-red-700'}`}>{row.passed ? 'পাস' : 'ফেল'}</span></div>
      </div>
      <div className="flex justify-between mt-10 text-sm">
        <div className="text-center"><div className="border-t border-gray-500 pt-1 px-6">শ্রেণি শিক্ষক</div></div>
        <div className="text-center"><div className="border-t border-gray-500 pt-1 px-6">প্রধান শিক্ষক</div></div>
      </div>
    </div>
  );
}
