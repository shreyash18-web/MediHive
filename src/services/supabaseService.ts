import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  AppState, 
  Patient, 
  OPDRecord, 
  PatientVisit, 
  QueueItem, 
  Appointment, 
  DoctorProfile, 
  ClinicSettings, 
  EmailConfig, 
  UserAccount,
  QueueStatus
} from '../types';
import { 
  initialDoctor, 
  initialClinic, 
  initialEmailConfig 
} from './mockData';
import { defaultAccounts } from './storage';

// ==============================================================================
// TYPE CONVERTERS / MAPPERS (Database snake_case <-> Frontend camelCase)
// ==============================================================================

export const mapPatientFromDb = (row: any, records: OPDRecord[] = []): Patient => ({
  id: row.id,
  fullName: row.full_name,
  dob: row.dob || undefined,
  age: Number(row.age) || 0,
  gender: row.gender,
  mobile: row.mobile,
  address: row.address || undefined,
  bloodGroup: row.blood_group || undefined,
  weight: row.weight || undefined,
  height: row.height || undefined,
  emergencyContact: row.emergency_contact || undefined,
  allergies: row.allergies || undefined,
  medicalHistory: row.medical_history || undefined,
  registrationDate: row.registration_date,
  lastVisitDate: row.last_visit_date,
  totalVisits: Number(row.total_visits) || records.length,
  records: records,
  notes: row.notes || undefined,
  createdAt: row.created_at || undefined,
});

export const mapPatientToDb = (p: Patient) => ({
  id: p.id,
  full_name: p.fullName,
  dob: p.dob || null,
  age: p.age,
  gender: p.gender,
  mobile: p.mobile,
  address: p.address || null,
  blood_group: p.bloodGroup || null,
  weight: p.weight || null,
  height: p.height || null,
  emergency_contact: p.emergencyContact || null,
  allergies: p.allergies || null,
  medical_history: p.medicalHistory || null,
  registration_date: p.registrationDate,
  last_visit_date: p.lastVisitDate,
  total_visits: p.totalVisits || (p.records ? p.records.length : 0),
  notes: p.notes || null,
  updated_at: new Date().toISOString(),
});

export const mapOpdRecordFromDb = (row: any): OPDRecord => ({
  id: row.id,
  patientId: row.patient_id,
  visitDate: row.visit_date,
  opdType: row.opd_type || undefined,
  chargeType: row.charge_type || undefined,
  diagnosis: row.diagnosis,
  symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
  complaint: row.complaint || undefined,
  vitals: row.vitals || undefined,
  uploadedImages: Array.isArray(row.uploaded_images) ? row.uploaded_images : [],
  medicines: Array.isArray(row.medicines) ? row.medicines : [],
  panchakarmaNotes: row.panchakarma_notes || undefined,
  clinicalNotes: row.clinical_notes || undefined,
  dietaryAdvice: row.dietary_advice || undefined,
  nextVisitDate: row.next_visit_date || undefined,
  tests: row.tests || undefined,
  consultationFee: row.consultation_fee != null ? Number(row.consultation_fee) : 0,
  medicineFee: row.medicine_fee != null ? Number(row.medicine_fee) : 0,
  panchakarmaFee: row.panchakarma_fee != null ? Number(row.panchakarma_fee) : 0,
  discountType: row.discount_type || undefined,
  discountValue: row.discount_value != null ? Number(row.discount_value) : 0,
  totalFee: Number(row.total_fee) || 0,
  paymentMode: row.payment_mode || 'Cash',
  paymentStatus: row.payment_status || 'Paid',
  createdAt: row.created_at || new Date().toISOString(),
});

export const mapOpdRecordToDb = (r: OPDRecord) => ({
  id: r.id,
  patient_id: r.patientId,
  visit_date: r.visitDate,
  opd_type: r.opdType || null,
  charge_type: r.chargeType || null,
  diagnosis: r.diagnosis,
  symptoms: r.symptoms || [],
  complaint: r.complaint || null,
  vitals: r.vitals || {},
  uploaded_images: r.uploadedImages || [],
  medicines: r.medicines || [],
  panchakarma_notes: r.panchakarmaNotes || null,
  clinical_notes: r.clinicalNotes || null,
  dietary_advice: r.dietaryAdvice || null,
  next_visit_date: r.nextVisitDate || null,
  tests: r.tests || null,
  consultation_fee: r.consultationFee || 0,
  medicine_fee: r.medicineFee || 0,
  panchakarma_fee: r.panchakarmaFee || 0,
  discount_type: r.discountType || null,
  discount_value: r.discountValue || 0,
  total_fee: r.totalFee || 0,
  payment_mode: r.paymentMode || 'Cash',
  payment_status: r.paymentStatus || 'Paid',
  created_at: r.createdAt || new Date().toISOString(),
});

