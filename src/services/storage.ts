import * as XLSX from 'xlsx';
import { 
  AppState, 
  Patient, 
  OPDRecord, 
  DoctorProfile, 
  ClinicSettings, 
  EmailConfig, 
  Appointment, 
  UserAccount 
} from '../types';
import { 
  initialDoctor, 
  initialClinic, 
  initialEmailConfig, 
  initialPatients, 
  initialAppointments, 
  initialDailyNotes 
} from './mockData';

const STORAGE_KEY = 'medihive_app_state_v1';
const AUTH_KEY = 'medihive_auth_user';

const defaultUser: UserAccount = {
  id: 'usr-1',
  username: 'admin',
  name: 'Dr. Shweta N. Sawant',
  role: 'doctor',
  passwordHash: 'admin123', // In a real app this is salted & hashed
};

export const getStoredAuthUser = (): UserAccount | null => {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading auth user', e);
  }
  // Default logged in user if not explicitly logged out
  return defaultUser;
};

export const setStoredAuthUser = (user: UserAccount | null) => {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
};

export const loadAppState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentUser: getStoredAuthUser(),
        doctor: parsed.doctor || initialDoctor,
        clinic: parsed.clinic || initialClinic,
        emailConfig: parsed.emailConfig || initialEmailConfig,
        patients: parsed.patients || initialPatients,
        appointments: parsed.appointments || initialAppointments,
        dailyNotes: parsed.dailyNotes || initialDailyNotes,
      };
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }

  const freshState: AppState = {
    currentUser: defaultUser,
    doctor: initialDoctor,
    clinic: initialClinic,
    emailConfig: initialEmailConfig,
    patients: initialPatients,
    appointments: initialAppointments,
    dailyNotes: initialDailyNotes,
  };
  saveAppState(freshState);
  return freshState;
};

export const saveAppState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
};

// Helper: Generate next Patient ID (e.g. P0004)
export const generateNextPatientId = (patients: Patient[]): string => {
  if (!patients || patients.length === 0) return 'P0001';
  const numericIds = patients
    .map(p => {
      const match = p.id.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter(n => !isNaN(n));

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const nextNum = maxId + 1;
  return `P${nextNum.toString().padStart(4, '0')}`;
};

// Helper: Generate next OPD record ID (e.g. OPD-2026-004)
export const generateNextOpdId = (patients: Patient[]): string => {
  const currentYear = new Date().getFullYear();
  let maxNum = 0;
  patients.forEach(p => {
    p.records.forEach(r => {
      const match = r.id.match(/OPD-\d+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
  });
  const nextNum = maxNum + 1;
  return `OPD-${currentYear}-${nextNum.toString().padStart(3, '0')}`;
};

// Helper: Export Backup as Excel or JSON
export const exportDataBackup = (
  state: AppState,
  periodMonths: number | 'all',
  format: 'json' | 'excel'
) => {
  const cutoffDate = new Date();
  if (typeof periodMonths === 'number') {
    cutoffDate.setMonth(cutoffDate.getMonth() - periodMonths);
  }

  const filteredPatients = state.patients.map(p => {
    if (periodMonths === 'all') return p;
    const records = p.records.filter(r => new Date(r.visitDate) >= cutoffDate);
    return { ...p, records };
  }).filter(p => periodMonths === 'all' || p.records.length > 0 || new Date(p.registrationDate) >= cutoffDate);

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'json') {
    const backupObj = {
      exportDate: new Date().toISOString(),
      period: periodMonths === 'all' ? 'All time' : `Last ${periodMonths} Months`,
      doctor: state.doctor,
      clinic: state.clinic,
      patients: filteredPatients,
      appointments: state.appointments,
      dailyNotes: state.dailyNotes,
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MediHive_Backup_${periodMonths}_months_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  // Export as Excel
  const wb = XLSX.utils.book_new();

  // 1. Patients sheet
  const patientsData = filteredPatients.map(p => ({
    'Patient ID': p.id,
    'Full Name': p.fullName,
    'Age': p.age,
    'Gender': p.gender,
    'Mobile': p.mobile,
    'Blood Group': p.bloodGroup || 'N/A',
    'Registration Date': p.registrationDate,
    'Last Visit Date': p.lastVisitDate,
    'Total Visits': p.totalVisits,
    'Address': p.address || 'N/A',
  }));
  const wsPatients = XLSX.utils.json_to_sheet(patientsData);
  XLSX.utils.book_append_sheet(wb, wsPatients, 'Patients');

  // 2. OPD Visits & Prescriptions sheet
  const visitsData: any[] = [];
  filteredPatients.forEach(p => {
    p.records.forEach(r => {
      visitsData.push({
        'OPD ID': r.id,
        'Patient ID': p.id,
        'Patient Name': p.fullName,
        'Visit Date': r.visitDate,
        'OPD Type': r.opdType,
        'Charge Type': r.chargeType,
        'Diagnosis': r.diagnosis,
        'Symptoms': r.symptoms.join(', '),
        'Medicines Prescribed': r.medicines.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join(' | '),
        'Panchakarma / Notes': r.panchakarmaNotes || r.clinicalNotes || '',
        'Next Visit Reminder': r.nextVisitDate || '',
        'Consultation Fee (₹)': r.consultationFee,
        'Medicine Fee (₹)': r.medicineFee,
        'Panchakarma Fee (₹)': r.panchakarmaFee,
        'Discount (₹)': r.discountValue,
        'Total Fee (₹)': r.totalFee,
        'Payment Mode': r.paymentMode,
      });
    });
  });
  const wsVisits = XLSX.utils.json_to_sheet(visitsData);
  XLSX.utils.book_append_sheet(wb, wsVisits, 'OPD_Visits');

  // 3. Appointments sheet
  const appointmentsData = state.appointments.map(a => ({
    'Appointment ID': a.id,
    'Patient ID': a.patientId,
    'Patient Name': a.patientName,
    'Mobile': a.patientMobile,
    'Date': a.date,
    'Time': a.time,
    'Reason': a.reason,
    'Type': a.type,
    'Status': a.status,
  }));
  const wsAppointments = XLSX.utils.json_to_sheet(appointmentsData);
  XLSX.utils.book_append_sheet(wb, wsAppointments, 'Appointments');

  // Download
  XLSX.writeFile(wb, `MediHive_Clinic_Records_${timestamp}.xlsx`);
};

