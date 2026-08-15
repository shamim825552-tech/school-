import { useState } from 'react';
import { User } from '../types';
import { getAttendance, getStudents, getClasses, toBanglaNum, formatDate } from '../data';
import { BarChart3, Calendar, Filter } from 'lucide-react';

interface Props {
  user: User;
}

export default function ReportsPage({ user }: Props) {
  const classes = getClasses();
  const students = getStudents();
  const attendance = getAttendance();

  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedClass, setSelectedClass] = useState(user.role === 'teacher' ? (user.assignedClass || '') : '');
  const [selectedSection, setSelectedSection] = useState(user.role === 'teacher' ? (user.assignedSection || '') : '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const sections = selectedClass ? classes.find(c => c.id === selectedClass)?.sections || [] : [];

  // Get date range based on report type
  const getDateRange = (): string[] => {
    const dates: string[] = [];
    const base = new Date(selectedDate);

    if (reportType === 'daily') {
      dates.push(selectedDate);
    } else if (reportType === 'weekly') {
      const dayOfWeek = base.getDay();
      const start = new Date(base);
      start.setDate(start.getDate() - dayOfWeek);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
    } else {
      const year = base.getFullYear();
      const month = base.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        dates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
      }
    }
    return dates;
  };

  const dateRange = getDateRange();
  const filteredStudents = students.filter(s => {
    if (selectedClass && s.classId !== selectedClass) return false;
    if (selectedSection && s.section !== selectedSection) return false;
    return true;
  }).sort((a, b) => a.roll - b.roll);

  // Calculate stats per student
  const studentStats = filteredStudents.map(student => {
    const records = attendance.filter(a => a.studentId === student.id && dateRange.includes(a.date));
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = records.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { student, present, absent, late, total, rate, records };
  });

  // Summary
  const totalPresent = studentStats.reduce((a, b) => a + b.present, 0);
  const totalAbsent = studentStats.reduce((a, b) => a + b.absent, 0);
  const totalLate = studentStats.reduce((a, b) => a + b.late, 0);
  const totalRecords = studentStats.reduce((a, b) => a + b.total, 0);
  const overallRate = totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : 0;

  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || classId;

  return (
    <div className="space-y-4">
      {/* Report Type & Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-3">
          {/* Report Type */}
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  reportType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'daily' ? '📅 দৈনিক' : type === 'weekly' ? '📊 সাপ্তাহিক' : '📈 মাসিক'}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {user.role === 'admin' && (
              <>
                <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">সকল শ্রেণি</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {sections.length > 0 && (
                  <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">সকল সেকশন</option>
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </>
            )}
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-blue-600">{toBanglaNum(filteredStudents.length)}</p>
          <p className="text-xs text-gray-500">মোট শিক্ষার্থী</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{toBanglaNum(totalPresent)}</p>
          <p className="text-xs text-gray-500">উপস্থিত</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-red-500">{toBanglaNum(totalAbsent)}</p>
          <p className="text-xs text-gray-500">অনুপস্থিত</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-amber-600">{toBanglaNum(totalLate)}</p>
          <p className="text-xs text-gray-500">দেরি</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-blue-700">{toBanglaNum(overallRate)}%</p>
          <p className="text-xs text-gray-500">উপস্থিতির হার</p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            {reportType === 'daily' ? 'দৈনিক' : reportType === 'weekly' ? 'সাপ্তাহিক' : 'মাসিক'} রিপোর্ট
          </h3>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar size={14} />
            {reportType === 'daily' ? formatDate(selectedDate) : `${toBanglaNum(dateRange.length)} দিন`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 font-semibold text-gray-600">রোল</th>
                <th className="text-left p-3 font-semibold text-gray-600">নাম</th>
                {user.role === 'admin' && <th className="text-left p-3 font-semibold text-gray-600 hidden md:table-cell">শ্রেণি</th>}
                <th className="text-center p-3 font-semibold text-green-600">উপস্থিত</th>
                <th className="text-center p-3 font-semibold text-red-500">অনুপস্থিত</th>
                <th className="text-center p-3 font-semibold text-amber-600">দেরি</th>
                <th className="text-center p-3 font-semibold text-blue-600">হার</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map(({ student, present, absent, late, rate }) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-bold text-blue-600">{toBanglaNum(student.roll)}</td>
                  <td className="p-3 font-semibold text-gray-800">{student.name}</td>
                  {user.role === 'admin' && <td className="p-3 text-gray-600 hidden md:table-cell">{getClassName(student.classId)} ({student.section})</td>}
                  <td className="p-3 text-center">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{toBanglaNum(present)}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">{toBanglaNum(absent)}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{toBanglaNum(late)}</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{toBanglaNum(rate)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Filter size={32} className="mx-auto mb-2" />
              <p>শ্রেণি নির্বাচন করুন রিপোর্ট দেখতে</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
