import { useMemo, useState } from 'react';
import { getStudents, getClasses, toBanglaNum } from '../data';
import { IdCard, Award, Printer, Search } from 'lucide-react';
import StudentIDCard from './StudentIDCard';

type Mode = 'idcard' | 'certificate';
type CertType = 'merit' | 'participation' | 'attendance' | 'sports';

const CERT_LABELS: Record<CertType, string> = {
  merit: 'শ্রেষ্ঠত্ব সনদপত্র', participation: 'অংশগ্রহণ সনদপত্র',
  attendance: 'নিয়মিত উপস্থিতি সনদপত্র', sports: 'ক্রীড়া সনদপত্র',
};

export default function IDCardGenerator() {
  const students = getStudents();
  const classes = getClasses();
  const [mode, setMode] = useState<Mode>('idcard');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [certType, setCertType] = useState<CertType>('merit');
  const [certReason, setCertReason] = useState('');

  const filtered = useMemo(() => students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const className = (id: string) => classes.find(c => c.id === id)?.name || '';

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedStudents = students.filter(s => selectedIds.includes(s.id));

  const handlePrint = () => {
    if (selectedStudents.length === 0) { alert('অন্তত একজন শিক্ষার্থী নির্বাচন করুন!'); return; }
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 w-fit print:hidden">
        <button onClick={() => setMode('idcard')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${mode === 'idcard' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
          <IdCard size={16} /> আইডি কার্ড
        </button>
        <button onClick={() => setMode('certificate')} className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${mode === 'certificate' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Award size={16} /> সনদপত্র
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="শিক্ষার্থী খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
          </div>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition">
            <Printer size={18} /> প্রিন্ট করুন ({toBanglaNum(selectedStudents.length)})
          </button>
        </div>

        {mode === 'certificate' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">সনদপত্রের ধরন</label>
              <select value={certType} onChange={e => setCertType(e.target.value as CertType)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                {Object.entries(CERT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">কারণ / মন্তব্য (ঐচ্ছিক)</label>
              <input type="text" value={certReason} onChange={e => setCertReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" placeholder="যেমন: বার্ষিক পরীক্ষায় ১ম স্থান" />
            </div>
          </div>
        )}

        <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y">
          {filtered.map(s => (
            <label key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} className="w-4 h-4" />
              <span className="font-medium text-gray-700">{s.name}</span>
              <span className="text-xs text-gray-400">রোল {toBanglaNum(s.roll)} · {className(s.classId)} - {s.section}</span>
            </label>
          ))}
          {filtered.length === 0 && <p className="text-center text-gray-400 py-6 text-sm">কোনো শিক্ষার্থী পাওয়া যায়নি</p>}
        </div>
      </div>

      {/* স্ক্রিন প্রিভিউ */}
      {mode === 'idcard' && selectedStudents.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 print:hidden">
          <p className="text-sm font-semibold text-gray-600 mb-3">প্রিভিউ</p>
          <div className="flex flex-wrap gap-4">
            {selectedStudents.map(s => (
              <StudentIDCard key={s.id} student={s} className={className(s.classId)} />
            ))}
          </div>
        </div>
      )}

      {/* প্রিন্টযোগ্য এলাকা */}
      <div className="hidden print:block">
        {mode === 'idcard' ? (
          <div className="grid grid-cols-2 gap-4">
            {selectedStudents.map(s => (
              <StudentIDCard key={s.id} student={s} className={className(s.classId)} />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {selectedStudents.map(s => (
              <div key={s.id} className="border-8 border-double border-teal-700 rounded-2xl p-10 text-center break-after-page">
                <img src="/images/logo.png" alt="logo" className="w-16 h-16 object-cover rounded-full mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-800">ভোলাচং উচ্চ বিদ্যালয়</h1>
                <p className="text-lg font-semibold text-teal-700 mt-6 uppercase tracking-wide">{CERT_LABELS[certType]}</p>
                <p className="text-sm text-gray-500 mt-8">এই মর্মে প্রত্যয়ন করা যাচ্ছে যে,</p>
                <h2 className="text-3xl font-bold text-gray-800 mt-2">{s.name}</h2>
                <p className="text-sm text-gray-600 mt-2">শ্রেণি: {className(s.classId)} - {s.section}, রোল: {toBanglaNum(s.roll)}</p>
                {certReason && <p className="text-sm text-gray-700 mt-6">{certReason}</p>}
                <div className="flex justify-between mt-16 px-10">
                  <div className="text-center">
                    <div className="border-t border-gray-400 w-32 mx-auto pt-1 text-xs text-gray-500">শ্রেণি শিক্ষক</div>
                  </div>
                  <div className="text-center">
                    <div className="border-t border-gray-400 w-32 mx-auto pt-1 text-xs text-gray-500">প্রধান শিক্ষক</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
