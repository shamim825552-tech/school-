import { useMemo, useState } from 'react';
import { Notification } from '../types';
import { getStudents, getClasses, getUsers, getNotifications, saveNotifications, getFees, getAttendance, getTodayStr, toBanglaNum } from '../data';
import { Send, Users, Megaphone, AlertTriangle, Wallet, ClipboardList, CheckCircle2 } from 'lucide-react';

type Audience = 'all_parents' | 'class' | 'section' | 'student' | 'all_teachers';

const TEMPLATES = [
  { label: 'ফি বকেয়া রিমাইন্ডার', text: 'প্রিয় অভিভাবক, {name}-এর ফি বকেয়া রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন। — ভোলাচং উচ্চ বিদ্যালয়' },
  { label: 'ছুটি/বন্ধের নোটিশ', text: 'প্রিয় অভিভাবক, আগামীকাল বিদ্যালয় বন্ধ থাকবে। — ভোলাচং উচ্চ বিদ্যালয়' },
  { label: 'পরীক্ষার ফলাফল প্রকাশ', text: 'প্রিয় অভিভাবক, {name}-এর পরীক্ষার ফলাফল প্রকাশিত হয়েছে। অ্যাপে দেখুন। — ভোলাচং উচ্চ বিদ্যালয়' },
  { label: 'অভিভাবক সভা', text: 'প্রিয় অভিভাবক, আগামী শুক্রবার অভিভাবক সমাবেশ অনুষ্ঠিত হবে। উপস্থিত থাকার অনুরোধ রইলো। — ভোলাচং উচ্চ বিদ্যালয়' },
  { label: 'সাধারণ নোটিশ', text: 'প্রিয় অভিভাবক, ' },
];

