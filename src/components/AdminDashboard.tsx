import { getStudents, getUsers, getAttendance, getClasses, getTodayStr, toBanglaNum } from '../data';
import { Users, GraduationCap, UserCheck, UserX, Clock, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const students = getStudents();
  const users = getUsers();
  const attendance = getAttendance();
  const classes = getClasses();
  const today = getTodayStr();

  const teachers = users.filter(u => u.role === 'teacher');
  const todayAttendance = attendance.filter(a => a.date === today);
  const presentToday = todayAttendance.filter(a => a.status === 'present').length;
  const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
  const lateToday = todayAttendance.filter(a => a.status === 'late').length;
  const attendanceRate = todayAttendance.length > 0
    ? Math.round(((presentToday + lateToday) / todayAttendance.length) * 100) : 0;

  // Get last 5 days attendance for chart
  const last5Days: { date: string; present: number; absent: number; late: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayAtt = attendance.filter(a => a.date === ds);
    last5Days.push({
      date: d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
      present: dayAtt.filter(a => a.status === 'present').length,
      absent: dayAtt.filter(a => a.status === 'absent').length,
      late: dayAtt.filter(a => a.status === 'late').length,
    });
  }
  last5Days.reverse();
  const maxVal = Math.max(...last5Days.map(d => d.present + d.absent + d.late), 1);

  // Class-wise summary
  const classSummary = classes.map(cls => {
    const classStudents = students.filter(s => s.classId === cls.id);
    const classAtt = todayAttendance.filter(a => a.classId === cls.id);
    const present = classAtt.filter(a => a.status === 'present').length;
    const absent = classAtt.filter(a => a.status === 'absent').length;
    return { ...cls, total: classStudents.length, present, absent, taken: classAtt.length > 0 };
  });

  const stats = [
    { label: 'মোট শিক্ষার্থী', value: toBanglaNum(students.length), icon: <Users size={24} />, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50' },
    { label: 'মোট শিক্ষক', value: toBanglaNum(teachers.length), icon: <GraduationCap size={24} />, color: 'from-green-500 to-green-700', bg: 'bg-green-50' },
    { label: 'আজ উপস্থিত', value: toBanglaNum(presentToday), icon: <UserCheck size={24} />, color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50' },
    { label: 'আজ অনুপস্থিত', value: toBanglaNum(absentToday), icon: <UserX size={24} />, color: 'from-red-500 to-red-700', bg: 'bg-red-50' },
    { label: 'আজ দেরি', value: toBanglaNum(lateToday), icon: <Clock size={24} />, color: 'from-amber-500 to-amber-700', bg: 'bg-amber-50' },
    { label: 'মোট ক্লাস', value: toBanglaNum(classes.length), icon: <BookOpen size={24} />, color: 'from-purple-500 to-purple-700', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">স্বাগতম! 🎓</h2>
        <p className="text-green-100">ভোলাচং উচ্চ বিদ্যালয় ডিজিটাল উপস্থিতি ব্যবস্থাপনা সিস্টেম</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white/20 rounded-xl px-4 py-2">
            <p className="text-xs text-white/80">উপস্থিতির হার</p>
            <p className="text-2xl font-bold">{toBanglaNum(attendanceRate)}%</p>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2">
            <p className="text-xs text-white/80">আজকের তারিখ</p>
            <p className="text-sm font-semibold">{new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Attendance Chart (Simple Bar Chart) */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-green-600" />
            <h3 className="font-bold text-gray-800">গত ৫ দিনের উপস্থিতি</h3>
          </div>
          <div className="flex items-end gap-3 h-40">
            {last5Days.map((day, i) => {
              const total = day.present + day.absent + day.late;
              const height = total > 0 ? (total / maxVal) * 100 : 0;
              const presentPct = total > 0 ? (day.present / total) * 100 : 0;
              const latePct = total > 0 ? (day.late / total) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative rounded-t-lg overflow-hidden" style={{ height: `${height}%`, minHeight: total > 0 ? '20px' : '4px' }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-green-500" style={{ height: `${presentPct}%` }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-400" style={{ height: `${presentPct + latePct}%`, zIndex: 0 }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-red-400" style={{ height: '100%', zIndex: -1 }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-400" style={{ height: `${presentPct + latePct}%` }} />
                    <div className="absolute bottom-0 left-0 right-0 bg-green-500" style={{ height: `${presentPct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{day.date}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 justify-center">
            <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 bg-green-500 rounded-sm" /> উপস্থিত</span>
            <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 bg-amber-400 rounded-sm" /> দেরি</span>
            <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 bg-red-400 rounded-sm" /> অনুপস্থিত</span>
          </div>
        </div>

        {/* Class-wise Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-800">শ্রেণি ভিত্তিক আজকের সারাংশ</h3>
          </div>
          <div className="space-y-3">
            {classSummary.map(cls => (
              <div key={cls.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm">
                  {cls.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800">{cls.name}</p>
                  <p className="text-xs text-gray-500">মোট: {toBanglaNum(cls.total)} জন</p>
                </div>
                {cls.taken ? (
                  <div className="text-right">
                    <span className="text-xs text-green-600 font-medium">✓ {toBanglaNum(cls.present)}</span>
                    <span className="text-xs text-gray-400 mx-1">/</span>
                    <span className="text-xs text-red-500 font-medium">✗ {toBanglaNum(cls.absent)}</span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={14} /> অসম্পূর্ণ
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
