import { supabase } from './lib/supabaseClient';
import {
  User, Student, ClassInfo, AttendanceRecord, Notification,
  Subject, Exam, ResultRecord, FeeInvoice, RoutinePeriod, Homework,
  Announcement, LibraryBook, BookIssue, SyllabusItem, ExpenseRecord,
  LeaveApplication, Complaint, SchoolEvent, SalaryRecord, StaffAttendanceRecord,
  ParentVerification,
} from './types';

// ============================================================
// Seed data — শুধুমাত্র প্রথমবার Supabase টেবিল খালি থাকলে ব্যবহৃত হয়
// শুধু একটি অ্যাডমিন অ্যাকাউন্ট থাকবে; কোনো ডেমো শিক্ষক/অভিভাবক/
// শিক্ষার্থী/ক্লাস থাকবে না — অ্যাডমিন নিজে অ্যাপ থেকে সব যোগ করবেন।
// ============================================================
const DEFAULT_USERS: User[] = [
  { id: 'admin1', name: 'অ্যাডমিন', role: 'admin', phone: '01305933871', password: 'Bangla@1234' },
];

const DEFAULT_CLASSES: ClassInfo[] = [];

const DEFAULT_STUDENTS: Student[] = [];

function generateSampleAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 5 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];
    DEFAULT_STUDENTS.forEach(student => {
      const rand = Math.random();
      let status: 'present' | 'absent' | 'late' = 'present';
      if (rand < 0.1) status = 'absent';
      else if (rand < 0.18) status = 'late';
      records.push({
        id: `att-${dateStr}-${student.id}`,
        studentId: student.id,
        date: dateStr,
        status,
        classId: student.classId,
        section: student.section,
        markedBy: 'teacher1',
        timestamp: date.getTime(),
      });
    });
  }
  return records;
}

function generateSampleNotifications(attendance: AttendanceRecord[], students: Student[]): Notification[] {
  const notifs: Notification[] = [];
  attendance.filter(a => a.status === 'absent').forEach(a => {
    const student = students.find(s => s.id === a.studentId);
    if (student) {
      notifs.push({
        id: `notif-${a.id}`,
        studentId: student.id,
        studentName: student.name,
        parentPhone: student.parentPhone,
        message: `প্রিয় অভিভাবক, আপনার সন্তান ${student.name} আজ ভোলাচং উচ্চ বিদ্যালয়ে অনুপস্থিত রয়েছে। অনুগ্রহ করে প্রয়োজনীয় ব্যবস্থা নিন। — ভোলাচং উচ্চ বিদ্যালয়`,
        date: a.date,
        timestamp: a.timestamp,
        type: 'sms',
        status: 'sent',
      });
    }
  });
  return notifs;
}

// ============================================================
// Supabase <-> App টাইপ ম্যাপার (camelCase <-> snake_case)
// ============================================================
const toDbUser = (u: User) => ({
  id: u.id, name: u.name, role: u.role, phone: u.phone, email: u.email ?? null,
  password: u.password, assigned_class: u.assignedClass ?? null,
  assigned_section: u.assignedSection ?? null, child_id: u.childId ?? null,
  is_blocked: u.isBlocked ?? false, blocked_reason: u.blockedReason ?? null,
  expires_at: u.expiresAt ?? null,
});
const fromDbUser = (r: any): User => ({
  id: r.id, name: r.name, role: r.role, phone: r.phone, email: r.email ?? undefined,
  password: r.password, assignedClass: r.assigned_class ?? undefined,
  assignedSection: r.assigned_section ?? undefined, childId: r.child_id ?? undefined,
  isBlocked: r.is_blocked ?? false, blockedReason: r.blocked_reason ?? undefined,
  expiresAt: r.expires_at ?? undefined,
});

const toDbClass = (c: ClassInfo) => ({
  id: c.id, name: c.name, sections: c.sections, assigned_teacher_id: c.assignedTeacherId ?? null,
});
const fromDbClass = (r: any): ClassInfo => ({
  id: r.id, name: r.name, sections: r.sections ?? [], assignedTeacherId: r.assigned_teacher_id ?? undefined,
});

