import React, { useState } from 'react';
import { 
  X, 
  Stethoscope, 
  User, 
  Activity, 
  Thermometer, 
  HeartPulse, 
  Scale, 
  Clock, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  History, 
  AlertCircle,
  Pill,
  Printer,
  Sparkles
} from 'lucide-react';
import { 
  Patient, 
  QueueItem, 
  OPDRecord, 
  PrescriptionItem, 
  DoctorProfile, 
  ClinicSettings 
} from '../../types';
import { generateNextOpdId } from '../../services/storage';
import { useToast } from '../common/Toast';

interface DoctorConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueItem: QueueItem;
  patient: Patient;
  doctor: DoctorProfile;
  clinic: ClinicSettings;
  existingPatients: Patient[];
  onCompleteConsultation: (opdRecord: OPDRecord, autoCallNext: boolean) => void;
  onViewHistory: (patient: Patient) => void;
  onPreviewPrescription?: (patient: Patient, record: OPDRecord) => void;
}

const COMMON_DIAGNOSES = [
  'Acute Viral Upper Respiratory Infection',
  'Acute Bronchitis',
  'Gastroenteritis / Dysentery',
  'Hypertension (Essential)',
  'Type 2 Diabetes Mellitus',
  'Tension Headache / Migraine',
  'Allergic Rhinitis',
  'Urinary Tract Infection (UTI)',
  'Acid Peptic Disease / GERD',
  'Musculoskeletal Back Pain',
];

const COMMON_DOSAGES = ['500mg', '250mg', '650mg', '100mg', '10mg', '5mg', '40mg'];
const COMMON_FREQUENCIES = ['1-0-1 (Twice daily)', '1-1-1 (Thrice daily)', '1-0-0 (Once daily morning)', '0-0-1 (Once daily bedtime)', 'SOS (As needed)'];
const COMMON_DURATIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '1 Month'];

