import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  Upload, 
  Calendar, 
  Check, 
  Sparkles, 
  FileText, 
  IndianRupee,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { 
  Patient, 
  OPDRecord, 
  PrescribedMedicine, 
  OpdType, 
  ChargeType, 
  PaymentMode, 
  DiscountType, 
  Gender 
} from '../../types';
import { commonSymptomsList, medicineCatalog } from '../../services/mockData';
import { generateNextPatientId, generateNextOpdId } from '../../services/storage';
import { format, differenceInYears, parseISO } from 'date-fns';
import { useToast } from '../common/Toast';

interface OpdRegistrationProps {
  patients: Patient[];
  preselectedPatientId?: string;
  onBack: () => void;
  onSaveOpdRecord: (patient: Patient, opdRecord: OPDRecord) => void;
  onGeneratePrescription: (patient: Patient, opdRecord: OPDRecord) => void;
}

export const OpdRegistration: React.FC<OpdRegistrationProps> = ({
  patients,
  preselectedPatientId,
  onBack,
  onSaveOpdRecord,
  onGeneratePrescription,
}) => {
  const { showToast } = useToast();

  // Patient Lookup state
  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || '');
  const [patientSearchInput, setPatientSearchInput] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');

  // Clinical Fields
  const [opdType, setOpdType] = useState<OpdType>('Consultation');
  const [chargeType, setChargeType] = useState<ChargeType>('First Visit');
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [showSymptomSuggestions, setShowSymptomSuggestions] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Medicines List
  const [medicines, setMedicines] = useState<PrescribedMedicine[]>([
    {
      id: 'med-init-1',
      name: 'Maharasnadi yog',
      dosage: '2 tabs',
      frequency: 'Twice daily',
      timing: 'After Food',
      duration: '7 Days',
      instructions: 'With warm water',
    },
  ]);

  // Notes & Follow up
  const [panchakarmaNotes, setPanchakarmaNotes] = useState('therapy');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [dietaryAdvice, setDietaryAdvice] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState(
    format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );

  // Billing Fields
  const [consultationFee, setConsultationFee] = useState<number>(100);
  const [medicineFee, setMedicineFee] = useState<number>(100);
  const [panchakarmaFee, setPanchakarmaFee] = useState<number>(100);
  const [discountType, setDiscountType] = useState<DiscountType>('amount');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');

  // Load existing patient if selected
  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find((pat) => pat.id === selectedPatientId);
      if (p) {
        setFullName(p.fullName);
        setDob(p.dob || '');
        setAge(p.age);
        setGender(p.gender);
        setMobile(p.mobile);
        setAddress(p.address || '');
        setBloodGroup(p.bloodGroup || 'A+');
        setChargeType(p.records.length > 0 ? 'Follow-up' : 'First Visit');
        setOpdType(p.records.length > 0 ? 'Follow-up' : 'Consultation');
      }
    }
  }, [selectedPatientId, patients]);

  // Handle DOB change -> auto calculate age
  const handleDobChange = (val: string) => {
    setDob(val);
    if (val) {
      try {
        const calculatedAge = differenceInYears(new Date(), parseISO(val));
        if (calculatedAge >= 0) setAge(calculatedAge);
      } catch (e) {
        // ignore
      }
    }
  };

  // Filter symptom suggestions
  const filteredSymptoms = useMemo(() => {
    if (!symptomInput.trim()) return commonSymptomsList.slice(0, 8);
    const q = symptomInput.toLowerCase().trim();
    return commonSymptomsList.filter(
      (s) => s.toLowerCase().includes(q) && !symptoms.includes(s)
    );
  }, [symptomInput, symptoms]);

  const addSymptom = (sym: string) => {
    if (!symptoms.includes(sym)) {
      setSymptoms([...symptoms, sym]);
    }
    setSymptomInput('');
    setShowSymptomSuggestions(false);
  };

  const removeSymptom = (sym: string) => {
    setSymptoms(symptoms.filter((s) => s !== sym));
  };

  // Medicine helper: add new row
  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        id: `med-${Date.now()}`,
        name: '',
        dosage: '1 tab',
        frequency: 'Twice daily',
        timing: 'After Food',
        duration: '5 Days',
        instructions: 'With warm water',
      },
    ]);
  };

  const updateMedicine = (index: number, field: keyof PrescribedMedicine, val: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: val };
    
    // Auto populate defaults if user selects a known medicine
    if (field === 'name') {
      const match = medicineCatalog.find(
        (m) => m.name.toLowerCase() === val.toLowerCase()
      );
      if (match) {
        updated[index].dosage = match.defaultDosage;
        updated[index].frequency = match.defaultFrequency;
        updated[index].timing = match.defaultTiming;
        updated[index].instructions = match.instructions;
      }
    }
    setMedicines(updated);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  // Total calculation
  const calculatedTotal = useMemo(() => {
    const subtotal = (Number(consultationFee) || 0) + (Number(medicineFee) || 0) + (Number(panchakarmaFee) || 0);
    let disc = Number(discountValue) || 0;
    if (discountType === 'percentage') {
      disc = (subtotal * disc) / 100;
    }
    return Math.max(0, Math.round(subtotal - disc));
  }, [consultationFee, medicineFee, panchakarmaFee, discountType, discountValue]);

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    showToast('Image uploaded successfully', 'info');
  };

  // Validation and Submission
  const handleSubmit = (generatePrescription: boolean = true) => {
    if (!fullName.trim()) {
      showToast('Please enter patient full name.', 'error');
      return;
    }
    if (!mobile.trim()) {
      showToast('Please enter patient mobile number.', 'error');
      return;
    }

    const patientId = selectedPatientId || generateNextPatientId(patients);
    const existingPatient = patients.find((p) => p.id === patientId);

    const today = format(new Date(), 'yyyy-MM-dd');
    const opdId = generateNextOpdId(patients);

    const newOpdRecord: OPDRecord = {
      id: opdId,
      patientId: patientId,
      visitDate: today,
      opdType,
      chargeType,
      diagnosis: diagnosis || 'General Health & Consultation',
      symptoms: symptoms.length > 0 ? symptoms : ['General Consultation'],
      uploadedImages,
      medicines: medicines.filter((m) => m.name.trim() !== ''),
      panchakarmaNotes,
      clinicalNotes,
      dietaryAdvice,
      nextVisitDate: nextVisitDate || undefined,
      consultationFee: Number(consultationFee) || 0,
      medicineFee: Number(medicineFee) || 0,
      panchakarmaFee: Number(panchakarmaFee) || 0,
      discountType,
      discountValue: Number(discountValue) || 0,
      totalFee: calculatedTotal,
      paymentMode,
      paymentStatus: 'Paid',
      createdAt: new Date().toISOString(),
    };

    const updatedPatient: Patient = {
      id: patientId,
      fullName: fullName.trim(),
      dob: dob || undefined,
      age: Number(age) || 20,
      gender,
      mobile: mobile.trim(),
      address: address.trim() || undefined,
      bloodGroup,
      registrationDate: existingPatient ? existingPatient.registrationDate : today,
      lastVisitDate: today,
      totalVisits: (existingPatient ? existingPatient.records.length : 0) + 1,
      records: existingPatient ? [newOpdRecord, ...existingPatient.records] : [newOpdRecord],
    };

    onSaveOpdRecord(updatedPatient, newOpdRecord);
    showToast(`OPD record saved for ${updatedPatient.fullName} (${patientId})`, 'success');

    if (generatePrescription) {
      onGeneratePrescription(updatedPatient, newOpdRecord);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 page-fade-in no-print">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">OPD Registration</h1>
            <p className="text-xs text-slate-500">Fill patient details, prescriptions and billing information</p>
          </div>
        </div>
      </div>

      {/* Main OPD Registration Form Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden divide-y divide-slate-100">
        
        {/* SECTION 1: Patient Information */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#1e536e] flex items-center gap-2">
              <span>Patient Information</span>
            </h2>
            <span className="text-xs text-slate-400">* Required fields</span>
          </div>

          {/* Search by Patient ID Autocomplete */}
          <div className="relative max-w-md">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Search by Patient ID / Existing Patient
            </label>
            <div className="relative">
              <input
                type="text"
                value={patientSearchInput || selectedPatientId}
                onChange={(e) => {
                  setPatientSearchInput(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Type patient name or ID (e.g., P0003, Rajas)"
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {selectedPatientId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId('');
                    setPatientSearchInput('');
                    setFullName('');
                    setAge('');
                    setMobile('');
                    setDob('');
                    setAddress('');
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {showPatientDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientId('');
                    setPatientSearchInput('');
                    setShowPatientDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border-b border-slate-100"
                >
                  + Register as New Patient
                </button>
                {patients
                  .filter((p) =>
                    p.fullName.toLowerCase().includes(patientSearchInput.toLowerCase()) ||
                    p.id.toLowerCase().includes(patientSearchInput.toLowerCase()) ||
                    p.mobile.includes(patientSearchInput)
                  )
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setPatientSearchInput(`${p.fullName} (${p.id})`);
                        setShowPatientDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-xs transition"
                    >
                      <span className="font-medium text-slate-800">{p.fullName} ({p.gender}, {p.age}y)</span>
                      <span className="text-slate-400 font-mono">{p.id} • {p.mobile}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Demographics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rajas"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">DOB</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => handleDobChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="e.g. 20"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
                placeholder="e.g. 9632541785"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sawantwadi"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OPD Type</label>
              <select
                value={opdType}
                onChange={(e) => setOpdType(e.target.value as OpdType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              >
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Therapy">Therapy / Panchakarma</option>
                <option value="Routine Checkup">Routine Checkup</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Charge Type</label>
              <select
                value={chargeType}
                onChange={(e) => setChargeType(e.target.value as ChargeType)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              >
                <option value="First Visit">First Visit</option>
                <option value="Follow-up">Follow-up Visit</option>
                <option value="Special Therapy">Special Therapy</option>
                <option value="Emergency Consultation">Emergency Consultation</option>
              </select>
            </div>
          </div>

          {/* Clinical Examination: Diagnosis, Symptoms, Image Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis (e.g., Viral pyrexia, Joint stiffness)"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>

            {/* Smart Symptoms Autocomplete */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Symptoms (Smart Suggestions)
                </label>
                <span className="text-[11px] text-sky-600 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3" /> Auto-suggest
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={symptomInput}
                  onChange={(e) => {
                    setSymptomInput(e.target.value);
                    setShowSymptomSuggestions(true);
                  }}
                  onFocus={() => setShowSymptomSuggestions(true)}
                  placeholder="Start typing symptoms (e.g. Fever, Cough, Headache)..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
                />
              </div>

              {/* Suggestions Popup */}
              {showSymptomSuggestions && filteredSymptoms.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto p-1.5 flex flex-wrap gap-1.5">
                  {filteredSymptoms.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => addSymptom(sym)}
                      className="px-2.5 py-1 text-xs bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-full font-medium transition flex items-center gap-1"
                    >
                      <span>+ {sym}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Symptoms Chips */}
              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {symptoms.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 bg-medihive-50 border border-medihive-200 text-medihive-800 text-xs px-2.5 py-1 rounded-full font-medium"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSymptom(s)}
                        className="text-medihive-500 hover:text-medihive-800 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upload Image Section (Skin Treatment, reports, clinical photos) */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Upload Clinical Image (Skin Treatment / Reports)</span>
              <span className="text-[11px] text-slate-400 font-normal">PNG, JPG, WebP</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-medihive-500 bg-slate-50 hover:bg-slate-100/80 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs font-medium text-slate-700 transition">
                <Upload className="w-4 h-4 text-medihive-600" />
                <span>Choose Image Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {/* Preview thumbnails */}
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden group">
                  <img src={img} alt="Clinical upload" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                    className="absolute inset-0 bg-rose-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Medicines Prescribed Section with Smart Suggestions */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Medicines Prescribed</span>
                </h3>
                <p className="text-xs text-slate-500">Smart suggestions auto-fill dosages & instructions</p>
              </div>
              <button
                type="button"
                onClick={addMedicineRow}
                className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            {/* Medicines List */}
            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div
                  key={med.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200/90 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center relative"
                >
                  {/* Medicine Name with Datalist */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                      Medicine Name #{index + 1}
                    </label>
                    <input
                      type="text"
                      list="med-suggestions"
                      value={med.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      placeholder="e.g. Maharasnadi yog"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-medihive-500"
                    />
                  </div>

                  {/* Dosage */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      placeholder="e.g. 2 tabs"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-medihive-500"
                    />
                  </div>

                  {/* Frequency */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Frequency</label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      placeholder="e.g. Twice daily"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-medihive-500"
                    />
                  </div>

                  {/* Timing */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Timing</label>
                    <select
                      value={med.timing}
                      onChange={(e) => updateMedicine(index, 'timing', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-medihive-500"
                    >
                      <option value="After Food">After Food</option>
                      <option value="Before Food">Before Food</option>
                      <option value="Empty Stomach">Empty Stomach</option>
                      <option value="With Milk">With Milk</option>
                    </select>
                  </div>

                  {/* Duration & Delete */}
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                        placeholder="e.g. 7 Days"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-medihive-500"
                      />
                    </div>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(index)}
                        title="Remove medicine"
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded mt-4 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Datalist for fast medicine autocomplete */}
            <datalist id="med-suggestions">
              {medicineCatalog.map((m) => (
                <option key={m.name} value={m.name} />
              ))}
            </datalist>
          </div>

          {/* Panchakarma & Next Visit Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Panchakarma Notes / Clinical Instructions
              </label>
              <textarea
                rows={2}
                value={panchakarmaNotes}
                onChange={(e) => setPanchakarmaNotes(e.target.value)}
                placeholder="Panchakarma therapy, diet restrictions, lifestyle advice..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-medihive-600" />
                <span>Next Visit Date Reminder</span>
              </label>
              <input
                type="date"
                value={nextVisitDate}
                onChange={(e) => setNextVisitDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                MediHive will automatically remind you in the Calendar when this follow-up is due.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Billing & Payments */}
        <div className="p-5 sm:p-6 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
            <h2 className="text-base font-bold text-[#1e536e] flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-[#1e536e]" />
              <span>Billing & Payments</span>
            </h2>
            <span className="text-xs font-semibold text-slate-500">Auto-calculated fee summary</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fees (₹)</label>
              <input
                type="number"
                min="0"
                value={consultationFee}
                onChange={(e) => setConsultationFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Fees (₹)</label>
              <input
                type="number"
                min="0"
                value={medicineFee}
                onChange={(e) => setMedicineFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Panchakarma Fees (₹)</label>
              <input
                type="number"
                min="0"
                value={panchakarmaFee}
                onChange={(e) => setPanchakarmaFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              >
                <option value="amount">₹ (Amount)</option>
                <option value="percentage">% (Percentage)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Value</label>
              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / Google Pay / PhonePe</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          {/* Total Fee & Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700">Total Fee:</span>
              <div className="bg-white px-4 py-2 rounded-lg border-2 border-medihive-600 shadow-sm">
                <span className="text-xl font-black text-medihive-900 font-mono">
                  ₹{calculatedTotal}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
              >
                Save Record Only
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="flex-1 sm:flex-none bg-[#2da478] hover:bg-[#258d67] text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow-md hover:shadow transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save & Generate Prescription</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

