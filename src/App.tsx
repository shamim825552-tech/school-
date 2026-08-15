import { useState, useEffect } from 'react';
import { User, Page } from './types';
import { initializeData, getUsers, isAccountUsable } from './data';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import StudentManager from './components/StudentManager';
import TeacherManager from './components/TeacherManager';
import ClassManager from './components/ClassManager';
import AttendancePage from './components/AttendancePage';
import ReportsPage from './components/ReportsPage';
import NotificationHistory from './components/NotificationHistory';
import ParentDashboard from './components/ParentDashboard';
import AdminSettings from './components/AdminSettings';
import ParentSettings from './components/ParentSettings';
import ExamManager from './components/ExamManager';
import ResultEntry from './components/ResultEntry';
import FeeManager from './components/FeeManager';
import RoutineManager from './components/RoutineManager';
import HomeworkManager from './components/HomeworkManager';
import ParentResults from './components/ParentResults';
import ParentFees from './components/ParentFees';
import ParentRoutine from './components/ParentRoutine';
import ParentHomework from './components/ParentHomework';
import AnnouncementBoard from './components/AnnouncementBoard';
import LibraryManager from './components/LibraryManager';
import SyllabusTracker from './components/SyllabusTracker';
import ExpenseManager from './components/ExpenseManager';
import ParentLibrary from './components/ParentLibrary';
import ParentSyllabus from './components/ParentSyllabus';
import LeaveManager from './components/LeaveManager';
import ParentLeave from './components/ParentLeave';
import ComplaintBox from './components/ComplaintBox';
import ComplaintManager from './components/ComplaintManager';
import EventManager from './components/EventManager';
import EventsView from './components/EventsView';
import IDCardGenerator from './components/IDCardGenerator';
import PayrollManager from './components/PayrollManager';
import ResultAnalytics from './components/ResultAnalytics';
import FinanceDashboard from './components/FinanceDashboard';
import NotificationCenter from './components/NotificationCenter';
import StaffAttendance from './components/StaffAttendance';
import TeacherGroupChat from './components/TeacherGroupChat';
import AIAssistant from './components/AIAssistant';
import AISettingsAdmin from './components/AISettingsAdmin';
import UserManager from './components/UserManager';
import VerificationManager from './components/VerificationManager';
import TeacherStudentCards from './components/TeacherStudentCards';
import ParentVerificationForm from './components/ParentVerificationForm';
import ParentIDCard from './components/ParentIDCard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData().then(() => {
      // লগইন করা ইউজার localStorage-এ রাখা হয় যাতে অ্যাপ বন্ধ করে আবার
      // খুললেও (বা ব্রাউজার রিফ্রেশ করলেও) বারবার লগইন স্ক্রিন না দেখায়।
      // (sessionStorage ব্যবহার করলে অ্যাপ/ট্যাব বন্ধ হওয়া মাত্র ডেটা
      // মুছে যেত — সেই কারণেই বারবার লগইন চাইছিল।)
      const stored = localStorage.getItem('vhs_current_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          // ইউজারটি এখনো বৈধ (মুছে ফেলা হয়নি) কিনা যাচাই — বৈধ হলেই লগইন রাখা হবে
          const freshUser = getUsers().find(existing => existing.id === u.id);
          // ব্লক করা বা মেয়াদ উত্তীর্ণ আইডি হলে সেশন বাতিল করে লগইন স্ক্রিনে ফেরত পাঠানো হচ্ছে
          if (freshUser && isAccountUsable(freshUser).ok) {
            setUser(freshUser);
            setCurrentPage(freshUser.role === 'parent' ? 'parent-home' : 'dashboard');
          } else {
            localStorage.removeItem('vhs_current_user');
          }
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('vhs_current_user', JSON.stringify(u));
    setCurrentPage(u.role === 'parent' ? 'parent-home' : 'dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vhs_current_user');
    setCurrentPage('dashboard');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('vhs_current_user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (user.role) {
      case 'admin':
        switch (currentPage) {
          case 'dashboard': return <AdminDashboard />;
          case 'ai-assistant': return <AIAssistant user={user} />;
          case 'ai-settings': return <AISettingsAdmin />;
          case 'students': return <StudentManager />;
          case 'teachers': return <TeacherManager />;
          case 'classes': return <ClassManager />;
          case 'attendance': return <AttendancePage user={user} />;
          case 'exams': return <ExamManager />;
          case 'results': return <ResultEntry user={user} />;
          case 'fees': return <FeeManager />;
          case 'routine': return <RoutineManager user={user} />;
          case 'homework': return <HomeworkManager user={user} />;
          case 'announcements': return <AnnouncementBoard user={user} />;
          case 'library': return <LibraryManager user={user} />;
          case 'syllabus': return <SyllabusTracker user={user} />;
          case 'expenses': return <ExpenseManager />;
          case 'leave': return <LeaveManager user={user} />;
          case 'complaints': return <ComplaintManager />;
          case 'events': return <EventManager user={user} />;
          case 'id-cards': return <IDCardGenerator />;
          case 'user-management': return <UserManager currentUser={user} />;
          case 'verifications': return <VerificationManager currentUser={user} />;
          case 'payroll': return <PayrollManager />;
          case 'result-analytics': return <ResultAnalytics user={user} />;
          case 'finance-dashboard': return <FinanceDashboard />;
          case 'notification-center': return <NotificationCenter />;
          case 'staff-attendance': return <StaffAttendance user={user} />;
          case 'reports': return <ReportsPage user={user} />;
          case 'notifications': return <NotificationHistory />;
          case 'settings': return <AdminSettings user={user} onUserUpdate={handleUserUpdate} />;
          default: return <AdminDashboard />;
        }
      case 'teacher':
        switch (currentPage) {
          case 'dashboard': return <TeacherDashboard user={user} onNavigate={setCurrentPage} />;
          case 'ai-assistant': return <AIAssistant user={user} />;
          case 'attendance': return <AttendancePage user={user} />;
          case 'results': return <ResultEntry user={user} />;
          case 'result-analytics': return <ResultAnalytics user={user} />;
          case 'routine': return <RoutineManager user={user} />;
          case 'homework': return <HomeworkManager user={user} />;
          case 'announcements': return <AnnouncementBoard user={user} />;
          case 'library': return <LibraryManager user={user} />;
          case 'syllabus': return <SyllabusTracker user={user} />;
          case 'leave': return <LeaveManager user={user} />;
          case 'complaints': return <ComplaintBox user={user} />;
          case 'events': return <EventsView />;
          case 'reports': return <ReportsPage user={user} />;
          case 'teacher-id-cards': return <TeacherStudentCards user={user} />;
          case 'settings': return <AdminSettings user={user} onUserUpdate={handleUserUpdate} />;
          case 'teacher-group': return <TeacherGroupChat user={user} />;
          default: return <TeacherDashboard user={user} onNavigate={setCurrentPage} />;
        }
      case 'parent':
        switch (currentPage) {
          case 'ai-assistant': return <AIAssistant user={user} />;
          case 'parent-results': return <ParentResults user={user} />;
          case 'parent-fees': return <ParentFees user={user} />;
          case 'parent-routine': return <ParentRoutine user={user} />;
          case 'parent-homework': return <ParentHomework user={user} />;
          case 'parent-announcements': return <AnnouncementBoard user={user} />;
          case 'parent-library': return <ParentLibrary user={user} />;
          case 'parent-syllabus': return <ParentSyllabus user={user} />;
          case 'parent-leave': return <ParentLeave user={user} />;
          case 'parent-complaints': return <ComplaintBox user={user} />;
          case 'parent-events': return <EventsView />;
          case 'parent-verification': return <ParentVerificationForm user={user} />;
          case 'parent-id-card': return <ParentIDCard user={user} />;
          case 'parent-settings': return <ParentSettings user={user} onUserUpdate={handleUserUpdate} />;
          default: return <ParentDashboard user={user} page={currentPage} onNavigate={setCurrentPage} />;
        }
      default:
        return null;
    }
  };

  return (
    <Layout
      user={user}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}
