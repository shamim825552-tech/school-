import { User } from '../types';
import { getStudents, getBooks, getBookIssues, formatDate, getTodayStr } from '../data';
import { BookMarked } from 'lucide-react';

interface Props {
  user: User;
}

export default function ParentLibrary({ user }: Props) {
  const child = getStudents().find(s => s.id === user.childId);
  const books = getBooks();
  const todayStr = getTodayStr();

  if (!child) {
    return <div className="bg-white rounded-xl p-12 text-center"><p className="text-lg text-gray-400">শিক্ষার্থীর তথ্য পাওয়া যায়নি</p></div>;
  }

  const issues = getBookIssues()
    .filter(i => i.studentId === child.id)
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  const bookTitle = (id: string) => books.find(b => b.id === id)?.title || 'অজানা';
  const bookAuthor = (id: string) => books.find(b => b.id === id)?.author || '';

  return (
    <div className="space-y-3">
      {issues.map(issue => {
        const overdue = issue.status === 'issued' && issue.dueDate < todayStr;
        return (
          <div key={issue.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
            issue.status === 'returned' ? 'border-gray-300' : overdue ? 'border-red-400' : 'border-sky-500'
          }`}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                <BookMarked size={18} className="text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{bookTitle(issue.bookId)}</p>
                <p className="text-xs text-gray-500">{bookAuthor(issue.bookId)}</p>
                <p className={`text-xs mt-2 ${issue.status === 'returned' ? 'text-gray-400' : overdue ? 'text-red-600 font-medium' : 'text-sky-600 font-medium'}`}>
                  {issue.status === 'returned'
                    ? `ফেরত দেওয়া হয়েছে: ${formatDate(issue.returnDate!)}`
                    : `ফেরতের শেষ তারিখ: ${formatDate(issue.dueDate)}${overdue ? ' (মেয়াদোত্তীর্ণ)' : ''}`}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {issues.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <BookMarked size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-400">কোনো বই ইস্যু করা হয়নি</p>
        </div>
      )}
    </div>
  );
}
