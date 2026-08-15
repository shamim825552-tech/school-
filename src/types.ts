export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  email?: string;
  password: string;
  assignedClass?: string;
  assignedSection?: string;
  childId?: string;
  // ============================================================
  // অ্যাকাউন্ট নিয়ন্ত্রণ — অ্যাডমিন যেকোনো আইডি ব্লক/আনব্লক, মেয়াদ
  // নির্ধারণ করতে পারবেন
  // ============================================================
  isBlocked?: boolean;
  blockedReason?: string;
  expiresAt?: number; // ms timestamp — এই সময়ের পর আইডি স্বয়ংক্রিয়ভাবে লগইন করতে পারবে না
}

export interface Student {
  id: string;
  name: string;
  roll: number;
  classId: string;
  section: string;
  parentName: string;
  parentPhone: string;
  parentId?: string;
  photo?: string;
  // ============================================================
  // আইডি কার্ড সংক্রান্ত অতিরিক্ত তথ্য — অ্যাডমিন/শিক্ষক এডিট করতে পারবেন,
  // অভিভাবক তার ড্যাশবোর্ডে দেখতে পাবেন
  // ============================================================
  studentIdNo?: string;
  bloodGroup?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  address?: string;
  cardUpdatedAt?: number;
}

// ============================================================
// অভিভাবক ভেরিফিকেশন — নিজের NID ও সন্তানের জন্ম নিবন্ধন যোগ করা,
// অ্যাডমিন তা যাচাই করে ভেরিফাই ব্যাজ দেবেন
// ============================================================
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface ParentVerification {
  id: string; // = parentId
  parentId: string;
  parentName: string;
  parentPhone: string;
  childId?: string;
  childName?: string;
  nidNumber?: string;
  nidImage?: string; // base64 data URL
  birthRegNumber?: string;
  birthRegImage?: string; // base64 data URL
  status: VerificationStatus;
  submittedAt: number;
  updatedAt: number;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: number;
  rejectionReason?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  sections: string[];
  assignedTeacherId?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
  classId: string;
  section: string;
  markedBy: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  message: string;
  date: string;
  timestamp: number;
  type: 'sms' | 'push';
  status: 'sent' | 'pending' | 'failed';
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  fullMarks: number;
}

export interface Exam {
  id: string;
  name: string;
  classId: string;
  academicYear: string;
  examDate: string; // YYYY-MM-DD
}

export interface ResultRecord {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  marksObtained: number;
  fullMarks: number;
}

export type FeeStatus = 'due' | 'paid' | 'partial';
export type FeeMethod = 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';

export interface FeeInvoice {
  id: string;
  studentId: string;
  title: string;
  amount: number;
  month?: string;
  year: string;
  dueDate: string;
  status: FeeStatus;
  paidAmount: number;
  paidDate?: string;
  method?: FeeMethod;
  note?: string;
}

export const ROUTINE_DAYS = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার'] as const;
export type RoutineDay = typeof ROUTINE_DAYS[number];

export interface RoutinePeriod {
  id: string;
  classId: string;
  section: string;
  day: RoutineDay;
  period: number;
  subjectName: string;
  teacherId?: string;
  startTime: string;
  endTime: string;
}

export interface Homework {
  id: string;
  classId: string;
  section: string;
  subjectName: string;
  title: string;
  description: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  teacherId: string;
}

export type AnnouncementAudience = 'all' | 'teacher' | 'parent';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: AnnouncementAudience;
  classId?: string;
  pinned: boolean;
  createdBy: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn?: string;
  totalCopies: number;
  availableCopies: number;
}

export type BookIssueStatus = 'issued' | 'returned';

export interface BookIssue {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate?: string;
  status: BookIssueStatus;
}

export type SyllabusStatus = 'pending' | 'in_progress' | 'completed';

export interface SyllabusItem {
  id: string;
  classId: string;
  section: string;
  subjectName: string;
  topic: string;
  status: SyllabusStatus;
  teacherId: string;
  updatedDate: string; // YYYY-MM-DD
}

export type ExpenseType = 'income' | 'expense';

export interface ExpenseRecord {
  id: string;
  title: string;
  category: string;
  type: ExpenseType;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveApplication {
  id: string;
  studentId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason: string;
  appliedBy: string; // parent user id
  status: LeaveStatus;
  respondedBy?: string;
  responseNote?: string;
  date: string; // YYYY-MM-DD, applied date
  timestamp: number;
}

export type ComplaintCategory = 'academic' | 'behavior' | 'facility' | 'transport' | 'financial' | 'other';
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved';

export interface Complaint {
  id: string;
  submittedById: string;
  submittedByName: string;
  submittedByRole: UserRole;
  phone?: string;
  category: ComplaintCategory;
  subject: string;
  message: string;
  status: ComplaintStatus;
  adminReply?: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export type EventCategory = 'exam' | 'holiday' | 'meeting' | 'sports' | 'cultural' | 'other';

export interface SchoolEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  category: EventCategory;
  createdBy: string;
  timestamp: number;
}

export type SalaryStatus = 'paid' | 'due';
export type SalaryMethod = 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';

export interface SalaryRecord {
  id: string;
  teacherId: string;
  month: string; // e.g. জানুয়ারি
  year: string;
  basicAmount: number;
  bonus: number;
  deduction: number;
  netAmount: number;
  status: SalaryStatus;
  paidDate?: string;
  method?: SalaryMethod;
  note?: string;
  timestamp: number;
}

export type StaffAttendanceStatus = 'present' | 'absent' | 'leave' | 'late';

export interface StaffAttendanceRecord {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: StaffAttendanceStatus;
  note?: string;
  markedBy: string;
  timestamp: number;
}

// ============================================================
// AI সহকারী — প্রশ্ন-উত্তর (টেক্সট + ছবি)
// ============================================================
export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'custom';

export interface AISettings {
  id: string; // সবসময় 'default' — একটি মাত্র রো থাকবে
  enabled: boolean;
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string; // শুধু 'custom' প্রোভাইডারের জন্য (OpenAI-compatible endpoint)
  systemPrompt?: string;
  updatedAt: number;
}

export type AIMessageRole = 'user' | 'assistant';

export interface AIChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  role: AIMessageRole;
  message?: string;
  imageUrl?: string;
  isError?: boolean;
  timestamp: number;
}

export interface TeacherMessage {
  id: string;
  senderId: string;
  senderName: string;
  message?: string;
  imageUrl?: string;
  audioUrl?: string;
  reactions?: Record<string, string[]>; // emoji -> senderId[]
  timestamp: number;
}

export type Page =
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'attendance'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'exams'
  | 'results'
  | 'fees'
  | 'routine'
  | 'homework'
  | 'announcements'
  | 'library'
  | 'syllabus'
  | 'expenses'
  | 'leave'
  | 'complaints'
  | 'events'
  | 'id-cards'
  | 'payroll'
  | 'result-analytics'
  | 'finance-dashboard'
  | 'notification-center'
  | 'staff-attendance'
  | 'parent-home'
  | 'parent-history'
  | 'parent-results'
  | 'parent-fees'
  | 'parent-routine'
  | 'parent-homework'
  | 'parent-announcements'
  | 'parent-library'
  | 'parent-syllabus'
  | 'parent-leave'
  | 'parent-complaints'
  | 'parent-events'
  | 'parent-settings'
  | 'teacher-group'
  | 'ai-assistant'
  | 'ai-settings'
  | 'user-management'
  | 'verifications'
  | 'teacher-id-cards'
  | 'parent-verification'
  | 'parent-id-card';
