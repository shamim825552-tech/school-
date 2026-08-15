import { User } from '../types';
import { getStudents, getHomeworks, formatDate } from '../data';
import { NotebookPen, CalendarDays } from 'lucide-react';

interface Props {
  user: User;
}

export default function ParentHomework({ user }: Props) {
  const child = getStudents().find(s => s.id === user.childId);
  const homeworks = getStudents().find(s => s.id === user.childId)
    ? getHomeworks()
        .filter(h => h.classId === child?.classId && h.section === child?.section)
        .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate))
    : [];

  const todayStr = new Date().toISOString().split('T')[0];

  if (!child) {
    return <div className="bg-white rounded-xl p-12 text-center"><p className="text-lg text-gray-400">শিক্ষার্থীর তথ্য পাওয়া যায়নি</p></div>;
  }

  return (
    <div className="space-y-3">
      {homeworks.map(hw => {
        const isOverdue = hw.dueDate < todayStr;
        return (
          <div key={hw.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${isOverdue ? 'border-gray-300' : 'border-orange-500'}`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <NotebookPen size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{hw.title}</p>
                <p className="text-xs text-gray-500">{hw.subjectName}</p>
                {hw.description && <p className="text-sm text-gray-600 mt-1">{hw.description}</p>}
                <div className={`flex items-center gap-1 text-xs mt-2 ${isOverdue ? 'text-gray-400' : 'text-orange-600 font-medium'}`}>
                  <CalendarDays size={12} />
                  <span>জমার শেষ তারিখ: {formatDate(hw.dueDate)}{isOverdue ? ' (মেয়াদোত্তীর্ণ)' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {homeworks.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <NotebookPen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">এখনো কোনো হোমওয়ার্ক দেওয়া হয়নি</p>
        </div>
      )}
    </div>
  );
}