export const mapVisitFromDb = (row: any): PatientVisit => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.patient_name,
  patientAge: Number(row.patient_age) || 0,
  patientGender: row.patient_gender,
  patientMobile: row.patient_mobile,
  visitDate: row.visit_date,
  visitTime: row.visit_time,
  complaint: row.complaint,
  symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
  symptomDuration: row.symptom_duration || undefined,
  vitals: row.vitals || {},
  receptionistId: row.receptionist_id || undefined,
  receptionistName: row.receptionist_name || undefined,
  queueId: row.queue_id || undefined,
  queueNumber: row.queue_number || undefined,
  status: row.status as QueueStatus,
  createdAt: row.created_at || new Date().toISOString(),
});

export const mapVisitToDb = (v: PatientVisit) => ({
  id: v.id,
  patient_id: v.patientId,
  patient_name: v.patientName,
  patient_age: v.patientAge,
  patient_gender: v.patientGender,
  patient_mobile: v.patientMobile,
  visit_date: v.visitDate,
  visit_time: v.visitTime,
  complaint: v.complaint,
  symptoms: v.symptoms || [],
  symptom_duration: v.symptomDuration || null,
  vitals: v.vitals || {},
  receptionist_id: v.receptionistId || null,
  receptionist_name: v.receptionistName || null,
  queue_id: v.queueId || null,
  queue_number: v.queueNumber || null,
  status: v.status,
  created_at: v.createdAt || new Date().toISOString(),
});

export const mapQueueItemFromDb = (row: any): QueueItem => ({
  id: row.id,
  queueNumber: row.queue_number,
  sequenceNumber: Number(row.sequence_number) || 0,
  visitId: row.visit_id,
  patientId: row.patient_id,
  patientName: row.patient_name,
  patientAge: Number(row.patient_age) || 0,
  patientGender: row.patient_gender,
  patientMobile: row.patient_mobile,
  complaint: row.complaint,
  symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
  symptomDuration: row.symptom_duration || undefined,
  vitals: row.vitals || {},
  arrivalTime: row.arrival_time,
  visitDate: row.visit_date,
  status: row.status as QueueStatus,
  doctorId: row.doctor_id || undefined,
  calledAt: row.called_at || undefined,
  completedAt: row.completed_at || undefined,
});

export const mapQueueItemToDb = (q: QueueItem) => ({
  id: q.id,
  queue_number: q.queueNumber,
  sequence_number: q.sequenceNumber,
  visit_id: q.visitId || null,
  patient_id: q.patientId,
  patient_name: q.patientName,
  patient_age: q.patientAge,
  patient_gender: q.patientGender,
  patient_mobile: q.patientMobile,
  complaint: q.complaint,
  symptoms: q.symptoms || [],
  symptom_duration: q.symptomDuration || null,
  vitals: q.vitals || {},
  arrival_time: q.arrivalTime,
  visit_date: q.visitDate,
  status: q.status,
  doctor_id: q.doctorId || null,
  called_at: q.calledAt || null,
  completed_at: q.completedAt || null,
  created_at: new Date().toISOString(),
});

export const mapAppointmentFromDb = (row: any): Appointment => ({
  id: row.id,
  patientId: row.patient_id || '',
  patientName: row.patient_name,
  patientMobile: row.patient_mobile,
  date: row.date,
  time: row.time,
  reason: row.reason,
  type: row.type || 'Appointment',
  status: row.status || 'Scheduled',
  notes: row.notes || undefined,
});

export const mapAppointmentToDb = (a: Appointment) => ({
  id: a.id,
  patient_id: a.patientId || null,
  patient_name: a.patientName,
  patient_mobile: a.patientMobile,
  date: a.date,
  time: a.time,
  reason: a.reason,
  type: a.type,
  status: a.status,
  notes: a.notes || null,
  created_at: new Date().toISOString(),
});