const toDbStudent = (s: Student) => ({
  id: s.id, name: s.name, roll: s.roll, class_id: s.classId, section: s.section,
  parent_name: s.parentName, parent_phone: s.parentPhone, parent_id: s.parentId ?? null,
  photo: s.photo ?? null,
  student_id_no: s.studentIdNo ?? null, blood_group: s.bloodGroup ?? null,
  date_of_birth: s.dateOfBirth ?? null, address: s.address ?? null,
  card_updated_at: s.cardUpdatedAt ?? null,
});
const fromDbStudent = (r: any): Student => ({
  id: r.id, name: r.name, roll: r.roll, classId: r.class_id, section: r.section,
  parentName: r.parent_name, parentPhone: r.parent_phone, parentId: r.parent_id ?? undefined,
  photo: r.photo ?? undefined,
  studentIdNo: r.student_id_no ?? undefined, bloodGroup: r.blood_group ?? undefined,
  dateOfBirth: r.date_of_birth ?? undefined, address: r.address ?? undefined,
  cardUpdatedAt: r.card_updated_at ?? undefined,
});

const toDbAttendance = (a: AttendanceRecord) => ({
  id: a.id, student_id: a.studentId, date: a.date, status: a.status,
  class_id: a.classId, section: a.section, marked_by: a.markedBy, timestamp: a.timestamp,
});
const fromDbAttendance = (r: any): AttendanceRecord => ({
  id: r.id, studentId: r.student_id, date: r.date, status: r.status,
  classId: r.class_id, section: r.section, markedBy: r.marked_by, timestamp: r.timestamp,
});

const toDbNotification = (n: Notification) => ({
  id: n.id, student_id: n.studentId, student_name: n.studentName, parent_phone: n.parentPhone,
  message: n.message, date: n.date, timestamp: n.timestamp, type: n.type, status: n.status,
});
const fromDbNotification = (r: any): Notification => ({
  id: r.id, studentId: r.student_id, studentName: r.student_name, parentPhone: r.parent_phone,
  message: r.message, date: r.date, timestamp: r.timestamp, type: r.type, status: r.status,
});

const toDbSubject = (s: Subject) => ({
  id: s.id, class_id: s.classId, name: s.name, full_marks: s.fullMarks,
});
const fromDbSubject = (r: any): Subject => ({
  id: r.id, classId: r.class_id, name: r.name, fullMarks: r.full_marks,
});

const toDbExam = (e: Exam) => ({
  id: e.id, name: e.name, class_id: e.classId, academic_year: e.academicYear, exam_date: e.examDate,
});
const fromDbExam = (r: any): Exam => ({
  id: r.id, name: r.name, classId: r.class_id, academicYear: r.academic_year, examDate: r.exam_date,
});

const toDbResult = (r: ResultRecord) => ({
  id: r.id, exam_id: r.examId, student_id: r.studentId, subject_id: r.subjectId,
  marks_obtained: r.marksObtained, full_marks: r.fullMarks,
});
const fromDbResult = (r: any): ResultRecord => ({
  id: r.id, examId: r.exam_id, studentId: r.student_id, subjectId: r.subject_id,
  marksObtained: r.marks_obtained, fullMarks: r.full_marks,
});

const toDbFee = (f: FeeInvoice) => ({
  id: f.id, student_id: f.studentId, title: f.title, amount: f.amount, month: f.month ?? null,
  year: f.year, due_date: f.dueDate, status: f.status, paid_amount: f.paidAmount,
  paid_date: f.paidDate ?? null, method: f.method ?? null, note: f.note ?? null,
});
const fromDbFee = (r: any): FeeInvoice => ({
  id: r.id, studentId: r.student_id, title: r.title, amount: r.amount, month: r.month ?? undefined,
  year: r.year, dueDate: r.due_date, status: r.status, paidAmount: r.paid_amount,
  paidDate: r.paid_date ?? undefined, method: r.method ?? undefined, note: r.note ?? undefined,
});

