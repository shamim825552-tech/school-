import { User, Page } from '../types';
import { getStudents, getAttendance, getClasses, toBanglaNum, formatDate } from '../data';
import { UserCheck, UserX, Clock, Calendar, TrendingUp, BookOpen, CheckCircle2, XCircle, AlertTriangle, IdCard } from 'lucide-react';
import StudentIDCard from './StudentIDCard';

interface Props {
  user: User;
  page: Page;
  onNavigate?: (page: Page) => void;
}

export default function ParentDashboard({ user, page, onNavigate }: Props) {
  const students = getStudents();
  const classes = getClasses();
  const attendance = getAttendance();

  const child = students.find(s => s.id === user.childId);
  if (!child) {
    return (
      <div className="bg-white rounded-xl p-12 text-center">
        <p className="text-lg text-gray-400">আপনার সন্তানের তথ্য পাওয়া যায়নি</p>
      </div>
    );
  }

  const childAttendance = attendance.filter(a => a.studentId === child.id).sort((a, b) => b.timestamp - a.timestamp);
  const className = classes.find(c => c.id === child.classId)?.name || '';

  // Calculate stats
  const totalDays = childAttendance.length;
  const presentDays = childAttendance.filter(a => a.status === 'present').length;
  const absentDays = childAttendance.filter(a => a.status === 'absent').length;
  const lateDays = childAttendance.filter(a => a.status === 'late').length;
  const attendanceRate = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  // Last 30 days for calendar view
  const last30Days: { date: string; status: string | null; dayName: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const record = childAttendance.find(a => a.date === ds);
    last30Days.push({
      date: ds,
      status: record?.status || null,
      dayName: d.toLocaleDateString('bn-BD', { weekday: 'short' }),
    });
  }
  last30Days.reverse();

  // Monthly summary
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthAttendance = childAttendance.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthPresent = monthAttendance.filter(a => a.status === 'present').length;
  const monthAbsent = monthAttendance.filter(a => a.status === 'absent').length;
  const monthLate = monthAttendance.filter(a => a.status === 'late').length;

  if (page === 'parent-home') {
    return (
      <div className="space-y-6">
        {/* Child Info Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold">
              {child.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{child.name}</h2>
              <p className="text-purple-200">{className} - সেকশন {child.section}</p>
              <p className="text-purple-200 text-sm">রোল: {toBanglaNum(child.roll)}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{toBanglaNum(presentDays)}</p>
            <p className="text-xs text-gray-500">উপস্থিত</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <UserX size={20} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{toBanglaNum(absentDays)}</p>
            <p className="text-xs text-gray-500">অনুপস্থিত</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock size={20} className="text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{toBanglaNum(lateDays)}</p>
            <p className="text-xs text-gray-500">দেরি</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{toBanglaNum(attendanceRate)}%</p>
            <p className="text-xs text-gray-500">উপস্থিতির হার</p>
          </div>
        </div>

        {/* সন্তানের আইডি কার্ড */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <IdCard size={20} className="text-teal-600" />
              সন্তানের আইডি কার্ড
            </h3>
            {onNavigate && (
              <button onClick={() => onNavigate('parent-id-card')} className="text-xs font-medium text-teal-700 border border-teal-200 rounded-lg px-3 py-1.5 hover:bg-teal-50">
                বিস্তারিত ও প্রিন্ট
              </button>
            )}
          </div>
          <div className="flex justify-center">
            <StudentIDCard student={child} className={className} />
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            এই মাসের সারাংশ ({new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })})
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-xl font-bold text-green-600">{toBanglaNum(monthPresent)}</p>
              <p className="text-xs text-green-700">উপস্থিত</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <p className="text-xl font-bold text-red-500">{toBanglaNum(monthAbsent)}</p>
              <p className="text-xs text-red-600">অনুপস্থিত</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <p className="text-xl font-bold text-amber-600">{toBanglaNum(monthLate)}</p>
              <p className="text-xs text-amber-700">দেরি</p>
            </div>
          </div>
        </div>

        {/* Last 30 Days Calendar */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-purple-600" />
            গত ৩০ দিনের উপস্থিতি
          </h3>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {last30Days.map((day, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] text-gray-400 mb-1">{day.dayName}</p>
                <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-bold ${
                  day.status === 'present' ? 'bg-green-100 text-green-700' :
                  day.status === 'absent' ? 'bg-red-100 text-red-600' :
                  day.status === 'late' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-50 text-gray-300'
                }`}>
                  {day.status === 'present' ? '✓' : day.status === 'absent' ? '✗' : day.status === 'late' ? '⏰' : '·'}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{toBanglaNum(parseInt(day.date.split('-')[2]))}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 justify-center text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 rounded-sm" /> উপস্থিত</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 rounded-sm" /> অনুপস্থিত</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-100 rounded-sm" /> দেরি</span>
          </div>
        </div>
      </div>
    );
  }

  // History page
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">উপস্থিতি ইতিহাস</h3>
        <span className="text-sm text-gray-500">মোট: {toBanglaNum(childAttendance.length)} দিন</span>
      </div>

      <div className="space-y-2">
        {childAttendance.map(record => (
          <div key={record.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 transition hover:shadow-md ${
            record.status === 'present' ? 'border-green-500' :
            record.status === 'absent' ? 'border-red-500' : 'border-amber-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  record.status === 'present' ? 'bg-green-100' :
                  record.status === 'absent' ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  {record.status === 'present' ? <CheckCircle2 size={20} className="text-green-600" /> :
                   record.status === 'absent' ? <XCircle size={20} className="text-red-500" /> :
                   <AlertTriangle size={20} className="text-amber-600" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{formatDate(record.date)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(record.date).toLocaleDateString('bn-BD', { weekday: 'long' })}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                record.status === 'present' ? 'bg-green-100 text-green-700' :
                record.status === 'absent' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
              }`}>
                {record.status === 'present' ? 'উপস্থিত' : record.status === 'absent' ? 'অনুপস্থিত' : 'দেরি'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {childAttendance.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">কোনো উপস্থিতি রেকর্ড পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}
