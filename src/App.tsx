import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Patient, OPDRecord, Appointment, DoctorProfile, ClinicSettings, EmailConfig, UserAccount } from './types';
import { 
  loadAppState, 
  saveAppState, 
  setStoredAuthUser, 
  getStoredAuthUser,
  subscribeQueueEvents,
  callPatientIntoCabin,
  completeConsultationAndAdvanceQueue,
  cancelPatientQueueItem
} from './services/storage';
import { QueueItem } from './types';
import { ToastProvider, useToast } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { LoginScreen } from './components/auth/LoginScreen';
import { Dashboard } from './components/dashboard/Dashboard';
import { OpdRegistration } from './components/opd/OpdRegistration';
import { PrescriptionModal } from './components/prescription/PrescriptionModal';
import { PatientManagement } from './components/patients/PatientManagement';
import { PatientDetailsModal } from './components/patients/PatientDetailsModal';
import { EditPatientModal } from './components/patients/EditPatientModal';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { HelpCenter } from './components/help/HelpCenter';
import { ReceptionistLayout } from './components/receptionist/ReceptionistLayout';
import { ReceptionistQueueView } from './components/receptionist/ReceptionistQueueView';
import { DoctorConsultationModal } from './components/consultation/DoctorConsultationModal';
import { format } from 'date-fns';

