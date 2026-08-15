import { useState, useEffect } from 'react';
import { User, AttendanceRecord, Notification } from '../types';
import {
  getStudents, getClasses, getAttendance, saveAttendance,
  getNotifications, saveNotifications, getTodayStr, toBanglaNum
} from '../data';
import { Check, X, Clock, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  user: User;
}

export default function AttendancePage({ user }: Props) {
  const classes = getClasses();
  const allStudents = getStudents();

  const [selectedClass, setSelectedClass] = useState(user.role === 'teacher' ? (user.assignedClass || '') : '');
  const [selectedSection, setSelectedSection] = useState(user.role === 'teacher' ? (user.assignedSection || '') : '');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const sections = selectedClass ? classes.find(c => c.id === selectedClass)?.sections || [] : [];
  const students = allStudents.filter(s => s.classId === selectedClass && s.section === selectedSection).sort((a, b) => a.roll - b.roll);

  // Load existing attendance
  useEffect(() => {
    if (!selectedClass || !selectedSection || !selectedDate) return;
    const existing = getAttendance().filter(
      a => a.classId === selectedClass && a.section === selectedSection && a.date === selectedDate
    );
    const map: Record<string, 'present' | 'absent' | 'late'> = {};
    existing.forEach(a => { map[a.studentId] = a.status; });
    // If no existing records, default all to 'present'
    if (existing.length === 0) {
      students.forEach(s => { map[s.id] = 'present'; });
    }
    setAttendanceMap(map);
    setSaved(existing.length > 0);
  }, [selectedClass, selectedSection, selectedDate]);

  const toggleStatus = (studentId: string) => {
    setSaved(false);
    setAttendanceMap(prev => {
      const current = prev[studentId] || 'present';
      const next = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
      return { ...prev, [studentId]: next };
    });
  };

  const setAllStatus = (status: 'present' | 'absent' | 'late') => {
    setSaved(false);
    const map: Record<string, 'present' | 'absent' | 'late'> = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendanceMap(map);
  };

  const handleSave = () => {
    setSaving(true);

    // Get existing records minus current class/section/date
    const allRecords = getAttendance().filter(
      a => !(a.classId === selectedClass && a.section === selectedSection && a.date === selectedDate)
    );

    // Add new records
    const newRecords: AttendanceRecord[] = students.map(s => ({
      id: `att-${selectedDate}-${s.id}`,
      studentId: s.id,
      date: selectedDate,
      status: attendanceMap[s.id] || 'present',
      classId: selectedClass,
      section: selectedSection,
      markedBy: user.id,
      timestamp: Date.now(),
    }));

    saveAttendance([...allRecords, ...newRecords]);

    // Generate notifications for absent students
    const absentStudents = students.filter(s => attendanceMap[s.id] === 'absent');
    if (absentStudents.length > 0) {
      const existingNotifs = getNotifications();
      const newNotifs: Notification[] = absentStudents.map(s => ({
        id: `notif-${Date.now()}-${s.id}`,
        studentId: s.id,
        studentName: s.name,
        parentPhone: s.parentPhone,
        message: `প্রিয় অভিভাবক, আপনার সন্তান ${s.name} আজ ভোলাচং উচ্চ বিদ্যালয়ে অনুপস্থিত রয়েছে। অনুগ্রহ করে প্রয়োজনীয় ব্যবস্থা নিন। — ভোলাচং উচ্চ বিদ্যালয়`,
        date: selectedDate,
        timestamp: Date.now(),
        type: 'sms',
        status: 'sent',
      }));
      saveNotifications([...existingNotifs, ...newNotifs]);
    }

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 500);
  };

  const presentCount = Object.values(attendanceMap).filter(v => v === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(v => v === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter(v => v === 'late').length;

  const statusConfig = {
    present: { label: 'উপস্থিত', icon: <Check size={18} />, bg: 'bg-green-500', ring: 'ring-green-300', text: 'text-green-700', lightBg: 'bg-green-50' },
    absent: { label: 'অনুপস্থিত', icon: <X size={18} />, bg: 'bg-red-500', ring: 'ring-red-300', text: 'text-red-700', lightBg: 'bg-red-50' },
    late: { label: 'দেরি', icon: <Clock size={18} />, bg: 'bg-amber-500', ring: 'ring-amber-300', text: 'text-amber-700', lightBg: 'bg-amber-50' },
  };

  return (
    <div className="space-y-4">
      {/* Selection Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          {user.role === 'admin' && (
            <>
              <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none flex-1">
                <option value="">শ্রেণি নির্বাচন করুন</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
                <option value="">সেকশন</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </>
          )}
          {user.role === 'teacher' && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                {classes.find(c => c.id === selectedClass)?.name || '-'} - সেকশন {selectedSection}
              </span>
            </div>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
      </div>

      {students.length > 0 && (
        <>
          {/* Quick Actions & Summary */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setAllStatus('present')}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition">
                <Check size={14} /> সবাই উপস্থিত
              </button>
              <button onClick={() => setAllStatus('absent')}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition">
                <X size={14} /> সবাই অনুপস্থিত
              </button>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-600 font-medium">✓ {toBanglaNum(presentCount)}</span>
              <span className="flex items-center gap-1 text-red-500 font-medium">✗ {toBanglaNum(absentCount)}</span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">⏰ {toBanglaNum(lateCount)}</span>
            </div>
          </div>

          {/* Student Attendance List */}
          <div className="space-y-2">
            {students.map(student => {
              const status = attendanceMap[student.id] || 'present';
              const config = statusConfig[status];
              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
                    status === 'present' ? 'border-green-200' : status === 'absent' ? 'border-red-200' : 'border-amber-200'
                  }`}
                  onClick={() => toggleStatus(student.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className={`w-12 h-12 ${config.bg} rounded-xl flex items-center justify-center text-white shadow-md ring-4 ${config.ring}/30 flex-shrink-0`}>
                      {config.icon}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                          রোল {toBanglaNum(student.roll)}
                        </span>
                        <h4 className="font-bold text-gray-800 truncate">{student.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">অভিভাবক: {student.parentName}</p>
                    </div>

                    {/* Status Badge */}
                    <span className={`${config.lightBg} ${config.text} px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="sticky bottom-4 flex justify-center">
            {saved ? (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-xl font-medium shadow-lg">
                <CheckCircle2 size={20} /> উপস্থিতি সংরক্ষিত হয়েছে!
                {absentCount > 0 && (
                  <span className="text-xs bg-green-200 px-2 py-0.5 rounded-full ml-2">
                    {toBanglaNum(absentCount)} জনের অভিভাবককে SMS পাঠানো হয়েছে
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Save size={22} />
                )}
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'উপস্থিতি সংরক্ষণ করুন'}
              </button>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {(!selectedClass || !selectedSection) && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">শ্রেণি ও সেকশন নির্বাচন করুন</h3>
          <p className="text-sm text-gray-400">উপস্থিতি নিতে উপরে শ্রেণি ও সেকশন নির্বাচন করুন</p>
        </div>
      )}

      {selectedClass && selectedSection && students.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-lg text-gray-400">এই শ্রেণি ও সেকশনে কোনো শিক্ষার্থী পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}
