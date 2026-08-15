import { useMemo } from 'react';
import { SchoolEvent, EventCategory } from '../types';
import { getEvents, formatDate, getTodayStr } from '../data';
import { CalendarDays } from 'lucide-react';

const CATEGORY_LABELS: Record<EventCategory, string> = {
  exam: 'পরীক্ষা', holiday: 'ছুটি', meeting: 'সভা', sports: 'ক্রীড়া', cultural: 'সাংস্কৃতিক', other: 'অন্যান্য',
};
const CATEGORY_COLORS: Record<EventCategory, string> = {
  exam: 'bg-red-100 text-red-700', holiday: 'bg-green-100 text-green-700', meeting: 'bg-blue-100 text-blue-700',
  sports: 'bg-orange-100 text-orange-700', cultural: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600',
};

export default function EventsView() {
  const events = getEvents();
  const today = getTodayStr();

  const { upcoming, past } = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
    return {
      upcoming: sorted.filter(e => (e.endDate || e.date) >= today),
      past: sorted.filter(e => (e.endDate || e.date) < today).reverse(),
    };
  }, [events, today]);

  const renderEvent = (e: SchoolEvent) => (
    <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
      <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 text-indigo-600">
        <CalendarDays size={18} />
      </div>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 text-sm">{e.title}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[e.category]}`}>{CATEGORY_LABELS[e.category]}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{formatDate(e.date)}{e.endDate ? ` — ${formatDate(e.endDate)}` : ''}</p>
        {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">স্কুল ইভেন্ট ক্যালেন্ডার</h3>

      <div className="space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase">আসন্ন</p>
        {upcoming.map(renderEvent)}
        {upcoming.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <CalendarDays size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg text-gray-400">কোনো আসন্ন ইভেন্ট নেই</p>
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase">অতীত</p>
          {past.map(e => <div key={e.id} className="opacity-60">{renderEvent(e)}</div>)}
        </div>
      )}
    </div>
  );
}
