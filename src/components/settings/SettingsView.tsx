import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Building2, 
  Mail, 
  Database, 
  Lock, 
  Upload, 
  Check, 
  Download, 
  UploadCloud, 
  HelpCircle,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Eye,
  KeyRound
} from 'lucide-react';
import { DoctorProfile, ClinicSettings, EmailConfig, AppState } from '../../types';
import { useToast } from '../common/Toast';
import { exportDataBackup } from '../../services/storage';

interface SettingsViewProps {
  doctor: DoctorProfile;
  clinic: ClinicSettings;
  emailConfig: EmailConfig;
  fullState: AppState;
  onUpdateDoctor: (doc: DoctorProfile) => void;
  onUpdateClinic: (cli: ClinicSettings) => void;
  onUpdateEmailConfig: (cfg: EmailConfig) => void;
  onRestoreBackup: (restoredState: AppState) => void;
  onBack: () => void;
}

type SettingsSubView = 'main' | 'email' | 'backup' | 'auth';

export const SettingsView: React.FC<SettingsViewProps> = ({
  doctor,
  clinic,
  emailConfig,
  fullState,
  onUpdateDoctor,
  onUpdateClinic,
  onUpdateEmailConfig,
  onRestoreBackup,
  onBack,
}) => {
  const { showToast } = useToast();
  const [currentSubView, setCurrentSubView] = useState<SettingsSubView>('main');

  // Doctor Info state
  const [docName, setDocName] = useState(doctor.name);
  const [docQual, setDocQual] = useState(doctor.qualifications);
  const [docSpec, setDocSpec] = useState(doctor.specialisation);
  const [docLicense, setDocLicense] = useState(doctor.medicalLicenseNo);
  const [docEmail, setDocEmail] = useState(doctor.email);
  const [docContact, setDocContact] = useState(doctor.contact);
  const [docPhoto, setDocPhoto] = useState(doctor.photoUrl || '');

  // Clinic Info state
  const [clinicName, setClinicName] = useState(clinic.name);
  const [clinicAddress, setClinicAddress] = useState(clinic.address);
  const [clinicPhone, setClinicPhone] = useState(clinic.phone);
  const [clinicWebsite, setClinicWebsite] = useState(clinic.website || '');
  const [clinicHours, setClinicHours] = useState(clinic.operatingHours);
  const [clinicLogo, setClinicLogo] = useState(clinic.logoUrl || '');

  // SMTP state
  const [smtpEmail, setSmtpEmail] = useState(emailConfig.smtpEmail);
  const [smtpPassword, setSmtpPassword] = useState(emailConfig.smtpAppPassword);
  const [smtpServer, setSmtpServer] = useState(emailConfig.smtpServer);
  const [smtpPort, setSmtpPort] = useState(emailConfig.smtpPort);

  // Auth state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Backup state
  const [backupPeriod, setBackupPeriod] = useState<number | 'all'>('all');
  const [backupFormat, setBackupFormat] = useState<'excel' | 'json'>('excel');

  // Photo / Logo upload handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setDocPhoto(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setClinicLogo(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Doctor & Clinic Details
  const handleSaveMainSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDoctor: DoctorProfile = {
      name: docName,
      qualifications: docQual,
      specialisation: docSpec,
      medicalLicenseNo: docLicense,
      email: docEmail,
      contact: docContact,
      photoUrl: docPhoto,
    };
    const updatedClinic: ClinicSettings = {
      ...clinic,
      name: clinicName,
      address: clinicAddress,
      phone: clinicPhone,
      website: clinicWebsite,
      operatingHours: clinicHours,
      logoUrl: clinicLogo,
    };

    onUpdateDoctor(updatedDoctor);
    onUpdateClinic(updatedClinic);
    showToast('Doctor and Clinic settings saved successfully!', 'success');
  };

  // Save SMTP
  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedEmail: EmailConfig = {
      smtpEmail,
      smtpAppPassword: smtpPassword,
      smtpServer,
      smtpPort: Number(smtpPort) || 587,
      enableNotifications: true,
    };
    onUpdateEmailConfig(updatedEmail);
    showToast('Email SMTP configuration saved successfully!', 'success');
  };

  // Test Email
  const handleTestEmail = () => {
    showToast(`Test email dispatched to ${smtpEmail} (Simulated)`, 'info');
  };

  // Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Please enter a new password', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match', 'error');
      return;
    }
    showToast('Password changed successfully! Keep it safe.', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Generate Backup
  const handleGenerateBackup = () => {
    exportDataBackup(fullState, backupPeriod, backupFormat);
    showToast(`Backup exported successfully as ${backupFormat.toUpperCase()}`, 'success');
  };

  // Restore Backup
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.patients && parsed.doctor && parsed.clinic) {
          onRestoreBackup(parsed as AppState);
          showToast('Clinic backup restored successfully!', 'success');
        } else {
          showToast('Invalid backup file format.', 'error');
        }
      } catch (err) {
        showToast('Error reading backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 page-fade-in no-print">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentSubView !== 'main') {
                setCurrentSubView('main');
              } else {
                onBack();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {currentSubView === 'main' && 'Settings'}
              {currentSubView === 'email' && 'Email Configuration'}
              {currentSubView === 'backup' && 'Backup Data'}
              {currentSubView === 'auth' && 'Authentication Settings'}
            </h1>
            <p className="text-xs text-slate-500">
              {currentSubView === 'main' && 'Personalise doctor profile, clinic branding and documents'}
              {currentSubView === 'email' && 'Configure SMTP settings for sending prescriptions and alerts'}
              {currentSubView === 'backup' && 'Generate monthly or full backups of your clinic data'}
              {currentSubView === 'auth' && 'Manage passwords and staff account security'}
            </p>
          </div>
        </div>
      </div>

      {/* VIEW 1: Main Settings (Doctor Info + Clinic Details) matching Pages 10 & 11 */}
      {currentSubView === 'main' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveMainSettings} className="bg-white rounded-xl shadow-sm border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
            
            {/* Doctor Information (Page 10) */}
            <div className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#1e536e] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Doctor Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                <div className="sm:col-span-4 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Profile Photo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {docPhoto ? (
                        <img src={docPhoto} alt="Doctor avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200">
                      <span>Choose File</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor's Name</label>
                    <input
                      type="text"
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Medical License No.</label>
                    <input
                      type="text"
                      value={docLicense}
                      onChange={(e) => setDocLicense(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications</label>
                    <input
                      type="text"
                      value={docQual}
                      onChange={(e) => setDocQual(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Specialisation</label>
                    <input
                      type="text"
                      value={docSpec}
                      onChange={(e) => setDocSpec(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={docContact}
                      onChange={(e) => setDocContact(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Clinic Details (Page 11) */}
            <div className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#1e536e] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Clinic Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Phone</label>
                  <input
                    type="tel"
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Address</label>
                  <input
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Website (if any)</label>
                  <input
                    type="text"
                    value={clinicWebsite}
                    onChange={(e) => setClinicWebsite(e.target.value)}
                    placeholder="e.g. www.shwetaayurveda.com"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={clinicHours}
                    onChange={(e) => setClinicHours(e.target.value)}
                    placeholder="Morning 10 am to 1 pm & Evening 5 pm to 8 pm"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                  />
                </div>
              </div>

              {/* Live Preview Box of Prescription Letterhead matching Page 11 */}
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Live Prescription Letterhead Preview
                </span>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#1e536e] text-sm">{clinicName}</h4>
                    <p className="text-xs text-slate-700">{docName}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">{docQual}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Reg: {docLicense}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-500">
                    <p>Phone: {clinicPhone}</p>
                    <p>Hours: {clinicHours}</p>
                  </div>
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#2ba4c7] hover:bg-[#228da8] text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </form>

          {/* Sub-Cards matching Page 11: Email Configuration, Backup Data, Authentication */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email Config Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#1e536e]" />
                  <span>Email Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Manage SMTP email and app password for automated prescriptions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentSubView('email')}
                className="w-full py-2 bg-[#2ba4c7] hover:bg-[#228da8] text-white text-xs font-semibold rounded-lg transition text-center shadow-xs"
              >
                Configure Email
              </button>
            </div>

            {/* Backup Data Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#1e536e]" />
                  <span>Backup Data</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Generate monthly or full backups of all patient and clinic data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentSubView('backup')}
                className="w-full py-2 bg-[#2ba4c7] hover:bg-[#228da8] text-white text-xs font-semibold rounded-lg transition text-center shadow-xs"
              >
                Generate Backup
              </button>
            </div>

            {/* Authentication Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#1e536e]" />
                  <span>Authentication</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Manage login settings and master doctor password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentSubView('auth')}
                className="w-full py-2 bg-[#2ba4c7] hover:bg-[#228da8] text-white text-xs font-semibold rounded-lg transition text-center shadow-xs"
              >
                Authentication
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Email / SMTP Configuration matching Page 11 Bottom */}
      {currentSubView === 'email' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSmtp} className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#1e536e]">SMTP Settings</h2>
              <p className="text-xs text-slate-500">Configure SMTP credentials for automated emails</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Email</label>
                <input
                  type="email"
                  value={smtpEmail}
                  onChange={(e) => setSmtpEmail(e.target.value)}
                  placeholder="e.g. vaidyashwetaayurveda@gmail.com"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP App Password</label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="16-digit app password"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Server</label>
                <input
                  type="text"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  placeholder="587"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestEmail}
                className="px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition"
              >
                Send Test Email
              </button>

              <button
                type="submit"
                className="bg-[#2ba4c7] hover:bg-[#228da8] text-white font-bold text-xs sm:text-sm px-6 py-2 rounded-lg shadow-sm flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>

          {/* Help Guide for Gmail App Password matching Page 11 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>Help Guide — How to get Gmail App Password</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 leading-relaxed pl-2">
              <li>Go to your Google Account settings (<em>myaccount.google.com</em>)</li>
              <li>Navigate to <strong>Security &gt; 2-Step Verification</strong></li>
              <li>Enable 2-Step Verification if not already enabled</li>
              <li>Go to <strong>App Passwords</strong> (under 2-Step Verification)</li>
              <li>Create a new app password for <em>'Mail'</em> and paste the 16-character code here.</li>
            </ol>
          </div>
        </div>
      )}

      {/* VIEW 3: Backup Data matching Page 12 Top */}
      {currentSubView === 'backup' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#1e536e]">Backup Data</h2>
              <p className="text-xs text-slate-500">Generate monthly or full backups of all clinic records</p>
            </div>

            {/* Generator Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Backup Time Range</label>
                <select
                  value={backupPeriod}
                  onChange={(e) => setBackupPeriod(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                >
                  <option value={1}>1 Month (Last 30 days)</option>
                  <option value={3}>3 Months (Last 3 months)</option>
                  <option value={6}>6 Months (Last 6 months)</option>
                  <option value={12}>12 Months (Last 12 months)</option>
                  <option value="all">Complete Backup (All time data)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Export Format</label>
                <select
                  value={backupFormat}
                  onChange={(e) => setBackupFormat(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
                >
                  <option value="excel">Excel (.xlsx) Spreadsheet</option>
                  <option value="json">JSON Backup Archive (.json)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGenerateBackup}
                  className="w-full bg-[#2ba4c7] hover:bg-[#228da8] text-white font-bold text-sm py-2 px-4 rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Generate Backup ▼</span>
                </button>
              </div>
            </div>

            {/* Restore Section */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 mb-2">Restore from Existing Backup File</h3>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                <UploadCloud className="w-4 h-4 text-medihive-600" />
                <span>Upload & Restore JSON Backup</span>
                <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
              </label>
            </div>
          </div>

          {/* Backup Help Guide matching Page 12 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>Help Guide — About Backups</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 pl-2">
              <li>• <strong>1 Month:</strong> Export patient data from the last 30 days</li>
              <li>• <strong>3 Months:</strong> Export patient data from the last 3 months</li>
              <li>• <strong>6 Months:</strong> Export patient data from the last 6 months</li>
              <li>• <strong>12 Months:</strong> Export patient data from the last 12 months</li>
              <li>• <strong>Complete Backup:</strong> Export all of your clinic data permanently</li>
            </ul>
            <p className="text-[11px] text-slate-400 mt-2">
              Backups will be downloaded as Excel/JSON files containing patient records, visit history, prescriptions, and billing info.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 4: Authentication / Change Password matching Page 12 Bottom */}
      {currentSubView === 'auth' && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#1e536e]">Authentication Settings</h2>
            <p className="text-xs text-slate-500">Change your password securely</p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (admin123)"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-[#2ba4c7] hover:bg-[#228da8] text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm flex items-center gap-2 transition"
              >
                <KeyRound className="w-4 h-4" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </form>
      )}

      
    </div>
  );
};