export default function NotificationCenter() {
  const students = getStudents();
  const classes = getClasses();
  const teachers = getUsers().filter(u => u.role === 'teacher');
  const notifications = getNotifications();
  const fees = getFees();
  const attendance = getAttendance();
  const today = getTodayStr();

  const [audience, setAudience] = useState<Audience>('all_parents');
  const [classId, setClassId] = useState('');
  const [section, setSection] = useState('');
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const sections = classes.find(c => c.id === classId)?.sections || [];

  const recipients = useMemo(() => {
    if (audience === 'all_parents') return students;
    if (audience === 'class') return students.filter(s => s.classId === classId);
    if (audience === 'section') return students.filter(s => s.classId === classId && s.section === section);
    if (audience === 'student') return students.filter(s => s.id === studentId);
    return [];
  }, [audience, classId, section, studentId, students]);

  // স্মার্ট অ্যালার্ট — বকেয়া ফি ও নিম্ন উপস্থিতি শনাক্ত করা
  const dueFeeStudents = useMemo(() => {
    const ids = new Set(fees.filter(f => f.status !== 'paid').map(f => f.studentId));
    return students.filter(s => ids.has(s.id));
  }, [fees, students]);

  const lowAttendanceStudents = useMemo(() => {
    const last14 = new Date();
    last14.setDate(last14.getDate() - 14);
    const cutoff = last14.toISOString().split('T')[0];
    const recent = attendance.filter(a => a.date >= cutoff && a.date <= today);
    const byStudent: Record<string, { present: number; total: number }> = {};
    recent.forEach(a => {
      if (!byStudent[a.studentId]) byStudent[a.studentId] = { present: 0, total: 0 };
      byStudent[a.studentId].total += 1;
      if (a.status !== 'absent') byStudent[a.studentId].present += 1;
    });
    return students.filter(s => {
      const rec = byStudent[s.id];
      return rec && rec.total >= 3 && (rec.present / rec.total) < 0.75;
    });
  }, [attendance, students, today]);

  const applyTemplate = (text: string) => setMessage(text);

  const sendTo = (targetStudents: typeof students, text: string) => {
    if (targetStudents.length === 0 || !text.trim()) return;
    const now = Date.now();
    const newNotifs: Notification[] = targetStudents.map((s, i) => ({
      id: `notif-bulk-${now}-${i}-${s.id}`,
      studentId: s.id,
      studentName: s.name,
      parentPhone: s.parentPhone,
      message: text.replace(/\{name\}/g, s.name),
      date: today,
      timestamp: now,
      type: 'sms',
      status: 'sent',
    }));
    const updated = [...notifications, ...newNotifs];
    saveNotifications(updated);
    return newNotifs.length;
  };

  const sendToTeachers = (text: string) => {
    if (teachers.length === 0 || !text.trim()) return;
    const now = Date.now();
    const newNotifs: Notification[] = teachers.map((t, i) => ({
      id: `notif-staff-${now}-${i}-${t.id}`,
      studentId: t.id,
      studentName: t.name,
      parentPhone: t.phone,
      message: text.replace(/\{name\}/g, t.name),
      date: today,
      timestamp: now,
      type: 'sms',
      status: 'sent',
    }));
    saveNotifications([...notifications, ...newNotifs]);
    return newNotifs.length;
  };

  const handleSend = () => {
    if (!message.trim()) { alert('বার্তা লিখুন!'); return; }
    let count = 0;
    if (audience === 'all_teachers') {
      count = sendToTeachers(message) || 0;
    } else {
      if (recipients.length === 0) { alert('কোনো প্রাপক পাওয়া যায়নি!'); return; }
      count = sendTo(recipients, message) || 0;
    }
    setSent(true);
    setMessage('');
    setTimeout(() => setSent(false), 3000);
    alert(`${toBanglaNum(count)} জনকে বার্তা পাঠানো হয়েছে!`);
  };

  const handleQuickAlert = (targetStudents: typeof students, text: string) => {
    const count = sendTo(targetStudents, text);
    alert(`${toBanglaNum(count || 0)} জন অভিভাবককে রিমাইন্ডার পাঠানো হয়েছে!`);
  };

  return (
    <div className="space-y-6">
      {/* Smart alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-200 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={18} className="text-amber-600" />
            <h3 className="font-bold text-gray-800 text-sm">ফি বকেয়া অ্যালার্ট</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">{toBanglaNum(dueFeeStudents.length)} জন শিক্ষার্থীর ফি বকেয়া আছে</p>
          <button
            disabled={dueFeeStudents.length === 0}
            onClick={() => handleQuickAlert(dueFeeStudents, TEMPLATES[0].text)}
            className="flex items-center gap-2 bg-amber-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition">
            <Send size={14} /> সবাইকে রিমাইন্ডার পাঠান
          </button>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-600" />
            <h3 className="font-bold text-gray-800 text-sm">নিম্ন উপস্থিতি অ্যালার্ট</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">গত ১৪ দিনে {toBanglaNum(lowAttendanceStudents.length)} জনের উপস্থিতি ৭৫%-এর কম</p>
          <button
            disabled={lowAttendanceStudents.length === 0}
            onClick={() => handleQuickAlert(lowAttendanceStudents, 'প্রিয় অভিভাবক, {name}-এর সাম্প্রতিক উপস্থিতির হার উদ্বেগজনকভাবে কম। অনুগ্রহ করে খোঁজ নিন। — ভোলাচং উচ্চ বিদ্যালয়')}
            className="flex items-center gap-2 bg-red-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-medium hover:shadow-md transition">
            <Send size={14} /> সবাইকে সতর্কবার্তা পাঠান
          </button>
        </div>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone size={18} className="text-blue-600" />
          <h3 className="font-bold text-gray-800 text-sm">বাল্ক নোটিফিকেশন পাঠান</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">প্রাপক নির্বাচন করুন</label>
          <div className="flex flex-wrap gap-2">
            {([
              ['all_parents', 'সব অভিভাবক', <Users size={14} key="a" />],
              ['class', 'নির্দিষ্ট ক্লাস', <ClipboardList size={14} key="b" />],
              ['section', 'নির্দিষ্ট সেকশন', <ClipboardList size={14} key="c" />],
              ['student', 'একজন শিক্ষার্থী', <Users size={14} key="d" />],
              ['all_teachers', 'সব শিক্ষক', <Users size={14} key="e" />],
            ] as [Audience, string, React.ReactNode][]).map(([val, label, icon]) => (
              <button key={val} onClick={() => setAudience(val)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${audience === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {(audience === 'class' || audience === 'section') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ক্লাস</label>
              <select value={classId} onChange={e => { setClassId(e.target.value); setSection(''); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                <option value="">নির্বাচন করুন</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {audience === 'section' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">সেকশন</label>
                <select value={section} onChange={e => setSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="">নির্বাচন করুন</option>
                  {sections.map(s => <option key={s} value={s}>সেকশন {s}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {audience === 'student' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">শিক্ষার্থী</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
              <option value="">নির্বাচন করুন</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — রোল {toBanglaNum(s.roll)}</option>)}
            </select>
          </div>
        )}

        <p className="text-xs text-gray-500">
          প্রাপক সংখ্যা: <span className="font-semibold text-gray-700">{toBanglaNum(audience === 'all_teachers' ? teachers.length : recipients.length)} জন</span>
        </p>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">টেমপ্লেট নির্বাচন করুন (ঐচ্ছিক)</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => (
              <button key={t.label} onClick={() => applyTemplate(t.text)}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition">
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">বার্তা লিখুন</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            placeholder="আপনার বার্তা লিখুন... ({name} লিখলে শিক্ষার্থীর নাম বসবে)"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button onClick={handleSend}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition">
          {sent ? <CheckCircle2 size={18} /> : <Send size={18} />} বার্তা পাঠান
        </button>
      </div>
    </div>
  );
}
