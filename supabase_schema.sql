-- ভোলাচং উচ্চ বিদ্যালয় Attendance App — Supabase Schema
-- এই পুরো ফাইলটি Supabase Dashboard > SQL Editor -এ পেস্ট করে "Run" চাপুন।

create table if not exists users (
  id text primary key,
  name text not null,
  role text not null check (role in ('admin', 'teacher', 'parent')),
  phone text not null,
  email text,
  password text not null,
  assigned_class text,
  assigned_section text,
  child_id text
);

create table if not exists classes (
  id text primary key,
  name text not null,
  sections text[] not null default '{}',
  assigned_teacher_id text
);

create table if not exists students (
  id text primary key,
  name text not null,
  roll integer not null,
  class_id text not null references classes(id) on delete cascade,
  section text not null,
  parent_name text not null,
  parent_phone text not null,
  parent_id text,
  photo text
);

create table if not exists attendance (
  id text primary key,
  student_id text not null references students(id) on delete cascade,
  date text not null,
  status text not null check (status in ('present', 'absent', 'late')),
  class_id text not null,
  section text not null,
  marked_by text not null,
  "timestamp" bigint not null
);

create table if not exists notifications (
  id text primary key,
  student_id text not null,
  student_name text not null,
  parent_phone text not null,
  message text not null,
  date text not null,
  "timestamp" bigint not null,
  type text not null check (type in ('sms', 'push')),
  status text not null check (status in ('sent', 'pending', 'failed'))
);

create table if not exists subjects (
  id text primary key,
  class_id text not null references classes(id) on delete cascade,
  name text not null,
  full_marks integer not null default 100
);

create table if not exists exams (
  id text primary key,
  name text not null,
  class_id text not null references classes(id) on delete cascade,
  academic_year text not null,
  exam_date text not null
);

