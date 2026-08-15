import { useMemo } from 'react';
import { User, SyllabusStatus } from '../types';
import { getStudents, getSyllabus } from '../data';
import { ListChecks, CheckCircle2, CircleDot, Circle } from 'lucide-react';

interface Props {
  user: User;
}

const statusLabel: Record<SyllabusStatus, string> = { pending: 'বাকি আছে', in_progress: 'চলমান', completed: 'সম্পন্ন' };
const statusColor: Record<SyllabusStatus, string> = {
  pending: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};
const statusIcon: Record<SyllabusStatus, React.ReactNode> = {
  pending: <Circle size={14} />, in_progress: <CircleDot size={14} />, completed: <CheckCircle2 size={14} />,
};

export default function ParentSyllabus({ user }: Props) {
  const child = getStudents().find(s => s.id === user.childId);

  const items = useMemo(() => {
    if (!child) return [];
    return getSyllabus().filter(i => i.classId === child.classId && i.section === child.section);
  }, [child]);

  const bySubject = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach(i => {
      const list = map.get(i.subjectName) || [];
      list.push(i);
      map.set(i.subjectName, list);
    });
    return map;
  }, [items]);

  if (!child) {
    return <div className="bg-white rounded-xl p-12 text-center"><p className="text-lg text-gray-400">শিক্ষার্থীর তথ্য পাওয়া যায়নি</p></div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm">
        <ListChecks size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-400">এখনো সিলেবাস তথ্য যোগ করা হয়নি</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...bySubject.entries()].map(([subject, list]) => {
        const done = list.filter(i => i.status === 'completed').length;
        const progress = Math.round((done / list.length) * 100);
        return (
          <div key={subject} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-gray-800">{subject}</span>
              <span className="text-teal-700 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
              <div className="bg-teal-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-1.5">
              {list.map(i => (
                <div key={i.id} className="flex items-center gap-2 text-xs">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium ${statusColor[i.status]}`}>
                    {statusIcon[i.status]} {statusLabel[i.status]}
                  </span>
                  <span className="text-gray-600 truncate">{i.topic}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