// ==============================================================================
// FULL APPLICATION STATE: READ / FETCH (Supabase -> Frontend)
// ==============================================================================

export const fetchFullAppStateFromSupabase = async (): Promise<Partial<AppState> | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const [
      patientsRes,
      opdRes,
      visitsRes,
      queueRes,
      aptsRes,
      notesRes,
      docRes,
      clinicRes,
      emailRes,
    ] = await Promise.all([
      supabase.from('patients').select('*').order('created_at', { ascending: false }),
      supabase.from('opd_records').select('*').order('visit_date', { ascending: false }),
      supabase.from('patient_visits').select('*').order('created_at', { ascending: false }),
      supabase.from('queue_items').select('*').order('sequence_number', { ascending: true }),
      supabase.from('appointments').select('*').order('date', { ascending: true }),
      supabase.from('daily_notes').select('*'),
      supabase.from('doctor_profile').select('*').eq('id', 1).maybeSingle(),
      supabase.from('clinic_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('email_config').select('*').eq('id', 1).maybeSingle(),
    ]);

    // Handle any table errors gracefully
    if (patientsRes.error) {
      console.warn('Supabase fetch patients notice:', patientsRes.error.message);
      return null;
    }

    // Group OPD records by patient_id
    const opdRecordsByPatient: Record<string, OPDRecord[]> = {};
    if (opdRes.data) {
      opdRes.data.forEach((row: any) => {
        const record = mapOpdRecordFromDb(row);
        if (!opdRecordsByPatient[record.patientId]) {
          opdRecordsByPatient[record.patientId] = [];
        }
        opdRecordsByPatient[record.patientId].push(record);
      });
    }

    // Map patients with nested records
    const patients: Patient[] = (patientsRes.data || []).map((row: any) =>
      mapPatientFromDb(row, opdRecordsByPatient[row.id] || [])
    );

    const visits: PatientVisit[] = (visitsRes.data || []).map(mapVisitFromDb);
    const queue: QueueItem[] = (queueRes.data || []).map(mapQueueItemFromDb);
    const appointments: Appointment[] = (aptsRes.data || []).map(mapAppointmentFromDb);

    // Map daily notes
    const dailyNotes: Record<string, string> = {};
    if (notesRes.data) {
      notesRes.data.forEach((row: any) => {
        dailyNotes[row.date] = row.note;
      });
    }

    // Map Doctor Profile
    let doctor = initialDoctor;
    if (docRes.data) {
      doctor = {
        name: docRes.data.name || initialDoctor.name,
        qualifications: docRes.data.qualifications || initialDoctor.qualifications,
        specialisation: docRes.data.specialisation || initialDoctor.specialisation,
        medicalLicenseNo: docRes.data.medical_license_no || initialDoctor.medicalLicenseNo,
        email: docRes.data.email || initialDoctor.email,
        contact: docRes.data.contact || initialDoctor.contact,
        photoUrl: docRes.data.photo_url || '',
        consultationFee: docRes.data.consultation_fee != null ? Number(docRes.data.consultation_fee) : 500,
      };
    }

    // Map Clinic Settings
    let clinic = initialClinic;
    if (clinicRes.data) {
      clinic = {
        name: clinicRes.data.name || initialClinic.name,
        address: clinicRes.data.address || initialClinic.address,
        phone: clinicRes.data.phone || initialClinic.phone,
        email: clinicRes.data.email || initialClinic.email,
        website: clinicRes.data.website || initialClinic.website,
        operatingHours: clinicRes.data.operating_hours || initialClinic.operatingHours,
        logoUrl: clinicRes.data.logo_url || '',
        currency: clinicRes.data.currency || '₹',
        taxNumber: clinicRes.data.tax_number || undefined,
      };
    }

    // Map Email Config
    let emailConfig = initialEmailConfig;
    if (emailRes.data) {
      emailConfig = {
        smtpEmail: emailRes.data.smtp_email || initialEmailConfig.smtpEmail,
        smtpAppPassword: emailRes.data.smtp_app_password || initialEmailConfig.smtpAppPassword,
        smtpServer: emailRes.data.smtp_server || initialEmailConfig.smtpServer,
        smtpPort: emailRes.data.smtp_port != null ? Number(emailRes.data.smtp_port) : 587,
        enableNotifications: emailRes.data.enable_notifications ?? true,
      };
    }

    return {
      doctor,
      clinic,
      emailConfig,
      patients,
      visits,
      queue,
      appointments,
      dailyNotes,
    };
  } catch (err) {
    console.warn('Failed to load application state from Supabase:', err);
    return null;
  }
};