const toDbRoutine = (p: RoutinePeriod) => ({
  id: p.id, class_id: p.classId, section: p.section, day: p.day, period: p.period,
  subject_name: p.subjectName, teacher_id: p.teacherId ?? null, start_time: p.startTime, end_time: p.endTime,
});
const fromDbRoutine = (r: any): RoutinePeriod => ({
  id: r.id, classId: r.class_id, section: r.section, day: r.day, period: r.period,
  subjectName: r.subject_name, teacherId: r.teacher_id ?? undefined, startTime: r.start_time, endTime: r.end_time,
});

const toDbHomework = (h: Homework) => ({
  id: h.id, class_id: h.classId, section: h.section, subject_name: h.subjectName, title: h.title,
  description: h.description, assigned_date: h.assignedDate, due_date: h.dueDate, teacher_id: h.teacherId,
});
const fromDbHomework = (r: any): Homework => ({
  id: r.id, classId: r.class_id, section: r.section, subjectName: r.subject_name, title: r.title,
  description: r.description, assignedDate: r.assigned_date, dueDate: r.due_date, teacherId: r.teacher_id,
});

const toDbAnnouncement = (a: Announcement) => ({
  id: a.id, title: a.title, message: a.message, audience: a.audience, class_id: a.classId ?? null,
  pinned: a.pinned, created_by: a.createdBy, date: a.date, timestamp: a.timestamp,
});
const fromDbAnnouncement = (r: any): Announcement => ({
  id: r.id, title: r.title, message: r.message, audience: r.audience, classId: r.class_id ?? undefined,
  pinned: r.pinned, createdBy: r.created_by, date: r.date, timestamp: r.timestamp,
});

const toDbBook = (b: LibraryBook) => ({
  id: b.id, title: b.title, author: b.author, category: b.category, isbn: b.isbn ?? null,
  total_copies: b.totalCopies, available_copies: b.availableCopies,
});
const fromDbBook = (r: any): LibraryBook => ({
  id: r.id, title: r.title, author: r.author, category: r.category, isbn: r.isbn ?? undefined,
  totalCopies: r.total_copies, availableCopies: r.available_copies,
});

const toDbBookIssue = (i: BookIssue) => ({
  id: i.id, book_id: i.bookId, student_id: i.studentId, issue_date: i.issueDate,
  due_date: i.dueDate, return_date: i.returnDate ?? null, status: i.status,
});
const fromDbBookIssue = (r: any): BookIssue => ({
  id: r.id, bookId: r.book_id, studentId: r.student_id, issueDate: r.issue_date,
  dueDate: r.due_date, returnDate: r.return_date ?? undefined, status: r.status,
});

const toDbSyllabus = (s: SyllabusItem) => ({
  id: s.id, class_id: s.classId, section: s.section, subject_name: s.subjectName, topic: s.topic,
  status: s.status, teacher_id: s.teacherId, updated_date: s.updatedDate,
});
const fromDbSyllabus = (r: any): SyllabusItem => ({
  id: r.id, classId: r.class_id, section: r.section, subjectName: r.subject_name, topic: r.topic,
  status: r.status, teacherId: r.teacher_id, updatedDate: r.updated_date,
});

const toDbExpense = (e: ExpenseRecord) => ({
  id: e.id, title: e.title, category: e.category, type: e.type, amount: e.amount,
  date: e.date, note: e.note ?? null,
});
const fromDbExpense = (r: any): ExpenseRecord => ({
  id: r.id, title: r.title, category: r.category, type: r.type, amount: r.amount,
  date: r.date, note: r.note ?? undefined,
});

const toDbLeave = (l: LeaveApplication) => ({
  id: l.id, student_id: l.studentId, from_date: l.fromDate, to_date: l.toDate, reason: l.reason,
  applied_by: l.appliedBy, status: l.status, responded_by: l.respondedBy ?? null,
  response_note: l.responseNote ?? null, date: l.date, timestamp: l.timestamp,
});
const fromDbLeave = (r: any): LeaveApplication => ({
  id: r.id, studentId: r.student_id, fromDate: r.from_date, toDate: r.to_date, reason: r.reason,
  appliedBy: r.applied_by, status: r.status, respondedBy: r.responded_by ?? undefined,
  responseNote: r.response_note ?? undefined, date: r.date, timestamp: r.timestamp,
});

