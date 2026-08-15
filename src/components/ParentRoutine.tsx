import { User, ROUTINE_DAYS } from '../types';
import { getStudents, getRoutines, getUsers, toBanglaNum } from '../data';
import { CalendarClock } from 'lucide-react';

interface Props {
  user: User;
}

export default function ParentRoutine({ user }: Props) {
  const child = getStudents().find(s => s.id === user.childId);
  const teachers = getUsers().filter(u => u.role === 'teacher');
  const routines = getRoutines().filter(r => r.classId === child?.classId && r.section === child?.section);

  const teacherName = (id?: string) => id ? (teachers.find(t => t.id === id)?.name || 'অজানা') : '—';

  if (!child) {
    return <div className="bg-white rounded-xl p-12 text-center"><p className="text-lg text-gray-400">শিক্ষার্থীর তথ্য পাওয়া যায়নি</p></div>;
  }

  return (
    <div className="space-y-3">
      {ROUTINE_DAYS.map(day => {
        const dayPeriods = routines.filter(r => r.day === day).sort((a, b) => a.period - b.period);
        if (dayPeriods.length === 0) return null;
        return (
          <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-indigo-50 px-4 py-2 font-semibold text-indigo-800 text-sm">{day}</div>
            <div className="divide-y">
              {dayPeriods.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="w-7 h-7 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">{toBanglaNum(p.period)}</span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{p.subjectName}</p>
                    <p className="text-xs text-gray-500">{p.startTime} - {p.endTime} • {teacherName(p.teacherId)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {routines.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <CalendarClock size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">এখনো ক্লাস রুটিন যোগ করা হয়নি</p>
        </div>
      )}
    </div>
  );
}
