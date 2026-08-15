import { getNotifications, formatDate, toBanglaNum } from '../data';
import { Bell, MessageSquare, CheckCircle2, Phone } from 'lucide-react';

export default function NotificationHistory() {
  const notifications = getNotifications().sort((a, b) => b.timestamp - a.timestamp);

  // Group by date
  const grouped: Record<string, typeof notifications> = {};
  notifications.forEach(n => {
    if (!grouped[n.date]) grouped[n.date] = [];
    grouped[n.date].push(n);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">নোটিফিকেশন ইতিহাস</h3>
          <p className="text-sm text-gray-500">মোট: {toBanglaNum(notifications.length)} টি SMS পাঠানো হয়েছে</p>
        </div>
      </div>

      {Object.entries(grouped).map(([date, notifs]) => (
        <div key={date} className="space-y-2">
          <div className="flex items-center gap-2 py-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              📅 {formatDate(date)} ({toBanglaNum(notifs.length)} টি)
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {notifs.map(notif => (
            <div key={notif.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={20} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-800 text-sm">{notif.studentName}</h4>
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">অনুপস্থিত</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {notif.parentPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-500" />
                      {notif.status === 'sent' ? 'পাঠানো হয়েছে' : 'বিফল'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {notifications.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">কোনো নোটিফিকেশন পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}