const toDbComplaint = (c: Complaint) => ({
  id: c.id, submitted_by_id: c.submittedById, submitted_by_name: c.submittedByName,
  submitted_by_role: c.submittedByRole, phone: c.phone ?? null, category: c.category,
  subject: c.subject, message: c.message, status: c.status, admin_reply: c.adminReply ?? null,
  date: c.date, timestamp: c.timestamp,
});
const fromDbComplaint = (r: any): Complaint => ({
  id: r.id, submittedById: r.submitted_by_id, submittedByName: r.submitted_by_name,
  submittedByRole: r.submitted_by_role, phone: r.phone ?? undefined, category: r.category,
  subject: r.subject, message: r.message, status: r.status, adminReply: r.admin_reply ?? undefined,
  date: r.date, timestamp: r.timestamp,
});

const toDbEvent = (e: SchoolEvent) => ({
  id: e.id, title: e.title, description: e.description ?? null, date: e.date,
  end_date: e.endDate ?? null, category: e.category, created_by: e.createdBy, timestamp: e.timestamp,
});
const fromDbEvent = (r: any): SchoolEvent => ({
  id: r.id, title: r.title, description: r.description ?? undefined, date: r.date,
  endDate: r.end_date ?? undefined, category: r.category, createdBy: r.created_by, timestamp: r.timestamp,
});

const toDbSalary = (s: SalaryRecord) => ({
  id: s.id, teacher_id: s.teacherId, month: s.month, year: s.year, basic_amount: s.basicAmount,
  bonus: s.bonus, deduction: s.deduction, net_amount: s.netAmount, status: s.status,
  paid_date: s.paidDate ?? null, method: s.method ?? null, note: s.note ?? null, timestamp: s.timestamp,
});
const fromDbSalary = (r: any): SalaryRecord => ({
  id: r.id, teacherId: r.teacher_id, month: r.month, year: r.year, basicAmount: r.basic_amount,
  bonus: r.bonus, deduction: r.deduction, netAmount: r.net_amount, status: r.status,
  paidDate: r.paid_date ?? undefined, method: r.method ?? undefined, note: r.note ?? undefined,
  timestamp: r.timestamp,
});

const toDbStaffAttendance = (s: StaffAttendanceRecord) => ({
  id: s.id, teacher_id: s.teacherId, date: s.date, status: s.status,
  note: s.note ?? null, marked_by: s.markedBy, timestamp: s.timestamp,
});
const fromDbStaffAttendance = (r: any): StaffAttendanceRecord => ({
  id: r.id, teacherId: r.teacher_id, date: r.date, status: r.status,
  note: r.note ?? undefined, markedBy: r.marked_by, timestamp: r.timestamp,
});

const toDbVerification = (v: ParentVerification) => ({
  id: v.id, parent_id: v.parentId, parent_name: v.parentName, parent_phone: v.parentPhone,
  child_id: v.childId ?? null, child_name: v.childName ?? null,
  nid_number: v.nidNumber ?? null, nid_image: v.nidImage ?? null,
  birth_reg_number: v.birthRegNumber ?? null, birth_reg_image: v.birthRegImage ?? null,
  status: v.status, submitted_at: v.submittedAt, updated_at: v.updatedAt,
  verified_by: v.verifiedBy ?? null, verified_by_name: v.verifiedByName ?? null,
  verified_at: v.verifiedAt ?? null, rejection_reason: v.rejectionReason ?? null,
});
const fromDbVerification = (r: any): ParentVerification => ({
  id: r.id, parentId: r.parent_id, parentName: r.parent_name, parentPhone: r.parent_phone,
  childId: r.child_id ?? undefined, childName: r.child_name ?? undefined,
  nidNumber: r.nid_number ?? undefined, nidImage: r.nid_image ?? undefined,
  birthRegNumber: r.birth_reg_number ?? undefined, birthRegImage: r.birth_reg_image ?? undefined,
  status: r.status, submittedAt: r.submitted_at, updatedAt: r.updated_at,
  verifiedBy: r.verified_by ?? undefined, verifiedByName: r.verified_by_name ?? undefined,
  verifiedAt: r.verified_at ?? undefined, rejectionReason: r.rejection_reason ?? undefined,
});

