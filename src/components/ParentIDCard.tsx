import { User } from '../types';
import { getStudents, getClasses } from '../data';
import StudentIDCard from './StudentIDCard';
import { Printer, IdCard as IdCardIcon } from 'lucide-react';

interface Props {
  user: User;
}

export default function ParentIDCard({ user }: Props) {
  const student = user.childId ? getStudents().find(s => s.id === user.childId) : undefined;
  const classes = getClasses();
  const className = student ? (classes.find(c => c.id === student.classId)?.name || '') : '';

  if (!student) {
    return (
      <div className="max-w-md mx-auto text-center py-16 text-gray-400">
        <IdCardIcon size={40} className="mx-auto mb-3" />
        <p>এখনও কোনো শিক্ষার্থীর তথ্য যুক্ত নেই। অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center print:hidden">
        <h2 className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2"><IdCardIcon size={20} /> সন্তানের আইডি কার্ড</h2>
        <p className="text-sm text-gray-500">অ্যাডমিন/শিক্ষক কর্তৃক স্বয়ংক্রিয়ভাবে তৈরি</p>
      </div>

      <div className="flex justify-center">
        <StudentIDCard student={student} className={className} />
      </div>

      <button onClick={() => window.print()}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg transition print:hidden">
        <Printer size={18} /> প্রিন্ট করুন
      </button>

      <div className="hidden print:flex justify-center">
        <StudentIDCard student={student} className={className} />
      </div>
    </div>
  );
}