// ==============================================================================
// PATIENTS CRUD OPERATIONS
// ==============================================================================

export const createPatientInSupabase = async (patient: Patient): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const payload = mapPatientToDb(patient);
    const { error } = await supabase.from('patients').insert(payload);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase createPatient error:', err);
    return false;
  }
};

export const updatePatientInSupabase = async (patient: Patient): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const payload = mapPatientToDb(patient);
    const { error } = await supabase
      .from('patients')
      .update(payload)
      .eq('id', patient.id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase updatePatient error:', err);
    return false;
  }
};

export const deletePatientInSupabase = async (patientId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('patients').delete().eq('id', patientId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase deletePatient error:', err);
    return false;
  }
};

// ==============================================================================
// OPD RECORDS & CONSULTATIONS (CREATE / INSERT)
// ==============================================================================

export const saveOpdRecordInSupabase = async (
  patient: Patient,
  opdRecord: OPDRecord
): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    // 1. Ensure patient exists in Supabase (upsert) to satisfy FK constraint on opd_records.patient_id
    const patientPayload = mapPatientToDb(patient);
    const { error: patErr } = await supabase
      .from('patients')
      .upsert(patientPayload);
    if (patErr) throw patErr;

    // 2. Insert or update OPD Record
    const recordPayload = mapOpdRecordToDb(opdRecord);
    const { error: opdErr } = await supabase.from('opd_records').upsert(recordPayload);
    if (opdErr) throw opdErr;

    return true;
  } catch (err) {
    console.error('Supabase saveOpdRecord error:', err);
    return false;
  }
};

// ==============================================================================
// VISITS & LIVE QUEUE CRUD OPERATIONS
// ==============================================================================

export const insertVisitAndQueueInSupabase = async (
  visit: PatientVisit,
  queueItem: QueueItem
): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const visitPayload = mapVisitToDb(visit);
    const queuePayload = mapQueueItemToDb(queueItem);

    // 1. Insert patient visit first (queue_items references patient_visits.id)
    const { error: visitErr } = await supabase.from('patient_visits').upsert(visitPayload);
    if (visitErr) throw visitErr;

    // 2. Insert queue item
    const { error: queueErr } = await supabase.from('queue_items').upsert(queuePayload);
    if (queueErr) throw queueErr;

    return true;
  } catch (err) {
    console.error('Supabase insertVisitAndQueue error:', err);
    return false;
  }
};

export const updateQueueItemStatusInSupabase = async (
  queueId: string,
  status: QueueStatus,
  extras?: {
    doctorId?: string;
    calledAt?: string;
    completedAt?: string;
  }
): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const updatePayload: any = {
      status,
    };
    if (extras?.doctorId) updatePayload.doctor_id = extras.doctorId;
    if (extras?.calledAt) updatePayload.called_at = extras.calledAt;
    if (extras?.completedAt) updatePayload.completed_at = extras.completedAt;

    const [qRes, vRes] = await Promise.all([
      supabase.from('queue_items').update(updatePayload).eq('id', queueId),
      supabase.from('patient_visits').update({ status }).eq('queue_id', queueId),
    ]);

    if (qRes.error) throw qRes.error;
    if (vRes.error) throw vRes.error;

    return true;
  } catch (err) {
    console.error('Supabase updateQueueItemStatus error:', err);
    return false;
  }
};

export const cancelQueueTicketInSupabase = async (queueId: string): Promise<boolean> => {
  return updateQueueItemStatusInSupabase(queueId, 'Cancelled');
};

// ==============================================================================
// APPOINTMENTS CRUD OPERATIONS
// ==============================================================================

export const saveAppointmentInSupabase = async (appointment: Appointment): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const payload = mapAppointmentToDb(appointment);
    const { error } = await supabase.from('appointments').upsert(payload);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase saveAppointment error:', err);
    return false;
  }
};

export const deleteAppointmentInSupabase = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase deleteAppointment error:', err);
    return false;
  }
};