// ============================================================
// In-memory cache — বাকি সব কম্পোনেন্ট এখনও sync ফাংশন কল করে
// (getStudents(), saveStudents() ইত্যাদি), তাই সেগুলো অপরিবর্তিত
// রেখে ভেতরে Supabase-এর সাথে sync করা হচ্ছে।
// ============================================================
let usersCache: User[] = [];
let studentsCache: Student[] = [];
let classesCache: ClassInfo[] = [];
let attendanceCache: AttendanceRecord[] = [];
let notificationsCache: Notification[] = [];
let subjectsCache: Subject[] = [];
let examsCache: Exam[] = [];
let resultsCache: ResultRecord[] = [];
let feesCache: FeeInvoice[] = [];
let routinesCache: RoutinePeriod[] = [];
let homeworkCache: Homework[] = [];
let announcementsCache: Announcement[] = [];
let booksCache: LibraryBook[] = [];
let bookIssuesCache: BookIssue[] = [];
let syllabusCache: SyllabusItem[] = [];
let expensesCache: ExpenseRecord[] = [];
let leaveCache: LeaveApplication[] = [];
let complaintsCache: Complaint[] = [];
let eventsCache: SchoolEvent[] = [];
let salaryCache: SalaryRecord[] = [];
let staffAttendanceCache: StaffAttendanceRecord[] = [];
let verificationsCache: ParentVerification[] = [];
let loaded = false;

async function syncTable<T extends { id: string }>(
  table: string,
  oldList: T[],
  newList: T[],
  toDb: (item: T) => Record<string, unknown>
): Promise<void> {
  const oldIds = new Set(oldList.map(i => i.id));
  const newIds = new Set(newList.map(i => i.id));
  const toDelete = [...oldIds].filter(id => !newIds.has(id));
  const rows = newList.map(toDb);
  try {
    if (rows.length) {
      const { error } = await supabase.from(table).upsert(rows);
      if (error) console.error(`Supabase upsert error (${table}):`, error.message);
    }
    if (toDelete.length) {
      const { error } = await supabase.from(table).delete().in('id', toDelete);
      if (error) console.error(`Supabase delete error (${table}):`, error.message);
    }
  } catch (err) {
    console.error(`Supabase sync failed (${table}):`, err);
  }
}

