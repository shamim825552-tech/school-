import { createClient } from '@supabase/supabase-js';

// এই দুটো একটা publishable/anon key — ক্লায়েন্ট (ব্রাউজার/অ্যাপ) কোডে
// এমবেড থাকার জন্যই বানানো, তাই সরাসরি এখানে রাখা নিরাপদ।
// .env ফাইলে VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY দেওয়া
// থাকলে সেটাই ব্যবহার হবে, না থাকলে (বা বিল্ডে না জোড়া লাগলে) এই
// ফলব্যাক মান ব্যবহার হবে — তাই .env মিস হলেও অ্যাপ ভেঙে পড়বে না।
const FALLBACK_URL = 'https://icrkvktjpfdwcxqdzbgg.supabase.co';
const FALLBACK_KEY = 'sb_publishable_cBqBGnCATf849i3x3RbgMQ_mx6EFdzU';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || FALLBACK_URL;
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
