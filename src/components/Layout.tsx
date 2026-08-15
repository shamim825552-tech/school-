import { useState } from 'react';
import { User, Page } from '../types';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardCheck,
  BarChart3, Bell, LogOut, Menu, X, Home, History, ChevronRight, Settings,
  Award, Wallet, CalendarClock, NotebookPen, Megaphone, BookMarked, ListChecks, PiggyBank,
  CalendarOff, MessageSquareWarning, CalendarDays, IdCard, Wallet2,
  TrendingUp, LineChart, Send, ClipboardCheck as StaffCheck, MessagesSquare, Bot, Sparkles,
  ShieldCheck, BadgeCheck
} from 'lucide-react';

interface LayoutProps {
  user: User;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ user, currentPage, onPageChange, onLogout, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminMenu: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={20} /> },
    { page: 'ai-assistant', label: 'AI সহকারী', icon: <Bot size={20} /> },
    { page: 'ai-settings', label: 'AI সেটিংস', icon: <Sparkles size={20} /> },
    { page: 'students', label: 'শিক্ষার্থী', icon: <Users size={20} /> },
    { page: 'teachers', label: 'শিক্ষক', icon: <GraduationCap size={20} /> },
    { page: 'classes', label: 'ক্লাস ও সেকশন', icon: <BookOpen size={20} /> },
    { page: 'attendance', label: 'উপস্থিতি', icon: <ClipboardCheck size={20} /> },
    { page: 'exams', label: 'পরীক্ষা', icon: <Award size={20} /> },
    { page: 'results', label: 'ফলাফল', icon: <GraduationCap size={20} /> },
    { page: 'result-analytics', label: 'ফলাফল বিশ্লেষণ ও মেধাক্রম', icon: <LineChart size={20} /> },
    { page: 'fees', label: 'ফি ব্যবস্থাপনা', icon: <Wallet size={20} /> },
    { page: 'finance-dashboard', label: 'আর্থিক পরিদর্শন', icon: <TrendingUp size={20} /> },
    { page: 'routine', label: 'ক্লাস রুটিন', icon: <CalendarClock size={20} /> },
    { page: 'homework', label: 'হোমওয়ার্ক', icon: <NotebookPen size={20} /> },
    { page: 'announcements', label: 'নোটিশ বোর্ড', icon: <Megaphone size={20} /> },
    { page: 'library', label: 'লাইব্রেরি', icon: <BookMarked size={20} /> },
    { page: 'syllabus', label: 'সিলেবাস অগ্রগতি', icon: <ListChecks size={20} /> },
    { page: 'expenses', label: 'আয়-ব্যয় হিসাব', icon: <PiggyBank size={20} /> },
    { page: 'payroll', label: 'শিক্ষক বেতন', icon: <Wallet2 size={20} /> },
    { page: 'staff-attendance', label: 'স্টাফ উপস্থিতি', icon: <StaffCheck size={20} /> },
    { page: 'id-cards', label: 'আইডি কার্ড ও সনদ', icon: <IdCard size={20} /> },
    { page: 'user-management', label: 'ইউজার ব্যবস্থাপনা', icon: <ShieldCheck size={20} /> },
    { page: 'verifications', label: 'অভিভাবক ভেরিফিকেশন', icon: <BadgeCheck size={20} /> },
    { page: 'events', label: 'ইভেন্ট ক্যালেন্ডার', icon: <CalendarDays size={20} /> },
    { page: 'leave', label: 'ছুটির আবেদন', icon: <CalendarOff size={20} /> },
    { page: 'complaints', label: 'অভিযোগ ও পরামর্শ', icon: <MessageSquareWarning size={20} /> },
    { page: 'reports', label: 'রিপোর্ট', icon: <BarChart3 size={20} /> },
    { page: 'notification-center', label: 'নোটিফিকেশন সেন্টার', icon: <Send size={20} /> },
    { page: 'notifications', label: 'নোটিফিকেশন ইতিহাস', icon: <Bell size={20} /> },
    { page: 'settings', label: 'সেটিংস', icon: <Settings size={20} /> },
  ];

  const teacherMenu: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={20} /> },
    { page: 'ai-assistant', label: 'AI সহকারী', icon: <Bot size={20} /> },
    { page: 'teacher-group', label: 'শিক্ষক গ্রুপ', icon: <MessagesSquare size={20} /> },
    { page: 'attendance', label: 'উপস্থিতি নিন', icon: <ClipboardCheck size={20} /> },
    { page: 'results', label: 'ফলাফল এন্ট্রি', icon: <GraduationCap size={20} /> },
    { page: 'result-analytics', label: 'ফলাফল বিশ্লেষণ', icon: <LineChart size={20} /> },
    { page: 'routine', label: 'ক্লাস রুটিন', icon: <CalendarClock size={20} /> },
    { page: 'homework', label: 'হোমওয়ার্ক', icon: <NotebookPen size={20} /> },
    { page: 'announcements', label: 'নোটিশ বোর্ড', icon: <Megaphone size={20} /> },
    { page: 'library', label: 'লাইব্রেরি', icon: <BookMarked size={20} /> },
    { page: 'syllabus', label: 'সিলেবাস অগ্রগতি', icon: <ListChecks size={20} /> },
    { page: 'events', label: 'ইভেন্ট ক্যালেন্ডার', icon: <CalendarDays size={20} /> },
    { page: 'leave', label: 'ছুটির আবেদন', icon: <CalendarOff size={20} /> },
    { page: 'complaints', label: 'অভিযোগ ও পরামর্শ', icon: <MessageSquareWarning size={20} /> },
    { page: 'reports', label: 'রিপোর্ট', icon: <BarChart3 size={20} /> },
    { page: 'teacher-id-cards', label: 'শিক্ষার্থী আইডি কার্ড', icon: <IdCard size={20} /> },
    { page: 'settings', label: 'পাসওয়ার্ড পরিবর্তন', icon: <Settings size={20} /> },
  ];

  const parentMenu: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'parent-home', label: 'হোম', icon: <Home size={20} /> },
    { page: 'ai-assistant', label: 'AI সহকারী', icon: <Bot size={20} /> },
    { page: 'parent-id-card', label: 'সন্তানের আইডি কার্ড', icon: <IdCard size={20} /> },
    { page: 'parent-verification', label: 'ডকুমেন্ট ভেরিফিকেশন', icon: <BadgeCheck size={20} /> },
    { page: 'parent-history', label: 'উপস্থিতি ইতিহাস', icon: <History size={20} /> },
    { page: 'parent-results', label: 'ফলাফল', icon: <GraduationCap size={20} /> },
    { page: 'parent-fees', label: 'ফি', icon: <Wallet size={20} /> },
    { page: 'parent-routine', label: 'ক্লাস রুটিন', icon: <CalendarClock size={20} /> },
    { page: 'parent-homework', label: 'হোমওয়ার্ক', icon: <NotebookPen size={20} /> },
    { page: 'parent-announcements', label: 'নোটিশ বোর্ড', icon: <Megaphone size={20} /> },
    { page: 'parent-library', label: 'লাইব্রেরি', icon: <BookMarked size={20} /> },
    { page: 'parent-syllabus', label: 'সিলেবাস', icon: <ListChecks size={20} /> },
    { page: 'parent-events', label: 'ইভেন্ট ক্যালেন্ডার', icon: <CalendarDays size={20} /> },
    { page: 'parent-leave', label: 'ছুটির আবেদন', icon: <CalendarOff size={20} /> },
    { page: 'parent-complaints', label: 'অভিযোগ ও পরামর্শ', icon: <MessageSquareWarning size={20} /> },
    { page: 'parent-settings', label: 'পাসওয়ার্ড পরিবর্তন', icon: <Settings size={20} /> },
  ];

  const menu = user.role === 'admin' ? adminMenu : user.role === 'teacher' ? teacherMenu : parentMenu;

  const roleColors = {
    admin: { bg: 'from-blue-700 to-blue-900', accent: 'blue' },
    teacher: { bg: 'from-green-700 to-green-900', accent: 'green' },
    parent: { bg: 'from-purple-700 to-purple-900', accent: 'purple' },
  };
  const colors = roleColors[user.role];

  const roleBadge = {
    admin: 'অ্যাডমিন',
    teacher: 'শিক্ষক',
    parent: 'অভিভাবক',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b ${colors.bg} text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen size={22} />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-tight">ভোলাচং উচ্চ বিদ্যালয়</h1>
                <p className="text-xs text-white/70">Attendance App</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{roleBadge[user.role]}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map(item => (
            <button
              key={item.page}
              onClick={() => { onPageChange(item.page); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentPage === item.page
                  ? 'bg-white/25 text-white shadow-lg'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {currentPage === item.page && <ChevronRight size={16} />}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:bg-red-500/30 hover:text-white transition"
          >
            <LogOut size={20} />
            <span>লগ আউট</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-800">
            <Menu size={24} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-800">
              {menu.find(m => m.page === currentPage)?.label || 'ড্যাশবোর্ড'}
            </h2>
          </div>
          <div className="text-right text-xs text-gray-500">
            {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
