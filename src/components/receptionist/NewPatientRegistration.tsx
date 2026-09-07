import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Check, User, Phone, MapPin, Calendar, HeartPulse, AlertCircle } from 'lucide-react';
import { Patient, Gender } from '../../types';
import { generateNextPatientId } from '../../services/storage';
import { differenceInYears, parseISO } from 'date-fns';
import { useToast } from '../common/Toast';

interface NewPatientRegistrationProps {
  existingPatients: Patient[];
  onBack: () => void;
  onPatientRegistered: (newPatient: Patient) => void;
}

export const NewPatientRegistration: React.FC<NewPatientRegistrationProps> = ({
  existingPatients,
  onBack,
  onPatientRegistered,
}) => {
  const { showToast } = useToast();

  const [patientId] = useState(() => generateNextPatientId(existingPatients));
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Handle DOB change -> auto compute age
  const handleDobChange = (val: string) => {
    setDob(val);
    if (val) {
      try {
        const calculatedAge = differenceInYears(new Date(), parseISO(val));
        if (calculatedAge >= 0 && calculatedAge < 130) {
          setAge(calculatedAge);
        }
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      showToast('Please enter patient full name.', 'error');
      return;
    }
    if (!mobile.trim()) {
      showToast('Please enter mobile number.', 'error');
      return;
    }

    // Check duplicate mobile
    const duplicate = existingPatients.find(
      (p) => p.mobile.replace(/\D/g, '') === mobile.replace(/\D/g, '') && mobile.length >= 10
    );
    if (duplicate) {
      showToast(`Warning: A patient (${duplicate.fullName} - ${duplicate.id}) already exists with this mobile.`, 'info');
    }

    const today = new Date().toISOString().slice(0, 10);
    const newPatient: Patient = {
      id: patientId,
      fullName: fullName.trim(),
      dob: dob || undefined,
      age: Number(age) || 0,
      gender,
      mobile: mobile.trim(),
      address: address.trim() || undefined,
      bloodGroup: bloodGroup || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      allergies: allergies.trim() || undefined,
      medicalHistory: medicalHistory.trim() || undefined,
      registrationDate: today,
      lastVisitDate: today,
      totalVisits: 0,
      records: [],
    };

    onPatientRegistered(newPatient);
    showToast(`Patient ${newPatient.fullName} (${newPatient.id}) registered successfully!`, 'success');
  };

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-6 page-fade-in">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">New Patient Registration</h1>
            <p className="text-xs text-slate-500">Register new patient and initiate consultation visit</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block font-medium">Assigned Patient ID</span>
          <span className="text-base font-extrabold text-[#1e536e] font-mono">{patientId}</span>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
        
        {/* Section 1: Demographics */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-[#1e536e] uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600" />
              <span>1. Patient Demographics</span>
            </h2>
            <span className="text-xs text-slate-400">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter patient full name"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => handleDobChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Age"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Residence</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, city or locality"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Medical Background & Emergency Contact */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-[#1e536e] uppercase tracking-wide flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>2. Medical Background & Emergency Details (Optional)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Number</label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. 9876543210 (Relative / Guardian)"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Known Drug / Food Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, Dust, Peanuts"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Previous Medical Conditions / Chronic Illnesses
            </label>
            <input
              type="text"
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              placeholder="e.g. Hypertension, Type-2 Diabetes, Thyroid, Asthma"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-6 bg-slate-50/70 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition text-center"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto justify-center bg-[#2ba4c7] hover:bg-[#228da8] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register & Start Visit</span>
          </button>
        </div>
      </form>
    </div>
  );
};
