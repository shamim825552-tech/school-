import { Student, Subject, ResultRecord, Exam } from '../types';
import { getGrade, GradeInfo } from '../data';

export interface StudentExamRow {
  student: Student;
  subjectMarks: { subject: Subject; marksObtained: number; fullMarks: number; grade: GradeInfo | null }[];
  totalObtained: number;
  totalFull: number;
  percentage: number;
  gpa: number;
  overallGrade: GradeInfo | null;
  failedSubjects: number;
  passed: boolean;
  rank: number; // 0 if not ranked (no marks entered)
}

export interface ExamAnalytics {
  rows: StudentExamRow[]; // sorted by rank
  classAverageGpa: number;
  classAveragePercentage: number;
  passRate: number; // 0-100
  totalAppeared: number;
  totalPassed: number;
  subjectAverages: { subject: Subject; average: number; passRate: number }[];
  topPerformers: StudentExamRow[];
  weakPerformers: StudentExamRow[];
}

// একজন শিক্ষার্থীর একটি পরীক্ষার সম্পূর্ণ ফলাফল হিসাব করে (GPA, গ্রেড, পাস/ফেল)
export function computeStudentExamRow(student: Student, subjects: Subject[], results: ResultRecord[], examId: string): StudentExamRow {
  const subjectMarks = subjects.map(subject => {
    const r = results.find(x => x.examId === examId && x.studentId === student.id && x.subjectId === subject.id);
    if (!r) return { subject, marksObtained: 0, fullMarks: subject.fullMarks, grade: null as GradeInfo | null };
    const pct = r.fullMarks > 0 ? (r.marksObtained / r.fullMarks) * 100 : 0;
    return { subject, marksObtained: r.marksObtained, fullMarks: r.fullMarks, grade: getGrade(pct) };
  });
  const entered = subjectMarks.filter(sm => sm.grade !== null);
  const totalObtained = entered.reduce((s, sm) => s + sm.marksObtained, 0);
  const totalFull = entered.reduce((s, sm) => s + sm.fullMarks, 0);
  const percentage = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
  const gpa = entered.length > 0 ? entered.reduce((s, sm) => s + (sm.grade?.point || 0), 0) / entered.length : 0;
  const overallGrade = totalFull > 0 ? getGrade(percentage) : null;
  const failedSubjects = entered.filter(sm => sm.grade?.letter === 'F').length;
  const passed = entered.length > 0 && failedSubjects === 0;
  return { student, subjectMarks, totalObtained, totalFull, percentage, gpa, overallGrade, failedSubjects, passed, rank: 0 };
}

// একটি পরীক্ষার জন্য পুরো ক্লাসের মেধাক্রম, গড় ও পরিসংখ্যান হিসাব করে
export function computeExamAnalytics(students: Student[], subjects: Subject[], results: ResultRecord[], examId: string): ExamAnalytics {
  const allRows = students.map(s => computeStudentExamRow(s, subjects, results, examId));
  const appeared = allRows.filter(r => r.totalFull > 0);

  // Rank: পাস করা শিক্ষার্থীরা GPA অনুযায়ী উপরে, তারপর ফেল করা শিক্ষার্থীরা percentage অনুযায়ী
  const ranked = [...appeared].sort((a, b) => {
    if (a.passed !== b.passed) return a.passed ? -1 : 1;
    if (b.gpa !== a.gpa) return b.gpa - a.gpa;
    return b.percentage - a.percentage;
  });
  let lastGpa = -1, lastRank = 0;
  ranked.forEach((row, i) => {
    if (row.passed && row.gpa === lastGpa) {
      row.rank = lastRank;
    } else {
      row.rank = i + 1;
      lastRank = i + 1;
      lastGpa = row.gpa;
    }
  });
  const notAppeared = allRows.filter(r => r.totalFull === 0);

  const totalAppeared = appeared.length;
  const totalPassed = appeared.filter(r => r.passed).length;
  const passRate = totalAppeared > 0 ? (totalPassed / totalAppeared) * 100 : 0;
  const classAverageGpa = totalAppeared > 0 ? appeared.reduce((s, r) => s + r.gpa, 0) / totalAppeared : 0;
  const classAveragePercentage = totalAppeared > 0 ? appeared.reduce((s, r) => s + r.percentage, 0) / totalAppeared : 0;

  const subjectAverages = subjects.map(subject => {
    const marks = appeared
      .map(r => r.subjectMarks.find(sm => sm.subject.id === subject.id))
      .filter((sm): sm is NonNullable<typeof sm> => !!sm && sm.grade !== null);
    const avgPct = marks.length > 0 ? marks.reduce((s, sm) => s + (sm.fullMarks > 0 ? (sm.marksObtained / sm.fullMarks) * 100 : 0), 0) / marks.length : 0;
    const subjPass = marks.length > 0 ? (marks.filter(sm => sm.grade?.letter !== 'F').length / marks.length) * 100 : 0;
    return { subject, average: avgPct, passRate: subjPass };
  });

  return {
    rows: [...ranked, ...notAppeared],
    classAverageGpa,
    classAveragePercentage,
    passRate,
    totalAppeared,
    totalPassed,
    subjectAverages,
    topPerformers: ranked.slice(0, 3),
    weakPerformers: [...appeared].sort((a, b) => a.percentage - b.percentage).slice(0, 3),
  };
}

export function examLabel(exam: Exam): string {
  return `${exam.name} — ${exam.academicYear}`;
}
