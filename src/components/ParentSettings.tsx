import { useState } from 'react';
import { User } from '../types';
import { getUsers, saveUsers } from '../data';
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface ParentSettingsProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

export default function ParentSettings({ user, onUserUpdate }: ParentSettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (currentPassword !== user.password) {
      setError('বর্তমান পাসওয়ার্ড ভুল হয়েছে।');
      return;
    }
    if (newPassword.length < 6) {
      setError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।');
      return;
    }

    const users = getUsers();
    const updatedUser: User = { ...user, password: newPassword };
    const updatedUsers = users.map(u => (u.id === user.id ? updatedUser : u));
    saveUsers(updatedUsers);
    onUserUpdate(updatedUser);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess('আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।');
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-purple-900 p-5 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <KeyRound size={22} />
          </div>
          <div>
            <h2 className="font-bold">পাসওয়ার্ড পরিবর্তন</h2>
            <p className="text-xs text-white/70">আপনার লগইন পাসওয়ার্ড পরিবর্তন করুন</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">বর্তমান পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="যাচাইয়ের জন্য বর্তমান পাসওয়ার্ড দিন"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">নতুন পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড লিখুন"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
            <input
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="আবার লিখুন"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <CheckCircle2 size={18} /> {success}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-bold bg-gradient-to-r from-purple-700 to-purple-900 hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          >
            পাসওয়ার্ড পরিবর্তন করুন
          </button>
        </form>
      </div>
    </div>
  );
}
