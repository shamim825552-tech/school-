import { useState, useMemo } from 'react';
import { User, LeaveApplication, LeaveStatus } from '../types';
import { getLeaveApplications, saveLeaveApplications, getStudents, getClasses, formatDate, getTodayStr } from '../data';
import { CalendarOff, Check, X, Clock, Search } from 'lucide-react';

interface Props {
  user: User;
}

export default function LeaveManager({ user }: Props) {
  const [applications, setApplications] = useState<LeaveApplication[]>(getLeaveApplications());
  const students = getStudents();
  const classes = getClasses();
  const [filter, setFilter] = useState<LeaveStatus | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const isTeacher = user.role === 'teacher';

  const visibleApplications = useMemo(() => {
    let list = applications;
    if (isTeacher && user.assignedClass) {
      const classStudentIds = new Set(
        students.filter(s => s.classId === user.assignedClass && (!user.assignedSection || s.section === user.assignedSection)).map(s => s.id)
      );
      list = list.filter(l => classStudentIds.has(l.studentId));
    }
    if (filter !== 'all') list = list.filter(l => l.status === filter);
    if (search) {
      list = list.filter(l => {
        const student = students.find(s => s.id === l.studentId);
        return student?.name.toLowerCase().includes(search.toLowerCase());
      });
    }
    return [...list].sort((a, b) => b.timestamp - a.timestamp);
  }, [applications, filter, search, isTeacher, user, students]);

  const studentInfo = (id: string) => {
    const s = students.find(st => st.id === id);
    if (!s) return { name: 'অজানা', cls: '' };
    const cls = classes.find(c => c.id === s.classId)?.name || '';
    return { name: s.name, cls: `${cls} - ${s.section}` };
  };

  const respond = (app: LeaveApplication, status: LeaveStatus) => {
    const updated = applications.map(a =>
      a.id === app.id ? { ...a, status, respondedBy: user.name, responseNote: note || undefined } : a
    );
    saveLeaveApplications(updated);
    setApplications(updated);
    setRespondingId(null);
    setNote('');
  };

  const statusBadge = (status: LeaveStatus) => {
    if (status === 'approved') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">অনুমোদিত</span>;
    if (status === 'rejected') return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">প্রত্যাখ্যাত</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">অপেক্ষমাণ</span>;
  };

  const today = getTodayStr();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 bg-gray-50 p-1 rounded-lg">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filter === f ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
              {f === 'pending' ? 'অপেক্ষমাণ' : f === 'approved' ? 'অনুমোদিত' : f === 'rejected' ? 'প্রত্যাখ্যাত' : 'সব'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="শিক্ষার্থীর নাম খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
        </div>
      </div>

      <div className="space-y-3">
        {visibleApplications.map(app => {
          const info = studentInfo(app.studentId);
          const overlapsToday = app.fromDate <= today && app.toDate >= today;
          return (
            <div key={app.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
              app.status === 'approved' ? 'border-green-500' : app.status === 'rejected' ? 'border-red-400' : 'border-amber-400'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm">{info.name}</p>
                    <span className="text-xs text-gray-400">{info.cls}</span>
                    {overlapsToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">আজ ছুটিতে</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(app.fromDate)} — {formatDate(app.toDate)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{app.reason}</p>
                  {app.responseNote && (
                    <p className="text-xs text-gray-400 mt-2 italic">প্রতিক্রিয়া: {app.responseNote}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {statusBadge(app.status)}
                  {app.status === 'pending' && (
                    respondingId === app.id ? (
                      <div className="flex flex-col gap-2 w-48">
                        <input value={note} onChange={e => setNote(e.target.value)} placeholder="মন্তব্য (ঐচ্ছিক)"
                          className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none" />
                        <div className="flex gap-1">
                          <button onClick={() => respond(app, 'approved')} className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700">
                            <Check size={14} /> অনুমোদন
                          </button>
                          <button onClick={() => respond(app, 'rejected')} className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600">
                            <X size={14} /> বাতিল
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setRespondingId(app.id)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700">
                        <Clock size={14} /> প্রতিক্রিয়া দিন
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visibleApplications.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <CalendarOff size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-gray-400">কোনো ছুটির আবেদন পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}