// ==============================================================================
// CALENDAR DAILY NOTES CRUD
// ==============================================================================

export const deleteOpdRecordInSupabase = async (
  recordId: string,
  patientId: string
): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('opd_records').delete().eq('id', recordId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase deleteOpdRecord error:', err);
    return false;
  }
};

export const deleteQueueItemInSupabase = async (queueId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('queue_items').delete().eq('id', queueId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase deleteQueueItem error:', err);
    return false;
  }
};

export const clearCompletedQueueInSupabase = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('queue_items')
      .delete()
      .in('status', ['Completed', 'Cancelled']);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase clearCompletedQueue error:', err);
    return false;
  }
};

export const saveDailyNoteInSupabase = async (date: string, note: string): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('daily_notes').upsert({
      date,
      note,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase saveDailyNote error:', err);
    return false;
  }
};

export const deleteDailyNoteInSupabase = async (date: string): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('daily_notes').delete().eq('date', date);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase deleteDailyNote error:', err);
    return false;
  }
};

export const clearAllClinicDataFromSupabase = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    // Delete transactional items in order
    await supabase.from('queue_items').delete().neq('id', '');
    await supabase.from('patient_visits').delete().neq('id', '');
    await supabase.from('opd_records').delete().neq('id', '');
    await supabase.from('appointments').delete().neq('id', '');
    await supabase.from('daily_notes').delete().neq('date', '1970-01-01');
    const { error } = await supabase.from('patients').delete().neq('id', '');
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase clearAllClinicData error:', err);
    return false;
  }
};

// ==============================================================================
// CLINIC & DOCTOR SETTINGS CRUD
// ==============================================================================

export const updateDoctorProfileInSupabase = async (doctor: DoctorProfile): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('doctor_profile').upsert({
      id: 1,
      name: doctor.name,
      qualifications: doctor.qualifications,
      specialisation: doctor.specialisation,
      medical_license_no: doctor.medicalLicenseNo,
      email: doctor.email,
      contact: doctor.contact,
      photo_url: doctor.photoUrl || null,
      consultation_fee: doctor.consultationFee || 500,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase updateDoctorProfile error:', err);
    return false;
  }
};

export const updateClinicSettingsInSupabase = async (clinic: ClinicSettings): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('clinic_settings').upsert({
      id: 1,
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email,
      website: clinic.website || null,
      operating_hours: clinic.operatingHours,
      logo_url: clinic.logoUrl || null,
      currency: clinic.currency || '₹',
      tax_number: clinic.taxNumber || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase updateClinicSettings error:', err);
    return false;
  }
};

export const updateEmailConfigInSupabase = async (config: EmailConfig): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('email_config').upsert({
      id: 1,
      smtp_email: config.smtpEmail,
      smtp_app_password: config.smtpAppPassword,
      smtp_server: config.smtpServer || 'smtp.gmail.com',
      smtp_port: config.smtpPort || 587,
      enable_notifications: config.enableNotifications,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase updateEmailConfig error:', err);
    return false;
  }
};

// ==============================================================================
// USER ACCOUNTS & AUTHENTICATION CRUD
// ==============================================================================

export const fetchUserAccountsFromSupabase = async (): Promise<UserAccount[]> => {
  if (!isSupabaseConfigured) return defaultAccounts;
  try {
    const { data, error } = await supabase.from('user_accounts').select('*');
    if (error || !data || data.length === 0) {
      return defaultAccounts;
    }
    return data.map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      passwordHash: u.password_hash,
    }));
  } catch (err) {
    console.warn('Supabase fetchUserAccounts fallback to default:', err);
    return defaultAccounts;
  }
};

export const updateUserPasswordInSupabase = async (
  username: string,
  newPassword: string
): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('user_accounts')
      .update({ password_hash: newPassword.trim() })
      .eq('username', username.trim().toLowerCase());
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Supabase updateUserPassword error:', err);
    return false;
  }
};

// ==============================================================================
// SUPABASE REALTIME SUBSCRIPTIONS (Doctor & Receptionist multi-screen sync)
// ==============================================================================

export const subscribeToClinicRealtime = (onSync: () => void): (() => void) => {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('medihive_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_items' },
        () => onSync()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_visits' },
        () => onSync()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => onSync()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => onSync()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Supabase Realtime subscription error:', err);
    return () => {};
  }
};
