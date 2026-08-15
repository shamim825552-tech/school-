import { useState } from 'react';
import { User, UserRole } from '../types';
import { getUsers, isAccountUsable } from '../data';
import { Shield, GraduationCap, Users, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getUsers();
    const user = users.find(
      u => u.phone === phone && u.password === password && u.role === selectedRole
    );
    if (user) {
      const usable = isAccountUsable(user);
      if (!usable.ok) {
        setError(usable.reason || 'আপনার আইডি দিয়ে লগইন করা যাবে না।');
        return;
      }
      onLogin(user);
    } else {
      setError('ভুল ফোন নম্বর বা পাসওয়ার্ড! আবার চেষ্টা করুন।');
    }
  };

  const roles: { role: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { role: 'admin', label: 'অ্যাডমিন', icon: <Shield size={24} />, color: 'from-blue-600 to-blue-800' },
    { role: 'teacher', label: 'শিক্ষক', icon: <GraduationCap size={24} />, color: 'from-green-600 to-green-800' },
    { role: 'parent', label: 'অভিভাবক', icon: <Users size={24} />, color: 'from-purple-600 to-purple-800' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 flex flex-col items-center justify-center p-4">
      {/* Logo & School Name */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
          <img src="/images/logo.png" alt="ভোলাচং উচ্চ বিদ্যালয়" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">ভোলাচং উচ্চ বিদ্যালয়</h1>
        <p className="text-lg text-green-700 font-semibold">Attendance App</p>
        <p className="text-sm text-gray-500 mt-1">ডিজিটাল উপস্থিতি ব্যবস্থাপনা</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Role Selector */}
        <div className="flex border-b">
          {roles.map(r => (
            <button
              key={r.role}
              onClick={() => { setSelectedRole(r.role); setError(''); }}
              className={`flex-1 py-4 px-2 flex flex-col items-center gap-1 text-sm font-medium transition-all ${
                selectedRole === r.role
                  ? `bg-gradient-to-b ${r.color} text-white`
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড দিন"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-xl text-white font-bold text-lg bg-gradient-to-r ${
              roles.find(r => r.role === selectedRole)?.color
            } hover:shadow-lg transform hover:-translate-y-0.5 transition-all`}
          >
            লগইন করুন
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        © ২০২৫ ভোলাচং উচ্চ বিদ্যালয় | সকল স্বত্ব সংরক্ষিত
      </p>
    </div>
  );
}