// ============================================================
// Initialize — অ্যাপ চালু হওয়ার সময় একবার Supabase থেকে ডেটা লোড
// করে। টেবিল খালি থাকলে ডিফল্ট ডেটা দিয়ে seed করে।
// ============================================================
export async function initializeData(): Promise<void> {
  if (loaded) return;

  const { data: existingUsers, error: usersErr } = await supabase.from('users').select('*');

  if (usersErr) {
    console.error('Supabase load error (users):', usersErr.message);
    // নেটওয়ার্ক/কনফিগ সমস্যা হলে অন্তত ডিফল্ট ডেটা দিয়ে অ্যাপ চালু রাখা
    usersCache = DEFAULT_USERS;
    classesCache = DEFAULT_CLASSES;
    studentsCache = DEFAULT_STUDENTS;
    attendanceCache = generateSampleAttendance();
    notificationsCache = generateSampleNotifications(attendanceCache, studentsCache);
    subjectsCache = [];
    examsCache = [];
    resultsCache = [];
    feesCache = [];
    routinesCache = [];
    homeworkCache = [];
    announcementsCache = [];
    booksCache = [];
    bookIssuesCache = [];
    syllabusCache = [];
    expensesCache = [];
    leaveCache = [];
    complaintsCache = [];
    eventsCache = [];
    salaryCache = [];
    staffAttendanceCache = [];
    verificationsCache = [];
    loaded = true;
    return;
  }

  if (!existingUsers || existingUsers.length === 0) {
    // প্রথমবার — Supabase-এ ডিফল্ট ডেটা বসানো হচ্ছে
    const attendance = generateSampleAttendance();
    const notifications = generateSampleNotifications(attendance, DEFAULT_STUDENTS);

    await supabase.from('classes').upsert(DEFAULT_CLASSES.map(toDbClass));
    await supabase.from('users').upsert(DEFAULT_USERS.map(toDbUser));
    await supabase.from('students').upsert(DEFAULT_STUDENTS.map(toDbStudent));
    await supabase.from('attendance').upsert(attendance.map(toDbAttendance));
    await supabase.from('notifications').upsert(notifications.map(toDbNotification));

    usersCache = DEFAULT_USERS;
    classesCache = DEFAULT_CLASSES;
    studentsCache = DEFAULT_STUDENTS;
    attendanceCache = attendance;
    notificationsCache = notifications;
    subjectsCache = [];
    examsCache = [];
    resultsCache = [];
    feesCache = [];
    routinesCache = [];
    homeworkCache = [];
    announcementsCache = [];
    booksCache = [];
    bookIssuesCache = [];
    syllabusCache = [];
    expensesCache = [];
    leaveCache = [];
    complaintsCache = [];
    eventsCache = [];
    salaryCache = [];
    staffAttendanceCache = [];
    verificationsCache = [];
  } else {
    const [
      { data: classes }, { data: students }, { data: attendance }, { data: notifications },
      { data: subjects }, { data: exams }, { data: results }, { data: fees },
      { data: routines }, { data: homework },
      { data: announcements }, { data: books }, { data: bookIssues },
      { data: syllabus }, { data: expenses },
      { data: leave }, { data: complaints }, { data: events }, { data: salaries },
      { data: staffAttendance }, { data: verifications },
    ] = await Promise.all([
      supabase.from('classes').select('*'),
      supabase.from('students').select('*'),
      supabase.from('attendance').select('*'),
      supabase.from('notifications').select('*'),
      supabase.from('subjects').select('*'),
      supabase.from('exams').select('*'),
      supabase.from('results').select('*'),
      supabase.from('fees').select('*'),
      supabase.from('routines').select('*'),
      supabase.from('homework').select('*'),
      supabase.from('announcements').select('*'),
      supabase.from('books').select('*'),
      supabase.from('book_issues').select('*'),
      supabase.from('syllabus').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('leave_applications').select('*'),
      supabase.from('complaints').select('*'),
      supabase.from('events').select('*'),
      supabase.from('salaries').select('*'),
      supabase.from('staff_attendance').select('*'),
      supabase.from('parent_verifications').select('*'),
    ]);

    usersCache = existingUsers.map(fromDbUser);
    classesCache = (classes ?? []).map(fromDbClass);
    studentsCache = (students ?? []).map(fromDbStudent);
    attendanceCache = (attendance ?? []).map(fromDbAttendance);
    notificationsCache = (notifications ?? []).map(fromDbNotification);
    subjectsCache = (subjects ?? []).map(fromDbSubject);
    examsCache = (exams ?? []).map(fromDbExam);
    resultsCache = (results ?? []).map(fromDbResult);
    feesCache = (fees ?? []).map(fromDbFee);
    routinesCache = (routines ?? []).map(fromDbRoutine);
    homeworkCache = (homework ?? []).map(fromDbHomework);
    announcementsCache = (announcements ?? []).map(fromDbAnnouncement);
    booksCache = (books ?? []).map(fromDbBook);
    bookIssuesCache = (bookIssues ?? []).map(fromDbBookIssue);
    syllabusCache = (syllabus ?? []).map(fromDbSyllabus);
    expensesCache = (expenses ?? []).map(fromDbExpense);
    leaveCache = (leave ?? []).map(fromDbLeave);
    complaintsCache = (complaints ?? []).map(fromDbComplaint);
    eventsCache = (events ?? []).map(fromDbEvent);
    salaryCache = (salaries ?? []).map(fromDbSalary);
    staffAttendanceCache = (staffAttendance ?? []).map(fromDbStaffAttendance);
    verificationsCache = (verifications ?? []).map(fromDbVerification);
  }

  loaded = true;
}

