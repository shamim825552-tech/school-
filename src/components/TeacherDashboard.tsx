import { User } from '../types';
import { getStudents, getAttendance, getClasses, getTodayStr, toBanglaNum } from '../data';
import { Users, UserCheck, UserX, Clock, BookOpen, ClipboardCheck, AlertCircle } from 'lucide-react';

interface Props {
  user: User;
  onNavigate: (page: 'attendance' | 'reports') => void;
}

export default function TeacherDashboard({ user, onNavigate }: Props) {
  const students = getStudents();
  const classes = getClasses();
  const attendance = getAttendance();
  const today = getTodayStr();

  const assignedClass = classes.find(c => c.id === user.assignedClass);
  const classStudents = students.filter(s => s.classId === user.assignedClass && s.section === user.assignedSection);
  const todayAttendance = attendance.filter(a => a.classId === user.assignedClass && a.section === user.assignedSection && a.date === today);

  const presentToday = todayAttendance.filter(a => a.status === 'present').length;
  const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
  const lateToday = todayAttendance.filter(a => a.status === 'late').length;
  const attendanceTaken = todayAttendance.length > 0;

  // Last 5 days records
  const recentDays: { date: string; present: number; absent: number; total: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayAtt = attendance.filter(a => a.classId === user.assignedClass && a.section === user.assignedSection && a.date === ds);
    recentDays.push({
      date: d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
      present: dayAtt.filter(a => a.status === 'present').length,
      absent: dayAtt.filter(a => a.status === 'absent').length,
      total: dayAtt.length,
    });
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">স্বাগতম, {user.name}! 👨‍🏫</h2>
        <p className="text-green-200 text-sm mb-4">আজকের তারিখ: {new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <BookOpen size={18} />
            <div>
              <p className="text-xs text-white/80">নির্ধারিত শ্রেণি</p>
              <p className="font-bold text-sm">{assignedClass?.name || '-'} ({user.assignedSection})</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
            <Users size={18} />
            <div>
              <p className="text-xs text-white/80">শিক্ষার্থী</p>
              <p className="font-bold text-sm">{toBanglaNum(classStudents.length)} জন</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      {attendanceTaken ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <UserCheck size={24} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{toBanglaNum(presentToday)}</p>
            <p className="text-sm text-gray-500 mt-1">উপস্থিত</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <UserX size={24} className="text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">{toBanglaNum(absentToday)}</p>
            <p className="text-sm text-gray-500 mt-1">অনুপস্থিত</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Clock size={24} className="text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600">{toBanglaNum(lateToday)}</p>
            <p className="text-sm text-gray-500 mt-1">দেরি</p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-3" />
          <h3 className="text-lg font-bold text-amber-700 mb-1">আজকের উপস্থিতি নেওয়া হয়নি!</h3>
          <p className="text-sm text-amber-600 mb-4">দয়া করে আজকের উপস্থিতি নিন</p>
          <button
            onClick={() => onNavigate('attendance')}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2 mx-auto"
          >
            <ClipboardCheck size={20} /> উপস্থিতি নিন
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('attendance')}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition text-left group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <ClipboardCheck size={24} className="text-green-600" />
          </div>
          <h4 className="font-bold text-gray-800">উপস্থিতি নিন</h4>
          <p className="text-xs text-gray-500 mt-1">আজকের উপস্থিতি নিন বা সম্পাদনা করুন</p>
        </button>
        <button
          onClick={() => onNavigate('reports')}
          className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition text-left group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <BookOpen size={24} className="text-blue-600" />
          </div>
          <h4 className="font-bold text-gray-800">রিপোর্ট দেখুন</h4>
          <p className="text-xs text-gray-500 mt-1">দৈনিক, সাপ্তাহিক ও মাসিক রিপোর্ট</p>
        </button>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">গত ৫ দিনের উপস্থিতি সারাংশ</h3>
        <div className="space-y-3">
          {recentDays.map((day, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16">{day.date}</span>
              <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden flex">
                {day.total > 0 ? (
                  <>
                    <div className="bg-green-500 h-full transition-all" style={{ width: `${(day.present / day.total) * 100}%` }} />
                    <div className="bg-red-400 h-full transition-all" style={{ width: `${(day.absent / day.total) * 100}%` }} />
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full text-[10px] text-gray-400">তথ্য নেই</div>
                )}
              </div>
              <span className="text-xs text-gray-600 w-12 text-right">
                {day.total > 0 ? `${toBanglaNum(day.present)}/${toBanglaNum(day.total)}` : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
