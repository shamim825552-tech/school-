import { useMemo, useState } from 'react';
import { User, StaffAttendanceRecord, StaffAttendanceStatus } from '../types';
import { getUsers, getStaffAttendance, saveStaffAttendance, getTodayStr, toBanglaNum, formatDate } from '../data';
import { UserCheck, UserX, Clock, CalendarOff, ClipboardCheck, TrendingUp } from 'lucide-react';

interface Props {
  user: User;
}

const STATUS_CONFIG: Record<StaffAttendanceStatus, { label: string; color: string; icon: JSX.Element }> = {
  present: { label: 'উপস্থিত', color: 'bg-green-500', icon: <UserCheck size={14} /> },
  absent: { label: 'অনুপস্থিত', color: 'bg-red-500', icon: <UserX size={14} /> },
  late: { label: 'দেরি', color: 'bg-amber-500', icon: <Clock size={14} /> },
  leave: { label: 'ছুটি', color: 'bg-blue-500', icon: <CalendarOff size={14} /> },
};

export default function StaffAttendance({ user }: Props) {
  const teachers = getUsers().filter(u => u.role === 'teacher');
  const [records, setRecords] = useState<StaffAttendanceRecord[]>(getStaffAttendance());
  const [date, setDate] = useState(getTodayStr());
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));

  const dayRecords = useMemo(() => records.filter(r => r.date === date), [records, date]);

  const getStatus = (teacherId: string): StaffAttendanceStatus | null => {
    return dayRecords.find(r => r.teacherId === teacherId)?.status || null;
  };

  const markStatus = (teacherId: string, status: StaffAttendanceStatus) => {
    const existingIdx = records.findIndex(r => r.teacherId === teacherId && r.date === date);
    let updated: StaffAttendanceRecord[];
    if (existingIdx >= 0) {
      updated = records.map((r, i) => i === existingIdx ? { ...r, status, timestamp: Date.now() } : r);
    } else {
      const newRecord: StaffAttendanceRecord = {
        id: `sa-${date}-${teacherId}`, teacherId, date, status, markedBy: user.name, timestamp: Date.now(),
      };
      updated = [...records, newRecord];
    }
    saveStaffAttendance(updated);
    setRecords(updated);
  };

  const markAllPresent = () => {
    const now = Date.now();
    let updated = [...records];
    teachers.forEach(t => {
      const existingIdx = updated.findIndex(r => r.teacherId === t.id && r.date === date);
      if (existingIdx >= 0) updated[existingIdx] = { ...updated[existingIdx], status: 'present', timestamp: now };
      else updated.push({ id: `sa-${date}-${t.id}`, teacherId: t.id, date, status: 'present', markedBy: user.name, timestamp: now });
    });
    saveStaffAttendance(updated);
    setRecords(updated);
  };

  // মাসিক সারাংশ
  const monthlySummary = useMemo(() => {
    return teachers.map(t => {
      const recs = records.filter(r => r.teacherId === t.id && r.date.startsWith(monthFilter));
      const present = recs.filter(r => r.status === 'present').length;
      const absent = recs.filter(r => r.status === 'absent').length;
      const late = recs.filter(r => r.status === 'late').length;
      const leave = recs.filter(r => r.status === 'leave').length;
      const total = recs.length;
      const rate = total > 0 ? ((present + late) / total) * 100 : 0;
      return { teacher: t, present, absent, late, leave, total, rate };
    }).sort((a, b) => a.rate - b.rate);
  }, [records, teachers, monthFilter]);

  const todayCounts = {
    present: dayRecords.filter(r => r.status === 'present').length,
    absent: dayRecords.filter(r => r.status === 'absent').length,
    late: dayRecords.filter(r => r.status === 'late').length,
    leave: dayRecords.filter(r => r.status === 'leave').length,
  };

  return (
    <div className="space-y-6">
      {/* Today's marking */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
          <span className="text-xs text-gray-500">{formatDate(date)}</span>
        </div>
        <button onClick={markAllPresent}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
          <ClipboardCheck size={16} /> সবাইকে উপস্থিত চিহ্নিত করুন
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-green-600">{toBanglaNum(todayCounts.present)}</p>
          <p className="text-xs text-gray-500">উপস্থিত</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-red-500">{toBanglaNum(todayCounts.absent)}</p>
          <p className="text-xs text-gray-500">অনুপস্থিত</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-amber-500">{toBanglaNum(todayCounts.late)}</p>
          <p className="text-xs text-gray-500">দেরি</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xl font-bold text-blue-500">{toBanglaNum(todayCounts.leave)}</p>
          <p className="text-xs text-gray-500">ছুটি</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
        {teachers.map(t => {
          const status = getStatus(t.id);
          return (
            <div key={t.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-sm shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.assignedClass ? 'শ্রেণি শিক্ষক' : 'শিক্ষক'}</p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {(Object.keys(STATUS_CONFIG) as StaffAttendanceStatus[]).map(s => (
                  <button key={s} onClick={() => markStatus(t.id, s)}
                    title={STATUS_CONFIG[s].label}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                      status === s ? `${STATUS_CONFIG[s].color} text-white` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}>
                    {STATUS_CONFIG[s].icon}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {teachers.length === 0 && <p className="text-center text-gray-400 text-sm py-10">কোনো শিক্ষক যোগ করা হয়নি</p>}
      </div>

      {/* Monthly summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><TrendingUp size={18} className="text-green-600" /> মাসিক উপস্থিতি সারাংশ</h3>
          <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none" />
        </div>
        <div className="divide-y">
          {monthlySummary.map(row => (
            <div key={row.teacher.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium text-gray-800">{row.teacher.name}</p>
                <span className={`text-xs font-bold ${row.rate < 75 ? 'text-red-500' : row.rate < 90 ? 'text-amber-500' : 'text-green-600'}`}>
                  {row.total > 0 ? `${toBanglaNum(Math.round(row.rate))}%` : '—'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                উপস্থিত {toBanglaNum(row.present)} • অনুপস্থিত {toBanglaNum(row.absent)} • দেরি {toBanglaNum(row.late)} • ছুটি {toBanglaNum(row.leave)}
              </p>
              {row.total > 0 && row.rate < 75 && (
                <p className="text-xs text-red-500 mt-1">⚠ উপস্থিতির হার কম — বেতন পাতায় পর্যালোচনার পরামর্শ দেওয়া হচ্ছে</p>
              )}
            </div>
          ))}
          {monthlySummary.length === 0 && <p className="text-center text-gray-400 text-sm py-8">কোনো শিক্ষক নেই</p>}
        </div>
      </div>
    </div>
  );
}