export function resetData(): void {
  loaded = false;
}

// ============================================================
// CRUD ফাংশন — নাম ও sync আচরণ আগের মতোই, ভেতরে Supabase-এ সংরক্ষণ হয়
// ============================================================
export function getUsers(): User[] {
  return usersCache;
}
export function saveUsers(users: User[]): void {
  const old = usersCache;
  usersCache = users;
  void syncTable('users', old, users, toDbUser);
}

export function getStudents(): Student[] {
  return studentsCache;
}
export function saveStudents(students: Student[]): void {
  const old = studentsCache;
  studentsCache = students;
  void syncTable('students', old, students, toDbStudent);
}

export function getClasses(): ClassInfo[] {
  return classesCache;
}
export function saveClasses(classes: ClassInfo[]): void {
  const old = classesCache;
  classesCache = classes;
  void syncTable('classes', old, classes, toDbClass);
}

export function getAttendance(): AttendanceRecord[] {
  return attendanceCache;
}
export function saveAttendance(records: AttendanceRecord[]): void {
  const old = attendanceCache;
  attendanceCache = records;
  void syncTable('attendance', old, records, toDbAttendance);
}

export function getNotifications(): Notification[] {
  return notificationsCache;
}
export function saveNotifications(notifs: Notification[]): void {
  const old = notificationsCache;
  notificationsCache = notifs;
  void syncTable('notifications', old, notifs, toDbNotification);
}

export function getSubjects(): Subject[] {
  return subjectsCache;
}
export function saveSubjects(items: Subject[]): void {
  const old = subjectsCache;
  subjectsCache = items;
  void syncTable('subjects', old, items, toDbSubject);
}

export function getExams(): Exam[] {
  return examsCache;
}
export function saveExams(items: Exam[]): void {
  const old = examsCache;
  examsCache = items;
  void syncTable('exams', old, items, toDbExam);
}

export function getResults(): ResultRecord[] {
  return resultsCache;
}
export function saveResults(items: ResultRecord[]): void {
  const old = resultsCache;
  resultsCache = items;
  void syncTable('results', old, items, toDbResult);
}

export function getFees(): FeeInvoice[] {
  return feesCache;
}
export function saveFees(items: FeeInvoice[]): void {
  const old = feesCache;
  feesCache = items;
  void syncTable('fees', old, items, toDbFee);
}

export function getRoutines(): RoutinePeriod[] {
  return routinesCache;
}
export function saveRoutines(items: RoutinePeriod[]): void {
  const old = routinesCache;
  routinesCache = items;
  void syncTable('routines', old, items, toDbRoutine);
}

export function getHomeworks(): Homework[] {
  return homeworkCache;
}
export function saveHomeworks(items: Homework[]): void {
  const old = homeworkCache;
  homeworkCache = items;
  void syncTable('homework', old, items, toDbHomework);
}

export function getAnnouncements(): Announcement[] {
  return announcementsCache;
}
export function saveAnnouncements(items: Announcement[]): void {
  const old = announcementsCache;
  announcementsCache = items;
  void syncTable('announcements', old, items, toDbAnnouncement);
}

export function getBooks(): LibraryBook[] {
  return booksCache;
}
export function saveBooks(items: LibraryBook[]): void {
  const old = booksCache;
  booksCache = items;
  void syncTable('books', old, items, toDbBook);
}

export function getBookIssues(): BookIssue[] {
  return bookIssuesCache;
}
export function saveBookIssues(items: BookIssue[]): void {
  const old = bookIssuesCache;
  bookIssuesCache = items;
  void syncTable('book_issues', old, items, toDbBookIssue);
}

