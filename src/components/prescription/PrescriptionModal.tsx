import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Edit3, 
  Check, 
  Share2, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  FileText 
} from 'lucide-react';
import { Patient, OPDRecord, DoctorProfile, ClinicSettings } from '../../types';
import { format } from 'date-fns';
import { useToast } from '../common/Toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrescriptionModalProps {
  patient: Patient;
  record: OPDRecord;
  doctor: DoctorProfile;
  clinic: ClinicSettings;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onConfirmSave?: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  patient,
  record,
  doctor,
  clinic,
  isOpen,
  onClose,
  onEdit,
  onConfirmSave,
}) => {
  const prescriptionRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF Handler using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!prescriptionRef.current) return;
    try {
      showToast('Generating PDF prescription...', 'info');
      const canvas = await html2canvas(prescriptionRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      pdf.save(`Prescription_${patient.fullName}_${record.visitDate}.pdf`);
      showToast('Prescription PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate PDF. You can also use the Print button.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1e536e]" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Prescription Preview — {patient.fullName} ({patient.id})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Prescription Document Area (Exact reproduction of Page 6) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/50 flex justify-center">
          <div
            ref={prescriptionRef}
            id="printable-prescription"
            className="bg-white rounded-xl shadow-md border border-slate-200/90 w-full max-w-[720px] p-6 sm:p-10 text-slate-800 space-y-5 print:shadow-none print:border-none print:p-0"
          >
            {/* Header: Clinic Emblem + Clinic Details + Doctor Info */}
            <div className="border-b-2 border-[#1e536e] pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Clinic Logo Emblem */}
                <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-2 text-emerald-700">
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-emerald-600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 10 C30 30 15 55 15 75 C15 88 26 95 38 95 C48 95 50 88 50 88 C50 88 52 95 62 95 C74 95 85 88 85 75 C85 55 70 30 50 10 Z" />
                    <circle cx="50" cy="50" r="10" fill="#ffffff" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#1e536e] tracking-tight">
                    {clinic.name}
                  </h1>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{doctor.name}</p>
                  <p className="text-[11px] font-medium text-emerald-700">{doctor.qualifications}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Reg No: {doctor.medicalLicenseNo}</p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-600 space-y-0.5 border-t sm:border-t-0 sm:border-l sm:border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                <p className="flex items-center justify-end gap-1 font-medium">
                  <Phone className="w-3 h-3 text-slate-400" /> {clinic.phone}
                </p>
                <p className="flex items-center justify-end gap-1 text-slate-500">
                  <Clock className="w-3 h-3 text-slate-400" /> {clinic.operatingHours}
                </p>
                <p className="text-[10px] text-slate-500 max-w-[200px] leading-tight mt-1">
                  {clinic.address}
                </p>
              </div>
            </div>

            {/* Patient Meta Strip */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Patient Name:</span>
                <p className="font-bold text-slate-900 capitalize">{patient.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Age / Gender:</span>
                <p className="font-bold text-slate-900">{patient.age} Yrs / {patient.gender}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Patient ID:</span>
                <p className="font-bold font-mono text-slate-900">{patient.id}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Date:</span>
                <p className="font-bold text-slate-900">{record.visitDate}</p>
              </div>
            </div>

            {/* Symptoms & Diagnosis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {record.symptoms && record.symptoms.length > 0 && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Symptoms:</span>
                  <p className="text-slate-800">{record.symptoms.join(', ')}</p>
                </div>
              )}
              {record.diagnosis && (
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Diagnosis:</span>
                  <p className="text-slate-800">{record.diagnosis}</p>
                </div>
              )}
            </div>

            {/* MEDICINES PRESCRIBED BANNER & LIST (Page 6 highlight) */}
            <div className="space-y-2">
              <div className="bg-[#1e536e] text-white px-4 py-2 rounded-md flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                <span>MEDICINES PRESCRIBED</span>
                <span className="text-[10px] text-sky-200 font-normal">Rx</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {record.medicines.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No medicines prescribed.</div>
                ) : (
                  record.medicines.map((med, idx) => (
                    <div key={med.id || idx} className="p-3 text-xs flex items-start justify-between bg-white hover:bg-slate-50/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{idx + 1}. {med.name}</span>
                          <span className="bg-sky-50 text-sky-800 font-semibold px-2 py-0.5 rounded text-[11px] border border-sky-100">
                            {med.dosage}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Schedule:</strong> {med.frequency} • <em>{med.timing}</em>
                          {med.instructions && ` (${med.instructions})`}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-medium text-slate-700 text-xs">
                        {med.duration}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes & Panchakarma Notes */}
            <div className="space-y-2 text-xs">
              {record.clinicalNotes && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700">Notes: </span>
                  <span className="text-slate-800">{record.clinicalNotes}</span>
                </div>
              )}
              {record.panchakarmaNotes && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-emerald-800">Panchakarma Notes: </span>
                  <span className="text-slate-800">{record.panchakarmaNotes}</span>
                </div>
              )}
              {record.dietaryAdvice && (
                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900">
                  <span className="font-bold">Dietary Advice: </span>
                  <span>{record.dietaryAdvice}</span>
                </div>
              )}
            </div>

            {/* Next Visit Banner */}
            {record.nextVisitDate && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="font-bold text-[#1e536e] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Next Visit Reminder:
                </span>
                <span className="font-black text-sky-900 font-mono text-sm bg-white px-2.5 py-0.5 rounded border border-sky-200">
                  {record.nextVisitDate}
                </span>
              </div>
            )}

            {/* Doctor Signature Block */}
            <div className="pt-8 flex justify-end items-center text-right">
              <div className="space-y-1 pr-4">
                <div className="w-36 border-b border-slate-400 mb-2"></div>
                <p className="text-xs font-bold text-slate-900">{doctor.name}</p>
                <p className="text-[10px] text-slate-500">{doctor.qualifications}</p>
              </div>
            </div>

            {/* Subtle Prescription Footer */}
            <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
              Prescription generated via MediHive Clinical Suite • Keep medicines out of reach of children
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions matching Page 6 */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#1e536e]" />
              <span>Print</span>
            </button>

            {onConfirmSave && (
              <button
                type="button"
                onClick={onConfirmSave}
                className="px-5 py-2 rounded-lg bg-[#2da478] hover:bg-[#258d67] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Save</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

