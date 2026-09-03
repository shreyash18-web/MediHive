export type Gender = 'Male' | 'Female' | 'Other';
export type OpdType = 'Consultation' | 'Follow-up' | 'Emergency' | 'Routine Checkup' | 'Therapy';
export type ChargeType = 'First Visit' | 'Follow-up' | 'Special Therapy' | 'Emergency Consultation';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Net Banking';
export type DiscountType = 'amount' | 'percentage';

export interface PrescribedMedicine {
  id: string;
  name: string;
  dosage: string; // e.g., '1 tab', '2 tsp', '10 ml'
  frequency: string; // e.g., '1-0-1', 'Once daily', 'Twice daily after food', 'Morning & Night'
  timing: string; // 'Before Food' | 'After Food' | 'Empty Stomach' | 'With Warm Water'
  duration: string; // e.g., '5 Days', '15 Days', '1 Month'
  instructions?: string;
}

export interface OPDRecord {
  id: string;
  patientId: string;
  visitDate: string; // YYYY-MM-DD
  opdType: OpdType;
  chargeType: ChargeType;
  diagnosis: string;
  symptoms: string[];
  uploadedImages?: string[]; // base64 or object URLs for skin treatment / clinical photos
  medicines: PrescribedMedicine[];
  panchakarmaNotes?: string;
  clinicalNotes?: string;
  dietaryAdvice?: string;
  nextVisitDate?: string; // YYYY-MM-DD
  
  // Billing details
  consultationFee: number;
  medicineFee: number;
  panchakarmaFee: number;
  discountType: DiscountType;
  discountValue: number;
  totalFee: number;
  paymentMode: PaymentMode;
  paymentStatus: 'Paid' | 'Pending';
  
  createdAt: string;
}

export interface Patient {
  id: string; // e.g., 'P0001'
  fullName: string;
  dob?: string; // YYYY-MM-DD
  age: number;
  gender: Gender;
  mobile: string;
  address?: string;
  bloodGroup?: string;
  registrationDate: string; // YYYY-MM-DD
  lastVisitDate: string; // YYYY-MM-DD
  totalVisits: number;
  records: OPDRecord[];
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  reason: string;
  type: 'Appointment' | 'Follow-up Reminder';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
}

export interface CalendarDailyNote {
  date: string; // YYYY-MM-DD
  note: string;
  updatedAt: string;
}

export interface DoctorProfile {
  name: string;
  qualifications: string;
  specialisation: string;
  medicalLicenseNo: string;
  email: string;
  contact: string;
  photoUrl?: string;
}

export interface ClinicSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  operatingHours: string;
  logoUrl?: string;
  currency: string;
  taxNumber?: string;
}

export interface EmailConfig {
  smtpEmail: string;
  smtpAppPassword: string;
  smtpServer: string;
  smtpPort: number;
  enableNotifications: boolean;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: 'doctor' | 'receptionist' | 'admin';
  passwordHash: string;
}

export interface AppState {
  currentUser: UserAccount | null;
  doctor: DoctorProfile;
  clinic: ClinicSettings;
  emailConfig: EmailConfig;
  patients: Patient[];
  appointments: Appointment[];
  dailyNotes: Record<string, string>; // YYYY-MM-DD -> note
}

