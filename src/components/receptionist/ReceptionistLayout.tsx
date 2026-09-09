import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  UserPlus, 
  ListOrdered, 
  LogOut, 
  Clock, 
  Bell, 
  Shield, 
  User, 
  Activity,
  HeartPulse,
  Building2,
  Phone,
  Menu,
  X,
  Database
} from 'lucide-react';
import { MediHiveLogo } from '../common/MediHiveLogo';
import { 
  AppState, 
  Patient, 
  PatientVisit, 
  PatientVitals, 
  QueueItem, 
  UserAccount, 
  ClinicSettings 
} from '../../types';
import { 
  createVisitAndAddToQueue, 
  cancelPatientQueueItem 
} from '../../services/storage';
import { 
  createPatientInSupabase, 
  deletePatientInSupabase,
  updatePatientInSupabase,
  deleteQueueItemInSupabase, 
  clearCompletedQueueInSupabase,
  deleteVisitInSupabase 
} from '../../services/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseConnectionModal } from '../common/SupabaseConnectionModal';
import { ReceptionistDashboard } from './ReceptionistDashboard';
import { PatientSearchAndVisit } from './PatientSearchAndVisit';
import { NewPatientRegistration } from './NewPatientRegistration';
import { ReceptionistQueueView } from './ReceptionistQueueView';
import { PatientVisitForm } from './PatientVisitForm';
import { EditPatientModal } from '../patients/EditPatientModal';
import { useToast } from '../common/Toast';

export type ReceptionistTab = 'dashboard' | 'search' | 'new-patient' | 'queue';

interface ReceptionistLayoutProps {
  appState: AppState;
  onUpdateAppState: (updater: (prev: AppState) => AppState) => void;
  onLogout: () => void;
}

