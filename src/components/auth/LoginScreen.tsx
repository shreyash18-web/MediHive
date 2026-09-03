import React, { useState } from 'react';
import { MediHiveLogo } from '../common/MediHiveLogo';
import { UserAccount } from '../../types';
import { useToast } from '../common/Toast';
import { KeyRound, User, Lock, HelpCircle, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Demo validation
      if (username.trim() && password.trim()) {
        const user: UserAccount = {
          id: 'usr-1',
          username: username.trim(),
          name: 'Dr. Shweta N. Sawant',
          role: 'doctor',
          passwordHash: password,
        };
        showToast('Logged in successfully! Welcome to MediHive.', 'success');
        onLogin(user);
      } else {
        showToast('Please enter both username and password.', 'error');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Top micro brand indicator */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          MediHive — Clinical Practice Suite
        </span>
        <span className="text-xs text-slate-400">v1.0.2 Offline-First</span>
      </div>

      {/* Main Login Card with Split Style matching Page 2 */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/80 flex flex-col md:flex-row min-h-[480px]">
        {/* Left Dark Teal Panel */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-[#1e536e] via-[#1a475e] to-[#123141] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow / honeycomb pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div>
            <MediHiveLogo size="lg" textColor="text-white" />
          </div>

          <div className="my-auto py-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              HELLO!
            </h1>
            <p className="text-sky-100/80 text-sm leading-relaxed">
              Please login to continue to your clinic dashboard, patient records & prescriptions.
            </p>
          </div>

          <div className="text-xs text-sky-200/60 pt-4 border-t border-white/10">
            Secure On-Device Clinic Database
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-2 mb-2">
              <MediHiveLogo size="md" textColor="text-[#1e536e]" />
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">Enter your credentials to access your clinic</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#2ba4c7] hover:bg-[#228da8] text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow transition flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Authenticating...' : 'Log In'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-medium text-sky-600 hover:text-sky-800 transition"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Feature Guide Info Banner */}
      <div className="w-full max-w-4xl mt-6 bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-4 flex items-start gap-3 text-sm text-emerald-900 shadow-sm">
        <span className="text-lg shrink-0">💡</span>
        <p className="leading-relaxed">
          <strong className="font-semibold">Team Security:</strong> Each team member has their own login. This keeps your clinic data safe and ensures that changes can be tracked correctly.
          <span className="block text-xs text-emerald-700/80 mt-1">Default credentials: Username: <code>admin</code> | Password: <code>admin123</code></span>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-[#1e536e]">
              <div className="p-2 bg-sky-100 rounded-lg">
                <KeyRound className="w-6 h-6 text-sky-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Reset Password</h3>
                <p className="text-xs text-slate-500">MediHive Security Assistance</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              MediHive stores all records locally on your device for absolute patient privacy. To reset your master password:
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <p>• <strong>Default Doctor Password:</strong> <code>admin123</code></p>
              <p>• You can also change the password at any time from <strong>Settings &gt; Authentication</strong> after logging in.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 text-sm bg-medihive-700 text-white font-medium rounded-lg hover:bg-medihive-800 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