create table if not exists results (
  id text primary key,
  exam_id text not null references exams(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  subject_id text not null references subjects(id) on delete cascade,
  marks_obtained numeric not null,
  full_marks numeric not null
);

create table if not exists fees (
  id text primary key,
  student_id text not null references students(id) on delete cascade,
  title text not null,
  amount numeric not null,
  month text,
  year text not null,
  due_date text not null,
  status text not null check (status in ('due', 'paid', 'partial')),
  paid_amount numeric not null default 0,
  paid_date text,
  method text check (method in ('cash', 'bkash', 'nagad', 'bank', 'other')),
  note text
);

create table if not exists routines (
  id text primary key,
  class_id text not null references classes(id) on delete cascade,
  section text not null,
  day text not null,
  period integer not null,
  subject_name text not null,
  teacher_id text,
  start_time text not null,
  end_time text not null
);

create table if not exists homework (
  id text primary key,
  class_id text not null references classes(id) on delete cascade,
  section text not null,
  subject_name text not null,
  title text not null,
  description text not null default '',
  assigned_date text not null,
  due_date text not null,
  teacher_id text not null
);

create index if not exists idx_students_class on students(class_id);
create index if not exists idx_subjects_class on subjects(class_id);
create index if not exists idx_exams_class on exams(class_id);
create index if not exists idx_results_exam on results(exam_id);
create index if not exists idx_results_student on results(student_id);
create index if not exists idx_fees_student on fees(student_id);
create index if not exists idx_routines_class on routines(class_id, section);
create index if not exists idx_homework_class on homework(class_id, section);
create index if not exists idx_attendance_student on attendance(student_id);
create index if not exists idx_attendance_date on attendance(date);
create index if not exists idx_notifications_student on notifications(student_id);

create table if not exists announcements (
  id text primary key,
  title text not null,
  message text not null,
  audience text not null check (audience in ('all', 'teacher', 'parent')),
  class_id text,
  pinned boolean not null default false,
  created_by text not null,
  date text not null,
  "timestamp" bigint not null
);

create table if not exists books (
  id text primary key,
  title text not null,
  author text not null,
  category text not null,
  isbn text,
  total_copies integer not null default 1,
  available_copies integer not null default 1
);

create table if not exists book_issues (
  id text primary key,
  book_id text not null references books(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  issue_date text not null,
  due_date text not null,
  return_date text,
  status text not null check (status in ('issued', 'returned'))
);

create table if not exists syllabus (
  id text primary key,
  class_id text not null references classes(id) on delete cascade,
  section text not null,
  subject_name text not null,
  topic text not null,
  status text not null check (status in ('pending', 'in_progress', 'completed')),
  teacher_id text not null,
  updated_date text not null
);

create table if not exists expenses (
  id text primary key,
  title text not null,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  date text not null,
  note text
);

create table if not exists leave_applications (
  id text primary key,
  student_id text not null references students(id) on delete cascade,
  from_date text not null,
  to_date text not null,
  reason text not null,
  applied_by text not null,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  responded_by text,
  response_note text,
  date text not null,
  "timestamp" bigint not null
);

create table if not exists complaints (
  id text primary key,
  submitted_by_id text not null,
  submitted_by_name text not null,
  submitted_by_role text not null check (submitted_by_role in ('admin', 'teacher', 'parent')),
  phone text,
  category text not null check (category in ('academic', 'behavior', 'facility', 'transport', 'financial', 'other')),
  subject text not null,
  message text not null,
  status text not null check (status in ('open', 'in_progress', 'resolved')),
  admin_reply text,
  date text not null,
  "timestamp" bigint not null
);

create table if not exists events (
  id text primary key,
  title text not null,
  description text,
  date text not null,
  end_date text,
  category text not null check (category in ('exam', 'holiday', 'meeting', 'sports', 'cultural', 'other')),
  created_by text not null,
  "timestamp" bigint not null
);

create table if not exists salaries (
  id text primary key,
  teacher_id text not null,
  month text not null,
  year text not null,
  basic_amount numeric not null,
  bonus numeric not null default 0,
  deduction numeric not null default 0,
  net_amount numeric not null,
  status text not null check (status in ('paid', 'due')),
  paid_date text,
  method text check (method in ('cash', 'bkash', 'nagad', 'bank', 'other')),
  note text,
  "timestamp" bigint not null
);

create table if not exists staff_attendance (
  id text primary key,
  teacher_id text not null,
  date text not null,
  status text not null check (status in ('present', 'absent', 'leave', 'late')),
  note text,
  marked_by text not null,
  "timestamp" bigint not null
);

-- শিক্ষকদের গ্রুপ মেসেজিং/চ্যাট
create table if not exists teacher_messages (
  id text primary key,
  sender_id text not null,
  sender_name text not null,
  message text,
  image_url text,
  audio_url text,
  reactions jsonb not null default '{}'::jsonb,
  "timestamp" bigint not null
);
-- আগে থেকে টেবিল থাকলেও নতুন কলামগুলো যোগ হবে (আগের রান থেকে থাকলে সমস্যা হবে না)
alter table teacher_messages add column if not exists audio_url text;
alter table teacher_messages add column if not exists reactions jsonb not null default '{}'::jsonb;

-- AI সহকারী — সেটিংস (শুধু ১টি রো, id সবসময় 'default')
create table if not exists ai_settings (
  id text primary key default 'default',
  enabled boolean not null default true,
  provider text not null default 'openai' check (provider in ('openai', 'anthropic', 'gemini', 'custom')),
  api_key text not null default '',
  model text not null default '',
  base_url text,
  system_prompt text,
  updated_at bigint not null default 0
);

-- AI সহকারী — প্রশ্ন-উত্তরের ইতিহাস (প্রতি ব্যবহারকারীর নিজস্ব চ্যাট)
create table if not exists ai_chat_messages (
  id text primary key,
  user_id text not null,
  user_name text not null,
  user_role text not null check (user_role in ('admin', 'teacher', 'parent')),
  role text not null check (role in ('user', 'assistant')),
  message text,
  image_url text,
  is_error boolean not null default false,
  "timestamp" bigint not null
);
create index if not exists idx_ai_chat_user on ai_chat_messages(user_id);

-- ============================================================
-- Storage — শিক্ষক গ্রুপ চ্যাটের ছবি/ভয়েস মেসেজ রাখার জন্য bucket
-- (আগে এগুলো সরাসরি ডেটাবেজে বড় base64 টেক্সট হিসেবে রাখা হতো, যার
-- ফলে অনেক সময় ছবি আপলোড ব্যর্থ/ধীর হতো — তাই এখন Supabase Storage
-- ব্যবহার করা হচ্ছে, যা ছবি/অডিওর জন্য বেশি নির্ভরযোগ্য)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

drop policy if exists "chat media public read" on storage.objects;
create policy "chat media public read" on storage.objects
  for select using (bucket_id = 'chat-media');

drop policy if exists "chat media public insert" on storage.objects;
create policy "chat media public insert" on storage.objects
  for insert with check (bucket_id = 'chat-media');

drop policy if exists "chat media public delete" on storage.objects;
create policy "chat media public delete" on storage.objects
  for delete using (bucket_id = 'chat-media');

-- ============================================================
-- Row Level Security
-- ============================================================
-- ⚠️ গুরুত্বপূর্ণ: এই অ্যাপ Supabase Auth ব্যবহার করছে না (নিজস্ব
-- users টেবিল দিয়ে লগইন যাচাই করা হয়)। তাই publishable/anon key
-- দিয়ে ব্রাউজার থেকে সরাসরি এই টেবিলগুলোতে অ্যাক্সেস করতে হলে
-- RLS-এ "সবার জন্য অনুমতি" (permissive) policy দিতে হচ্ছে।
--
-- এর মানে: APK/ওয়েবসাইট decompile/inspect করলে যে কেউ এই key
-- দিয়ে সরাসরি ডেটাবেসে read/write করতে পারবে (school-এর ভেতরের
-- ব্যবহারের জন্য গ্রহণযোগ্য ঝুঁকি হতে পারে, কিন্তু পাবলিক প্রোডাকশনের
-- জন্য নয়)। প্রকৃত নিরাপত্তার জন্য পরবর্তীতে Supabase Auth + প্রতিটি
-- টেবিলে role-ভিত্তিক নির্দিষ্ট policy বসানো উচিত।
-- ============================================================

alter table users enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;
alter table notifications enable row level security;
alter table subjects enable row level security;
alter table exams enable row level security;
alter table results enable row level security;
alter table fees enable row level security;
alter table routines enable row level security;
alter table homework enable row level security;
alter table announcements enable row level security;
alter table books enable row level security;
alter table book_issues enable row level security;
alter table syllabus enable row level security;
alter table expenses enable row level security;
alter table leave_applications enable row level security;
alter table complaints enable row level security;
alter table events enable row level security;
alter table salaries enable row level security;

drop policy if exists "allow all users" on users;
create policy "allow all users" on users for all using (true) with check (true);

drop policy if exists "allow all classes" on classes;
create policy "allow all classes" on classes for all using (true) with check (true);

drop policy if exists "allow all students" on students;
create policy "allow all students" on students for all using (true) with check (true);

drop policy if exists "allow all attendance" on attendance;
create policy "allow all attendance" on attendance for all using (true) with check (true);

drop policy if exists "allow all notifications" on notifications;
create policy "allow all notifications" on notifications for all using (true) with check (true);

drop policy if exists "allow all subjects" on subjects;
create policy "allow all subjects" on subjects for all using (true) with check (true);

drop policy if exists "allow all exams" on exams;
create policy "allow all exams" on exams for all using (true) with check (true);

drop policy if exists "allow all results" on results;
create policy "allow all results" on results for all using (true) with check (true);

drop policy if exists "allow all fees" on fees;
create policy "allow all fees" on fees for all using (true) with check (true);

drop policy if exists "allow all routines" on routines;
create policy "allow all routines" on routines for all using (true) with check (true);

drop policy if exists "allow all homework" on homework;
create policy "allow all homework" on homework for all using (true) with check (true);

drop policy if exists "allow all announcements" on announcements;
create policy "allow all announcements" on announcements for all using (true) with check (true);

drop policy if exists "allow all books" on books;
create policy "allow all books" on books for all using (true) with check (true);

drop policy if exists "allow all book_issues" on book_issues;
create policy "allow all book_issues" on book_issues for all using (true) with check (true);

drop policy if exists "allow all syllabus" on syllabus;
create policy "allow all syllabus" on syllabus for all using (true) with check (true);

drop policy if exists "allow all expenses" on expenses;
create policy "allow all expenses" on expenses for all using (true) with check (true);

drop policy if exists "allow all leave_applications" on leave_applications;
create policy "allow all leave_applications" on leave_applications for all using (true) with check (true);

drop policy if exists "allow all complaints" on complaints;
create policy "allow all complaints" on complaints for all using (true) with check (true);

drop policy if exists "allow all events" on events;
create policy "allow all events" on events for all using (true) with check (true);

drop policy if exists "allow all salaries" on salaries;
create policy "allow all salaries" on salaries for all using (true) with check (true);

alter table staff_attendance enable row level security;
drop policy if exists "allow all staff_attendance" on staff_attendance;
create policy "allow all staff_attendance" on staff_attendance for all using (true) with check (true);

alter table teacher_messages enable row level security;
drop policy if exists "allow all teacher_messages" on teacher_messages;
create policy "allow all teacher_messages" on teacher_messages for all using (true) with check (true);

-- ⚠️ ai_settings টেবিলে API key থাকে। এই অ্যাপের অন্য সব টেবিলের মতোই
-- এখানে "সবার জন্য অনুমতি" policy ব্যবহার করা হচ্ছে (কারণ অ্যাপটি
-- Supabase Auth ছাড়া চলে) — শুধুমাত্র UI লেভেলে (মেনুতে) admin ছাড়া
-- বাকিদের "AI সেটিংস" পেজ দেখানো হয় না। প্রকৃত নিরাপত্তার জন্য চাইলে
-- Supabase Auth চালু করে শুধু admin role-কে write অনুমতি দেওয়া যায়।
alter table ai_settings enable row level security;
drop policy if exists "allow all ai_settings" on ai_settings;
create policy "allow all ai_settings" on ai_settings for all using (true) with check (true);

alter table ai_chat_messages enable row level security;
drop policy if exists "allow all ai_chat_messages" on ai_chat_messages;
create policy "allow all ai_chat_messages" on ai_chat_messages for all using (true) with check (true);

-- realtime এর জন্য টেবিলটি publication-এ যোগ করা (Supabase realtime সাবস্ক্রিপশনের জন্য প্রয়োজন)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'teacher_messages'
  ) then
    alter publication supabase_realtime add table teacher_messages;
  end if;
end $$;

-- ============================================================
-- ইউজার ব্লক/আনব্লক, মেয়াদ ও শিক্ষার্থী আইডি কার্ড অতিরিক্ত তথ্য
-- (পুরনো ডাটাবেজে চালালেও নিরাপদ — কলাম আগে থেকে থাকলে কিছু হবে না)
-- ============================================================
alter table users add column if not exists is_blocked boolean not null default false;
alter table users add column if not exists blocked_reason text;
alter table users add column if not exists expires_at bigint;

alter table students add column if not exists student_id_no text;
alter table students add column if not exists blood_group text;
alter table students add column if not exists date_of_birth text;
alter table students add column if not exists address text;
alter table students add column if not exists card_updated_at bigint;

-- ============================================================
-- অভিভাবক ভেরিফিকেশন — NID ও সন্তানের জন্ম নিবন্ধন
-- ============================================================
create table if not exists parent_verifications (
  id text primary key,
  parent_id text not null,
  parent_name text not null,
  parent_phone text not null,
  child_id text,
  child_name text,
  nid_number text,
  nid_image text,
  birth_reg_number text,
  birth_reg_image text,
  status text not null check (status in ('pending', 'verified', 'rejected')),
  submitted_at bigint not null,
  updated_at bigint not null,
  verified_by text,
  verified_by_name text,
  verified_at bigint,
  rejection_reason text
);

alter table parent_verifications enable row level security;
drop policy if exists "allow all parent_verifications" on parent_verifications;
create policy "allow all parent_verifications" on parent_verifications for all using (true) with check (true);
