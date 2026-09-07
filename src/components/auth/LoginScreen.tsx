import React, { useState } from 'react';
import { MediHiveLogo } from '../common/MediHiveLogo';
import { UserAccount } from '../../types';
import { useToast } from '../common/Toast';
import { validateCredentials } from '../../services/storage';
import { KeyRound, User, Lock, ArrowRight, Stethoscope, ClipboardList, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'receptionist'>('doctor');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleRoleSelect = (role: 'doctor' | 'receptionist') => {
    setSelectedRole(role);
    setUsername('');
    setPassword('');
  };

  const handleQuickFill = (role: 'doctor' | 'receptionist') => {
    setSelectedRole(role);
    if (role === 'doctor') {
      setUsername('doctor');
      setPassword('doctor123');
    } else {
      setUsername('receptionist');
      setPassword('reception123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password.', 'error');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const validatedUser = validateCredentials(username, password);
      if (validatedUser) {
        // Enforce role consistency if desired, or auto-detect
        if (selectedRole === 'receptionist' && validatedUser.role === 'doctor') {
          showToast('Logged in as Doctor with clinical permissions.', 'info');
        } else if (selectedRole === 'doctor' && validatedUser.role === 'receptionist') {
          showToast('This account has Receptionist role. Redirecting to Receptionist panel.', 'info');
        } else {
          showToast(`Welcome back, ${validatedUser.name}!`, 'success');
        }
        onLogin(validatedUser);
      } else {
        showToast('Invalid username or password. Please verify your credentials.', 'error');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Top micro brand indicator */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          MediHive — Clinical Practice & Reception Suite
        </span>
        <span className="text-xs text-slate-400">Role-Based Access Control</span>
      </div>

      {/* Main Login Card with Split Style matching Page 2 */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/80 flex flex-col md:flex-row min-h-[500px]">
        {/* Left Dark Teal Panel */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-[#1e536e] via-[#1a475e] to-[#123141] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow / honeycomb pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div>
            <MediHiveLogo size="lg" textColor="text-white" />
          </div>

          <div className="my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-semibold mb-3 border border-white/10">
              {selectedRole === 'doctor' ? (
                <>
                  <Stethoscope className="w-3.5 h-3.5 text-sky-300" />
                  <span>Doctor Consultation Suite</span>
                </>
              ) : (
                <>
                  <ClipboardList className="w-3.5 h-3.5 text-sky-300" />
                  <span>Frontdesk & Triage Suite</span>
                </>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              {selectedRole === 'doctor' ? 'DOCTOR PORTAL' : 'RECEPTION DESK'}
            </h1>
            <p className="text-sky-100/80 text-sm leading-relaxed">
              {selectedRole === 'doctor'
                ? 'Sign in to access your consultations, OPD prescriptions, medical history, and live patient queue.'
                : 'Sign in to register patients, record complaints and vitals, and coordinate the live FIFO waiting queue.'}
            </p>
          </div>

          <div className="text-xs text-sky-200/60 pt-4 border-t border-white/10 flex items-center justify-between">
            <span>Secure Role-Based Authentication</span>
            <span className="capitalize font-semibold text-sky-300">{selectedRole} Mode</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-2 mb-1">
              <MediHiveLogo size="md" textColor="text-[#1e536e]" />
            </div>
            <p className="text-xs text-slate-500 font-medium">Select your clinic role to begin</p>
          </div>

          {/* Role Tabs Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 max-w-sm mx-auto w-full border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleRoleSelect('doctor')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                selectedRole === 'doctor'
                  ? 'bg-[#1e536e] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('receptionist')}
              className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                selectedRole === 'receptionist'
                  ? 'bg-[#2ba4c7] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Receptionist</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                {selectedRole === 'doctor' ? 'Doctor Username' : 'Receptionist Username'}
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
                  placeholder={selectedRole === 'doctor' ? 'e.g. doctor or admin' : 'e.g. receptionist'}
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

            {/* Quick Demo Fill Buttons for Testing */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Quick Login:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill('doctor')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-200 transition"
                >
                  Doctor Fill
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('receptionist')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded border border-slate-200 transition"
                >
                  Reception Fill
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow transition flex items-center justify-center gap-2 group ${
                selectedRole === 'doctor'
                  ? 'bg-[#1e536e] hover:bg-[#18445a]'
                  : 'bg-[#2ba4c7] hover:bg-[#228da8]'
              }`}
            >
              <span>{loading ? 'Authenticating...' : `Log In as ${selectedRole === 'doctor' ? 'Doctor' : 'Receptionist'}`}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-medium text-sky-600 hover:text-sky-800 transition"
              >
                Forgot Password or Need Access?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Feature Guide Info Banner */}
      <div className="w-full max-w-4xl mt-6 bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex items-start gap-3 text-sm text-slate-600 shadow-xs">
        <span className="text-base shrink-0">🔒</span>
        <p className="leading-relaxed">
          <strong className="font-semibold text-slate-700">Practice Security:</strong> Please authenticate to access your patient directory, prescriptions, and clinic ledger. Initial master credentials: <code>admin</code> / <code>admin123</code> (can be customized under Settings).
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
              <p>• <strong>Doctor Login:</strong> <code>doctor</code> / <code>doctor123</code> (or <code>admin</code> / <code>admin123</code>)</p>
              <p>• <strong>Receptionist Login:</strong> <code>receptionist</code> / <code>reception123</code></p>
              <p>• Passwords can be changed under <strong>Settings &gt; Authentication</strong> after logging in.</p>
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

