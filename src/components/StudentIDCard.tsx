import { Student, ClassInfo } from '../types';
import { toBanglaNum } from '../data';
import { Droplet, Phone, Calendar } from 'lucide-react';

interface Props {
  student: Student;
  className: string;
  compact?: boolean;
}

export default function StudentIDCard({ student, className, compact }: Props) {
  const idNo = student.studentIdNo || student.id.slice(-8).toUpperCase();
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-teal-700 bg-gradient-to-br from-teal-50 via-white to-emerald-50 shadow-md break-inside-avoid ${compact ? 'w-full' : 'w-80'} h-52 flex flex-col`}>
      {/* সাজসজ্জাগত ব্যাকগ্রাউন্ড আকার */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-teal-600/10 rounded-full" />
      <div className="absolute -right-2 top-10 w-16 h-16 bg-emerald-500/10 rounded-full" />

      <div className="relative flex items-center gap-2 bg-gradient-to-r from-teal-700 to-emerald-700 text-white px-3 py-2">
        <img src="/images/logo.png" alt="logo" className="w-8 h-8 object-cover rounded-full border-2 border-white/40" />
        <div className="leading-tight">
          <p className="font-bold text-xs">ভোলাচং উচ্চ বিদ্যালয়</p>
          <p className="text-[9px] text-white/80">শিক্ষার্থী পরিচয়পত্র</p>
        </div>
      </div>

      <div className="relative flex-1 flex items-center gap-3 px-3 py-2">
        <div className="w-16 h-20 rounded-lg bg-white border-2 border-teal-600 shrink-0 overflow-hidden flex items-center justify-center">
          {student.photo ? (
            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-teal-700">{student.name.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm text-gray-800 truncate">{student.name}</p>
          <p className="text-[11px] text-gray-600">শ্রেণি: {className} - {student.section}</p>
          <p className="text-[11px] text-gray-600">রোল: {toBanglaNum(student.roll)}</p>
          {student.bloodGroup && (
            <p className="text-[11px] text-red-600 flex items-center gap-1"><Droplet size={10} /> রক্তের গ্রুপ: {student.bloodGroup}</p>
          )}
          {student.dateOfBirth && (
            <p className="text-[11px] text-gray-500 flex items-center gap-1"><Calendar size={10} /> জন্ম তারিখ: {student.dateOfBirth}</p>
          )}
          <p className="text-[11px] text-gray-500 flex items-center gap-1"><Phone size={10} /> {student.parentPhone}</p>
        </div>
      </div>

      <div className="relative border-t border-teal-200 px-3 py-1.5 flex items-center justify-between bg-white/70">
        <p className="text-[9px] text-gray-500">অভিভাবক: {student.parentName}</p>
        <p className="text-[9px] font-mono font-bold text-teal-700">ID: {idNo}</p>
      </div>
    </div>
  );
}