export const DoctorConsultationModal: React.FC<DoctorConsultationModalProps> = ({
  isOpen,
  onClose,
  queueItem,
  patient,
  doctor,
  clinic,
  existingPatients,
  onCompleteConsultation,
  onViewHistory,
  onPreviewPrescription,
}) => {
  const { showToast } = useToast();

  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [tests, setTests] = useState('');
  const [followUpDays, setFollowUpDays] = useState('5');
  const [consultationFee, setConsultationFee] = useState<number>(doctor.consultationFee || 500);

  // Prescription medicines
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([
    {
      id: 'med-1',
      name: '',
      dosage: '500mg',
      frequency: '1-0-1 (Twice daily)',
      duration: '5 Days',
      instruction: 'After meals',
    },
  ]);

  if (!isOpen) return null;

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        name: '',
        dosage: '500mg',
        frequency: '1-0-1 (Twice daily)',
        duration: '5 Days',
        instruction: 'After meals',
      },
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: keyof PrescriptionItem, value: string) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateNextVisitDate = (days: string): string => {
    const d = parseInt(days, 10);
    if (isNaN(d) || d <= 0) return '';
    const target = new Date();
    target.setDate(target.getDate() + d);
    return target.toISOString().slice(0, 10);
  };

  const buildOpdRecord = (): OPDRecord => {
    const opdId = generateNextOpdId(existingPatients);
    const today = new Date().toISOString().slice(0, 10);
    const validMedicines = medicines.filter((m) => m.name.trim().length > 0);

    return {
      id: opdId,
      patientId: patient.id,
      visitDate: today,
      complaint: queueItem.complaint || 'Consultation',
      symptoms: queueItem.symptoms || [],
      vitals: queueItem.vitals || {},
      diagnosis: diagnosis.trim() || 'General Consultation',
      clinicalNotes: clinicalNotes.trim(),
      prescriptions: validMedicines,
      tests: tests.trim(),
      totalFee: Number(consultationFee) || 0,
      nextVisitDate: calculateNextVisitDate(followUpDays),
      createdAt: new Date().toISOString(),
    };
  };

  const handleComplete = (autoCallNext: boolean) => {
    if (!diagnosis.trim()) {
      showToast('Please enter a clinical diagnosis before completing', 'error');
      return;
    }

    const record = buildOpdRecord();
    onCompleteConsultation(record, autoCallNext);
    showToast(
      autoCallNext
        ? 'Consultation saved! Next patient called to cabin.'
        : 'Consultation completed successfully.',
      'success'
    );
    onClose();
  };

  const handlePreview = () => {
    if (!diagnosis.trim()) {
      showToast('Please specify a diagnosis to preview prescription', 'error');
      return;
    }
    const record = buildOpdRecord();
    if (onPreviewPrescription) {
      onPreviewPrescription(patient, record);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#194358] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 text-xs font-bold font-mono">
                  {queueItem.queueNumber}
                </span>
                <h2 className="text-lg font-bold text-white">Active Patient Consultation</h2>
              </div>
              <p className="text-xs text-sky-200/90">
                Patient: <span className="font-semibold text-white">{patient.fullName}</span> ({patient.age}y, {patient.gender}) • ID: {patient.id} • Tel: {patient.mobile}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewHistory(patient)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition flex items-center gap-1.5 border border-white/15"
            >
              <History className="w-3.5 h-3.5" />
              <span>Past History ({patient.records ? patient.records.length : 0})</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Triage Info Banner from Receptionist */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-sky-200/60">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-900">
                <Activity className="w-4 h-4 text-sky-600" />
                <span>Receptionist Triage & Vital Signs</span>
              </div>
              <span className="text-[11px] text-sky-700">
                Checked in at {queueItem.arrivalTime || 'Today'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold">Chief Complaint:</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {queueItem.complaint || 'General Checkup'}
                </p>
                {queueItem.symptoms && queueItem.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {queueItem.symptoms.map((sym) => (
                      <span
                        key={sym}
                        className="px-2 py-0.5 rounded-md bg-white border border-sky-200 text-sky-900 text-xs font-medium shadow-2xs"
                      >
                        {sym}
                      </span>
                    ))}
                    {queueItem.symptomDuration && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                        Duration: {queueItem.symptomDuration}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold mb-1.5">Recorded Vitals:</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">BP</span>
                    <span className="text-xs font-bold text-slate-800">{queueItem.vitals?.bp || '—'}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">TEMP</span>
                    <span className="text-xs font-bold text-slate-800">
                      {queueItem.vitals?.temp ? `${queueItem.vitals.temp}°F` : '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">PULSE</span>
                    <span className="text-xs font-bold text-slate-800">
                      {queueItem.vitals?.pulse ? `${queueItem.vitals.pulse} bpm` : '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">SPO2</span>
                    <span className="text-xs font-bold text-slate-800">
                      {queueItem.vitals?.spo2 ? `${queueItem.vitals.spo2}%` : '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-sky-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">WEIGHT</span>
                    <span className="text-xs font-bold text-slate-800">
                      {queueItem.vitals?.weight ? `${queueItem.vitals.weight} kg` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allergies / Medical History Alert if any */}
            {(patient.allergies || patient.medicalHistory) && (
              <div className="mt-3 pt-2.5 border-t border-sky-200/60 flex flex-wrap gap-4 text-xs">
                {patient.allergies && (
                  <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    ⚠️ Allergies: {patient.allergies}
                  </span>
                )}
                {patient.medicalHistory && (
                  <span className="text-slate-700 font-medium bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Past History: {patient.medicalHistory}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Clinical Diagnosis Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Clinical Diagnosis</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute Viral Bronchitis, Type 2 Diabetes"
              className="w-full px-3.5 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#194358] focus:bg-white transition"
            />
            {/* Diagnosis Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_DIAGNOSES.slice(0, 6).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDiagnosis(item)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor's Clinical Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Clinical Findings & Advice Notes
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter patient observations, chest auscultation, dietary instructions, precautions..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#194358] focus:bg-white transition"
            />
          </div>

          {/* Prescriptions (Rx) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#194358]" />
                <span>Prescription (Rx)</span>
              </label>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="px-3 py-1.5 text-xs font-semibold text-[#194358] hover:bg-sky-50 border border-sky-200 rounded-lg transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {medicines.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                >
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Paracetamol)"
                      value={med.name}
                      onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#194358]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage (500mg)"
                      value={med.dosage}
                      onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#194358]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={med.frequency}
                      onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#194358]"
                    >
                      {COMMON_FREQUENCIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <select
                      value={med.duration}
                      onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#194358]"
                    >
                      {COMMON_DURATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="After meals"
                      value={med.instruction || ''}
                      onChange={(e) => handleUpdateMedicine(idx, 'instruction', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#194358]"
                    />
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tests, Follow-up & Fee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Lab Investigations
              </label>
              <input
                type="text"
                value={tests}
                onChange={(e) => setTests(e.target.value)}
                placeholder="e.g. CBC, Lipid Profile, Chest X-Ray"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#194358] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Follow-up In (Days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(e.target.value)}
                  className="w-24 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#194358] focus:bg-white"
                />
                <span className="text-xs text-slate-500">
                  {followUpDays && parseInt(followUpDays, 10) > 0
                    ? `(${calculateNextVisitDate(followUpDays)})`
                    : 'No follow up'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#194358] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreview}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Preview Prescription</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleComplete(false)}
              className="px-4 py-2 text-xs font-semibold text-[#194358] bg-sky-100 hover:bg-sky-200 rounded-xl transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Consultation</span>
            </button>

            <button
              type="button"
              onClick={() => handleComplete(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>Complete & Call Next Patient</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
