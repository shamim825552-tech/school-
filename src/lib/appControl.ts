import { supabase } from './supabaseClient';

// package.json-এর version-এর সাথে মিলিয়ে রাখো — কন্ট্রোল রুমের
// "সর্বনিম্ন ভার্সন" এর সাথে তুলনা করার জন্য।
export const APP_VERSION = '1.0.0';

export interface AppControl {
  is_enabled: boolean;
  lock_message: string;
  min_version: string;
  update_message: string;
  update_url: string;
}

export interface Broadcast {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

let flagCache: Record<string, boolean> = {};

export async function fetchAppControl(): Promise<AppControl | null> {
  const { data, error } = await supabase.from('app_control').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return null;
  return data as AppControl;
}

export async function fetchActiveBroadcasts(): Promise<Broadcast[]> {
  const { data } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

export async function refreshFeatureFlags(): Promise<Record<string, boolean>> {
  const { data } = await supabase.from('feature_flags').select('key,enabled');
  const next: Record<string, boolean> = {};
  (data || []).forEach((f: any) => { next[f.key] = f.enabled; });
  flagCache = next;
  return next;
}

// কোনো কম্পোনেন্টে ব্যবহার করতে: isFeatureEnabled('voice_messages')
// (রিফ্রেশ হওয়া আগ পর্যন্ত ক্যাশ করা মান দেখাবে, ডিফল্ট true যদি
// এখনো লোড না হয়ে থাকে — যাতে ফ্ল্যাগ টেবিল খালি থাকলেও ফিচার ভাঙে না)
export function isFeatureEnabled(key: string): boolean {
  return flagCache[key] !== undefined ? flagCache[key] : true;
}

// দুইটা "x.y.z" ভার্সন তুলনা — current < min হলে true
export function isVersionOlder(current: string, min: string): boolean {
  const c = current.split('.').map(Number);
  const m = min.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, m.length); i++) {
    const cn = c[i] || 0, mn = m[i] || 0;
    if (cn < mn) return true;
    if (cn > mn) return false;
  }
  return false;
}

// অ্যাপে কোনো এরর ধরা পড়লে কন্ট্রোল রুমে রিপোর্ট করা (ব্যর্থ হলেও
// অ্যাপ চালানো বন্ধ হবে না, তাই সব সময় .catch দিয়ে ধরা)
export async function reportError(message: string, userId?: string) {
  try {
    await supabase.from('error_logs').insert({
      message: message.slice(0, 2000),
      device_info: navigator.userAgent.slice(0, 300),
      user_id: userId || null,
    });
  } catch {
    // নেটওয়ার্ক না থাকলে বা টেবিল না থাকলে চুপচাপ উপেক্ষা করা হচ্ছে
  }
}

// লগইন করা ইউজারের "শেষ সক্রিয়" সময় আপডেট করা (কন্ট্রোল রুমের
// ইউজার লিস্টে "শেষ সক্রিয়: X মিনিট আগে" দেখানোর জন্য)
export async function pingLastSeen(userId: string) {
  try {
    await supabase.from('users').update({ last_seen: Date.now() }).eq('id', userId);
  } catch {
    // ব্যর্থ হলে উপেক্ষা করা হচ্ছে, এটা critical না
  }
}

// লগইন করা ইউজর ব্যান করা আছে কিনা চেক করা
export async function isUserBanned(userId: string): Promise<{ banned: boolean; reason?: string }> {
  const { data } = await supabase.from('users').select('is_banned,ban_reason').eq('id', userId).maybeSingle();
  if (!data) return { banned: false };
  return { banned: !!data.is_banned, reason: data.ban_reason || undefined };
}
