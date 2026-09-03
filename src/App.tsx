import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Patient, OPDRecord, Appointment, DoctorProfile, ClinicSettings, EmailConfig, UserAccount } from './types';
import { 
  loadAppState, 
  saveAppState, 
  setStoredAuthUser, 
  getStoredAuthUser 
} from './services/storage';
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

  const { showToast } = useToast();

  // Keep state synced in localStorage
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

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

  // If user is not logged in, show Login Screen
  if (!appState.currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
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
            />
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
 