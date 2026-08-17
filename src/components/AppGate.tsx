import { useEffect, useState, ReactNode } from 'react';
import {
  APP_VERSION,
  AppControl,
  Broadcast,
  fetchAppControl,
  fetchActiveBroadcasts,
  refreshFeatureFlags,
  isVersionOlder,
  reportError,
} from '../lib/appControl';

const CHECK_INTERVAL_MS = 90_000; // ৯০ সেকেন্ড পরপর কন্ট্রোল রুম চেক করবে

export default function AppGate({ children }: { children: ReactNode }) {
  const [control, setControl] = useState<AppControl | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const [c, b] = await Promise.all([fetchAppControl(), fetchActiveBroadcasts()]);
        refreshFeatureFlags().catch(() => {});
        if (!mounted) return;
        if (c) setControl(c);
        setBroadcasts(b);
      } catch (e: any) {
        reportError('AppGate check failed: ' + (e?.message || String(e)));
      } finally {
        if (mounted) setChecked(true);
      }
    }

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);

    // অপ্রত্যাশিত জাভাস্ক্রিপ্ট এরর কন্ট্রোল রুমে রিপোর্ট করা
    const onError = (e: ErrorEvent) => reportError(e.message);
    const onRejection = (e: PromiseRejectionEvent) => reportError('Unhandled promise: ' + String(e.reason));
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  // এখনো প্রথম চেক শেষ হয়নি — একটা ছোট লোডার দেখানো (অ্যাপ ব্লক করে
  // রাখা ঠিক না যদি নেটওয়ার্ক ধীর হয়, তাই বেশিক্ষণ আটকাবে না)
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  // কন্ট্রোল রুম থেকে ডেটা না পাওয়া গেলে (যেমন নেট নেই) অ্যাপ ব্লক করা
  // হবে না — শুধু kill-switch পাওয়া গেলেই বন্ধ করা হবে।
  if (control && control.is_enabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-6 text-center">
        <div>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-2xl">
            ⏻
          </div>
          <h1 className="text-lg font-bold mb-2">অ্যাপটি সাময়িক বন্ধ আছে</h1>
          <p className="text-slate-300 text-sm max-w-xs mx-auto">{control.lock_message}</p>
        </div>
      </div>
    );
  }

  if (control && isVersionOlder(APP_VERSION, control.min_version)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-6 text-center">
        <div>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
            ⬆
          </div>
          <h1 className="text-lg font-bold mb-2">নতুন ভার্সন প্রয়োজন</h1>
          <p className="text-slate-300 text-sm max-w-xs mx-auto mb-4">{control.update_message}</p>
          {control.update_url && (
            <a
              href={control.update_url}
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              আপডেট ডাউনলোড করুন
            </a>
          )}
        </div>
      </div>
    );
  }

  const visibleBroadcasts = broadcasts.filter((b) => !dismissed.includes(b.id));

  return (
    <>
      {visibleBroadcasts.map((b) => (
        <div
          key={b.id}
          className="bg-amber-500 text-amber-950 text-sm px-4 py-2 flex items-center justify-between gap-3"
        >
          <span>{b.message}</span>
          <button
            onClick={() => setDismissed((d) => [...d, b.id])}
            className="shrink-0 opacity-70 hover:opacity-100"
            aria-label="বন্ধ করুন"
          >
            ✕
          </button>
        </div>
      ))}
      {children}
    </>
  );
}