export function getSyllabus(): SyllabusItem[] {
  return syllabusCache;
}
export function saveSyllabus(items: SyllabusItem[]): void {
  const old = syllabusCache;
  syllabusCache = items;
  void syncTable('syllabus', old, items, toDbSyllabus);
}

export function getExpenses(): ExpenseRecord[] {
  return expensesCache;
}
export function saveExpenses(items: ExpenseRecord[]): void {
  const old = expensesCache;
  expensesCache = items;
  void syncTable('expenses', old, items, toDbExpense);
}

export function getLeaveApplications(): LeaveApplication[] {
  return leaveCache;
}
export function saveLeaveApplications(items: LeaveApplication[]): void {
  const old = leaveCache;
  leaveCache = items;
  void syncTable('leave_applications', old, items, toDbLeave);
}

export function getComplaints(): Complaint[] {
  return complaintsCache;
}
export function saveComplaints(items: Complaint[]): void {
  const old = complaintsCache;
  complaintsCache = items;
  void syncTable('complaints', old, items, toDbComplaint);
}

export function getEvents(): SchoolEvent[] {
  return eventsCache;
}
export function saveEvents(items: SchoolEvent[]): void {
  const old = eventsCache;
  eventsCache = items;
  void syncTable('events', old, items, toDbEvent);
}

export function getSalaries(): SalaryRecord[] {
  return salaryCache;
}
export function saveSalaries(items: SalaryRecord[]): void {
  const old = salaryCache;
  salaryCache = items;
  void syncTable('salaries', old, items, toDbSalary);
}

export function getStaffAttendance(): StaffAttendanceRecord[] {
  return staffAttendanceCache;
}
export function saveStaffAttendance(items: StaffAttendanceRecord[]): void {
  const old = staffAttendanceCache;
  staffAttendanceCache = items;
  void syncTable('staff_attendance', old, items, toDbStaffAttendance);
}

export function getVerifications(): ParentVerification[] {
  return verificationsCache;
}
export function saveVerifications(items: ParentVerification[]): void {
  const old = verificationsCache;
  verificationsCache = items;
  void syncTable('parent_verifications', old, items, toDbVerification);
}

// ============================================================
// অ্যাকাউন্ট বৈধতা যাচাই — ব্লক করা বা মেয়াদ উত্তীর্ণ আইডি দিয়ে
// লগইন/সেশন চালু রাখা আটকাতে ব্যবহৃত হয়
// ============================================================
export function isAccountUsable(u: User): { ok: boolean; reason?: string } {
  if (u.isBlocked) {
    return { ok: false, reason: u.blockedReason?.trim() ? u.blockedReason : 'আপনার আইডিটি অ্যাডমিন কর্তৃক ব্লক করা হয়েছে।' };
  }
  if (u.expiresAt && Date.now() > u.expiresAt) {
    return { ok: false, reason: 'আপনার আইডির মেয়াদ শেষ হয়ে গেছে। অ্যাডমিনের সাথে যোগাযোগ করুন।' };
  }
  return { ok: true };
}

// ============================================================
// গ্রেড হিসাব — বাংলাদেশ শিক্ষা বোর্ড পদ্ধতি অনুযায়ী
// ============================================================
export interface GradeInfo {
  letter: string;
  point: number;
}
export function getGrade(percentage: number): GradeInfo {
  if (percentage >= 80) return { letter: 'A+', point: 5.0 };
  if (percentage >= 70) return { letter: 'A', point: 4.0 };
  if (percentage >= 60) return { letter: 'A-', point: 3.5 };
  if (percentage >= 50) return { letter: 'B', point: 3.0 };
  if (percentage >= 40) return { letter: 'C', point: 2.0 };
  if (percentage >= 33) return { letter: 'D', point: 1.0 };
  return { letter: 'F', point: 0.0 };
}

export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function toBanglaNum(num: number): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map(d => banglaDigits[parseInt(d)] || d).join('');
}