const MainAppContent: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [preselectedOpdPatientId, setPreselectedOpdPatientId] = useState<string | undefined>(undefined);

  // Modals
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<{
    patient: Patient;
    record: OPDRecord;
  } | null>(null);
  const [activeConsultationQueueItem, setActiveConsultationQueueItem] = useState<QueueItem | null>(null);

  const { showToast } = useToast();

  // Keep state synced in localStorage
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Real-time synchronization across browser tabs
  useEffect(() => {
    const unsubscribe = subscribeQueueEvents(() => {
      setAppState(loadAppState());
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'medihive_clinic_state_v1' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setAppState((prev) => ({
            ...prev,
            patients: parsed.patients || [],
            visits: parsed.visits || [],
            queue: parsed.queue || [],
            appointments: parsed.appointments || [],
            dailyNotes: parsed.dailyNotes || {},
          }));
        } catch (err) {
          console.error('Storage cross-tab sync error:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Check follow-ups due today on load
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysFollowUps = useMemo(() => {
    const list: { patient: Patient; record: OPDRecord }[] = [];
    appState.patients.forEach((p) => {
      p.records.forEach((r) => {
        if (r.nextVisitDate === todayStr) {
          list.push({ patient: p, record: r });
        }
      });
    });
    return list;
  }, [appState.patients, todayStr]);

  // Waiting queue count for today
  const activeWaitingQueueCount = useMemo(() => {
    return (appState.queue || []).filter(
      (q) => q.visitDate === todayStr && (q.status === 'Waiting' || q.status === 'Next')
    ).length;
  }, [appState.queue, todayStr]);

  // Handle Login / Logout
  const handleLogin = (user: UserAccount) => {
    setStoredAuthUser(user);
    setAppState((prev) => ({ ...prev, currentUser: user }));
  };

  const handleLogout = () => {
    setStoredAuthUser(null);
    setAppState((prev) => ({ ...prev, currentUser: null }));
    showToast('Logged out successfully', 'info');
  };

  // State update actions
  const handleSaveOpdRecord = (patient: Patient, opdRecord: OPDRecord) => {
    setAppState((prev) => {
      const existingIdx = prev.patients.findIndex((p) => p.id === patient.id);
      let updatedPatients = [...prev.patients];

      if (existingIdx >= 0) {
        updatedPatients[existingIdx] = patient;
      } else {
        updatedPatients = [patient, ...updatedPatients];
      }

      return {
        ...prev,
        patients: updatedPatients,
      };
    });
  };

  const handleSavePatient = (updatedPatient: Patient) => {
    setAppState((prev) => {
      const updatedPatients = prev.patients.map((p) =>
        p.id === updatedPatient.id ? updatedPatient : p
      );
      return {
        ...prev,
        patients: updatedPatients,
      };
    });
    if (viewingPatient && viewingPatient.id === updatedPatient.id) {
      setViewingPatient(updatedPatient);
    }
  };

  const handleSaveDailyNote = (date: string, note: string) => {
    setAppState((prev) => ({
      ...prev,
      dailyNotes: {
        ...prev.dailyNotes,
        [date]: note,
      },
    }));
  };

  const handleSaveAppointment = (appointment: Appointment) => {
    setAppState((prev) => ({
      ...prev,
      appointments: [appointment, ...prev.appointments],
    }));
  };

  const handleDeleteAppointment = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== id),
    }));
    showToast('Appointment removed', 'info');
  };

  const handleUpdateDoctor = (doctor: DoctorProfile) => {
    setAppState((prev) => ({ ...prev, doctor }));
  };

  const handleUpdateClinic = (clinic: ClinicSettings) => {
    setAppState((prev) => ({ ...prev, clinic }));
  };

  const handleUpdateEmailConfig = (emailConfig: EmailConfig) => {
    setAppState((prev) => ({ ...prev, emailConfig }));
  };

  const handleRestoreBackup = (restoredState: AppState) => {
    setAppState(restoredState);
    saveAppState(restoredState);
  };

  // Queue actions for doctor
  const handleDoctorCallPatient = (queueId?: string) => {
    const { updatedState, activePatient } = callPatientIntoCabin(appState, queueId);
    setAppState(updatedState);
    if (activePatient) {
      showToast(`Calling ${activePatient.patientName} (${activePatient.queueNumber}) into Cabin`, 'info');
    }
  };

  const handleCompleteConsultation = (opdRecord: OPDRecord, autoCallNext: boolean) => {
    if (!activeConsultationQueueItem) return;
    const { updatedState, nextPatient } = completeConsultationAndAdvanceQueue(
      appState,
      activeConsultationQueueItem.id,
      opdRecord
    );

    if (autoCallNext && nextPatient) {
      const advanced = callPatientIntoCabin(updatedState, nextPatient.id);
      setAppState(advanced.updatedState);
      setActiveConsultationQueueItem(advanced.activePatient);
    } else {
      setAppState(updatedState);
      setActiveConsultationQueueItem(null);
    }
  };

  const handleCancelQueueItem = (queueId: string) => {
    const updated = cancelPatientQueueItem(appState, queueId);
    setAppState(updated);
    showToast('Queue ticket cancelled', 'info');
  };

  // If user is not logged in, show Login Screen
  if (!appState.currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // If user is receptionist, show dedicated Receptionist Portal
  if (appState.currentUser.role === 'receptionist') {
    return (
      <ReceptionistLayout
        appState={appState}
        onUpdateAppState={setAppState}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#f4f7f9] overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setPreselectedOpdPatientId(undefined);
          setCurrentTab(tab);
        }}
        onLogout={handleLogout}
        pendingFollowUpsCount={todaysFollowUps.length}
        activeQueueCount={activeWaitingQueueCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          doctor={appState.doctor}
          clinic={appState.clinic}
          activeFollowUpsCount={todaysFollowUps.length}
          onNavigateToCalendar={() => setCurrentTab('calendar')}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              patients={appState.patients}
              queue={appState.queue}
              onAddPatient={() => {
                setPreselectedOpdPatientId(undefined);
                setCurrentTab('opd');
              }}
              onViewPatient={(patient) => setViewingPatient(patient)}
              onEditPatient={(patient) => setEditingPatient(patient)}
              onNavigateToOpd={(patientId) => {
                setPreselectedOpdPatientId(patientId);
                setCurrentTab('opd');
              }}
              onNavigateToCalendar={() => setCurrentTab('calendar')}
              onNavigateToPatients={() => setCurrentTab('patients')}
              onCallPatientIntoCabin={handleDoctorCallPatient}
              onOpenConsultation={(item) => setActiveConsultationQueueItem(item)}
              onNavigateToQueue={() => setCurrentTab('queue')}
            />
          )}

          {currentTab === 'queue' && (
            <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 page-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Doctor's Live Clinic Queue</h1>
                  <p className="text-xs text-slate-500">Live FIFO patient sequence and cabin admission</p>
                </div>
              </div>
              <ReceptionistQueueView
                queue={appState.queue}
                onCancelQueueItem={handleCancelQueueItem}
              />
            </div>
          )}

          {currentTab === 'opd' && (
            <OpdRegistration
              patients={appState.patients}
              preselectedPatientId={preselectedOpdPatientId}
              onBack={() => setCurrentTab('dashboard')}
              onSaveOpdRecord={handleSaveOpdRecord}
              onGeneratePrescription={(patient, record) => {
                setPrescriptionData({ patient, record });
              }}
            />
          )}

          {currentTab === 'patients' && (
            <PatientManagement
              patients={appState.patients}
              onAddPatient={() => {
                setPreselectedOpdPatientId(undefined);
                setCurrentTab('opd');
              }}
              onViewPatient={(patient) => setViewingPatient(patient)}
              onEditPatient={(patient) => setEditingPatient(patient)}
              onPrintLatestPrescription={(patient, record) => {
                setPrescriptionData({ patient, record });
              }}
              onBack={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              patients={appState.patients}
              appointments={appState.appointments}
              dailyNotes={appState.dailyNotes}
              onSaveDailyNote={handleSaveDailyNote}
              onSaveAppointment={handleSaveAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onBack={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              doctor={appState.doctor}
              clinic={appState.clinic}
              emailConfig={appState.emailConfig}
              fullState={appState}
              onUpdateDoctor={handleUpdateDoctor}
              onUpdateClinic={handleUpdateClinic}
              onUpdateEmailConfig={handleUpdateEmailConfig}
              onRestoreBackup={handleRestoreBackup}
              onBack={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'help' && (
            <HelpCenter onBack={() => setCurrentTab('dashboard')} />
          )}
        </main>
      </div>

      {/* MODAL: View Patient Multi-Visit History (Page 8) */}
      <PatientDetailsModal
        patient={viewingPatient}
        isOpen={Boolean(viewingPatient)}
        onClose={() => setViewingPatient(null)}
        onPreviewPrescription={(record) => {
          if (viewingPatient) {
            setPrescriptionData({ patient: viewingPatient, record });
          }
        }}
        onPrintPrescription={(record) => {
          if (viewingPatient) {
            setPrescriptionData({ patient: viewingPatient, record });
          }
        }}
        onAddNewOpd={(patientId) => {
          setViewingPatient(null);
          setPreselectedOpdPatientId(patientId);
          setCurrentTab('opd');
        }}
      />

      {/* MODAL: Edit Patient Demographics */}
      <EditPatientModal
        patient={editingPatient}
        isOpen={Boolean(editingPatient)}
        onClose={() => setEditingPatient(null)}
        onSavePatient={handleSavePatient}
      />

      {/* MODAL: Prescription Preview, Letterhead, Print & PDF (Page 6) */}
      {prescriptionData && (
        <PrescriptionModal
          patient={prescriptionData.patient}
          record={prescriptionData.record}
          doctor={appState.doctor}
          clinic={appState.clinic}
          isOpen={Boolean(prescriptionData)}
          onClose={() => setPrescriptionData(null)}
          onEdit={() => {
            setPrescriptionData(null);
            setPreselectedOpdPatientId(prescriptionData.patient.id);
            setCurrentTab('opd');
          }}
          onConfirmSave={() => {
            setPrescriptionData(null);
            showToast('Prescription confirmed and archived!', 'success');
          }}
        />
      )}

      {/* MODAL: Doctor Active Consultation Modal */}
      {activeConsultationQueueItem && (
        <DoctorConsultationModal
          isOpen={Boolean(activeConsultationQueueItem)}
          onClose={() => setActiveConsultationQueueItem(null)}
          queueItem={activeConsultationQueueItem}
          patient={
            appState.patients.find((p) => p.id === activeConsultationQueueItem.patientId) || {
              id: activeConsultationQueueItem.patientId,
              fullName: activeConsultationQueueItem.patientName,
              age: activeConsultationQueueItem.patientAge,
              gender: activeConsultationQueueItem.patientGender,
              mobile: activeConsultationQueueItem.patientMobile,
              registrationDate: todayStr,
              lastVisitDate: todayStr,
              records: [],
              totalVisits: 0,
              createdAt: '',
            }
          }
          doctor={appState.doctor}
          clinic={appState.clinic}
          existingPatients={appState.patients}
          onCompleteConsultation={handleCompleteConsultation}
          onViewHistory={(patient) => setViewingPatient(patient)}
          onPreviewPrescription={(patient, record) => {
            setPrescriptionData({ patient, record });
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <ToastProvider>
      <MainAppContent />
    </ToastProvider>
  );
}

export default App;
 