export const ReceptionistLayout: React.FC<ReceptionistLayoutProps> = ({
  appState,
  onUpdateAppState,
  onLogout,
}) => {
  const [currentTab, setCurrentTab] = useState<ReceptionistTab>('dashboard');
  const [activeVisitPatient, setActiveVisitPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  const { showToast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const activeWaitingCount = (appState.queue || []).filter(
    (q) => q.visitDate === today && (q.status === 'Waiting' || q.status === 'Next')
  ).length;

  // Handle saving new patient
  const handlePatientRegistered = (newPatient: Patient) => {
    onUpdateAppState((prev) => ({
      ...prev,
      patients: [newPatient, ...prev.patients],
    }));
    showToast(`Patient ${newPatient.fullName} registered successfully!`, 'success');

    // Persist new patient to Supabase
    createPatientInSupabase(newPatient).catch((err) => {
      console.warn('Supabase createPatient notice:', err);
    });

    // Offer to immediately start visit for this patient
    setActiveVisitPatient(newPatient);
  };

  // Handle submitting visit & adding to queue
  const handleSubmitVisit = (visitData: {
    complaint: string;
    symptoms: string[];
    symptomDuration?: string;
    vitals: PatientVitals;
  }) => {
    if (!activeVisitPatient) {
      throw new Error('No active patient selected for visit');
    }

    const { updatedState, newQueueItem, newVisit } = createVisitAndAddToQueue(
      appState,
      activeVisitPatient,
      {
        ...visitData,
        receptionistId: appState.currentUser?.id,
        receptionistName: appState.currentUser?.name,
      }
    );

    onUpdateAppState(() => updatedState);
    return { newQueueItem, newVisit };
  };

  // Handle cancelling a queue token
  const handleCancelQueueItem = (queueId: string) => {
    const updated = cancelPatientQueueItem(appState, queueId);
    onUpdateAppState(() => updated);
    showToast('Queue ticket cancelled', 'info');
  };

  // Handle deleting individual queue ticket
  const handleDeleteQueueItem = (queueId: string) => {
    onUpdateAppState((prev) => ({
      ...prev,
      queue: prev.queue.filter((q) => q.id !== queueId),
    }));
    deleteQueueItemInSupabase(queueId).catch((err) => {
      console.warn('Supabase deleteQueueItem error:', err);
    });
  };

  // Handle clearing completed and cancelled tokens
  const handleClearCompletedQueue = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    onUpdateAppState((prev) => ({
      ...prev,
      queue: prev.queue.filter(
        (q) => !(q.visitDate === todayStr && (q.status === 'Completed' || q.status === 'Cancelled'))
      ),
    }));
    clearCompletedQueueInSupabase().catch((err) => {
      console.warn('Supabase clearCompletedQueue error:', err);
    });
  };

  // Handle editing patient
  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
  };

  // Handle saving edited patient
  const handleSavePatient = (updatedPatient: Patient) => {
    onUpdateAppState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)),
    }));
    if (editingPatient?.id === updatedPatient.id) {
      setEditingPatient(null);
    }
    if (activeVisitPatient?.id === updatedPatient.id) {
      setActiveVisitPatient(updatedPatient);
    }
    showToast('Patient details updated successfully.', 'success');
    updatePatientInSupabase(updatedPatient).catch((err) => {
      console.warn('Supabase updatePatient error:', err);
    });
  };

  // Handle deleting patient and cascading cleanup
  const handleDeletePatient = (patientId: string) => {
    onUpdateAppState((prev) => ({
      ...prev,
      patients: prev.patients.filter((p) => p.id !== patientId),
      visits: prev.visits.filter((v) => v.patientId !== patientId),
      queue: prev.queue.filter((q) => q.patientId !== patientId),
      appointments: prev.appointments.filter((a) => a.patientId !== patientId),
    }));
    if (editingPatient?.id === patientId) {
      setEditingPatient(null);
    }
    if (activeVisitPatient?.id === patientId) {
      setActiveVisitPatient(null);
    }
    showToast('Patient and associated records deleted.', 'info');
    deletePatientInSupabase(patientId).catch((err) => {
      console.warn('Supabase deletePatient error:', err);
    });
  };

  // Handle deleting an individual visit record
  const handleDeleteVisit = (visitId: string) => {
    onUpdateAppState((prev) => {
      const visit = prev.visits.find((v) => v.id === visitId);
      return {
        ...prev,
        visits: prev.visits.filter((v) => v.id !== visitId),
        queue: visit?.queueId ? prev.queue.filter((q) => q.id !== visit.queueId) : prev.queue,
      };
    });
    showToast('Visit record deleted.', 'info');
    deleteVisitInSupabase(visitId).catch((err) => {
      console.warn('Supabase deleteVisit error:', err);
    });
  };

  const navItems = [
    { id: 'dashboard' as ReceptionistTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'search' as ReceptionistTab, label: 'Patient Check-in', icon: Search },
    { id: 'new-patient' as ReceptionistTab, label: 'New Patient', icon: UserPlus },
    { 
      id: 'queue' as ReceptionistTab, 
      label: 'Live Queue', 
      icon: ListOrdered,
      badge: activeWaitingCount > 0 ? activeWaitingCount : undefined
    },
  ];

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] bg-[#f4f7f9] overflow-hidden">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (Drawer on mobile/tablet, static on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#143242] text-slate-100 flex flex-col justify-between h-[100dvh] shrink-0 border-r border-[#0f2835] select-none no-print transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 sm:p-5 border-b border-[#1f455a] flex items-center justify-between">
            <div>
              <MediHiveLogo size="md" textColor="text-white" />
              <div className="flex items-center gap-2 mt-2 pl-10">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  Reception Portal
                </span>
              </div>
            </div>
            {/* Close Button on Mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 lg:hidden transition"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1.5 mt-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id && !activeVisitPatient;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveVisitPatient(null);
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[#235874] text-white shadow-inner font-semibold'
                      : 'text-sky-100/80 hover:bg-[#1a4257] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-teal-300' : 'text-sky-200/70 group-hover:text-white'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-amber-400 text-slate-900 font-bold text-[11px] px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-[#1f455a] space-y-2">
          <div className="px-3.5 py-2 bg-[#1a4257]/60 rounded-lg flex items-center gap-3 border border-[#235874]/50">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">
                {appState.currentUser?.name || 'Reception Staff'}
              </p>
              <p className="text-[10px] text-teal-300/80 font-medium capitalize">
                Role: {appState.currentUser?.role || 'Receptionist'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-600/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[100dvh] min-h-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button on Mobile */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden transition flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                {appState.clinic?.name || 'MediHive Health Center'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                Front Desk / Patient Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Live Queue Status Pill */}
            <button
              onClick={() => {
                setActiveVisitPatient(null);
                setCurrentTab('queue');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer shrink-0"
              title="Click to view live queue"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span>{activeWaitingCount} <span className="hidden xs:inline">in Line</span></span>
            </button>

            {/* Cloud DB Status Pill */}
            <button
              onClick={() => setShowSupabaseModal(true)}
              type="button"
              title={
                isSupabaseConfigured
                  ? "Cloud Database (Supabase) is connected. Click to test or manage connection."
                  : "Cloud Database not connected (Running in local offline mode). Click to setup Supabase."
              }
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition cursor-pointer shrink-0 ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cloud DB:</span>
              <span>{isSupabaseConfigured ? 'Live' : 'Setup'}</span>
            </button>

            {/* Current Time Display */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Active Visit Flow */}
          {activeVisitPatient ? (
            <PatientVisitForm
              patient={activeVisitPatient}
              currentUser={appState.currentUser}
              onBack={() => setActiveVisitPatient(null)}
              onSubmitVisit={handleSubmitVisit}
              onQueueSuccess={() => {
                setActiveVisitPatient(null);
                setCurrentTab('queue');
              }}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <ReceptionistDashboard
                  patients={appState.patients}
                  visits={appState.visits}
                  queue={appState.queue}
                  onNavigateToSearch={(q) => {
                    setInitialSearchQuery(q || '');
                    setCurrentTab('search');
                  }}
                  onNavigateToNewPatient={() => setCurrentTab('new-patient')}
                  onNavigateToQueue={() => setCurrentTab('queue')}
                  onStartVisit={(patient) => setActiveVisitPatient(patient)}
                  onEditPatient={handleEditPatient}
                  onDeletePatient={handleDeletePatient}
                  onDeleteVisit={handleDeleteVisit}
                />
              )}

              {currentTab === 'search' && (
                <PatientSearchAndVisit
                  patients={appState.patients}
                  visits={appState.visits}
                  onStartNewVisit={(patient) => setActiveVisitPatient(patient)}
                  onNavigateToNewPatient={() => setCurrentTab('new-patient')}
                  onEditPatient={handleEditPatient}
                  onDeletePatient={handleDeletePatient}
                  onDeleteVisit={handleDeleteVisit}
                />
              )}

              {currentTab === 'new-patient' && (
                <NewPatientRegistration
                  existingPatients={appState.patients}
                  onBack={() => setCurrentTab('dashboard')}
                  onPatientRegistered={handlePatientRegistered}
                />
              )}

              {currentTab === 'queue' && (
                <ReceptionistQueueView
                  queue={appState.queue}
                  onCancelQueueItem={handleCancelQueueItem}
                  onDeleteQueueItem={handleDeleteQueueItem}
                  onClearCompletedQueue={handleClearCompletedQueue}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODAL: Edit Patient Demographics (Receptionist) */}
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          isOpen={Boolean(editingPatient)}
          onClose={() => setEditingPatient(null)}
          onSavePatient={handleSavePatient}
        />
      )}

      {/* MODAL: Supabase Connection & Diagnostics Modal */}
      <SupabaseConnectionModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />
    </div>
  );
};
