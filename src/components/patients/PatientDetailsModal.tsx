import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Phone, 
  User, 
  FileText, 
  Printer, 
  Eye, 
  IndianRupee, 
  Sparkles,
  Plus
} from 'lucide-react';
import { Patient, OPDRecord } from '../../types';
import { format } from 'date-fns';

interface PatientDetailsModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onPreviewPrescription: (record: OPDRecord) => void;
  onPrintPrescription: (record: OPDRecord) => void;
  onAddNewOpd: (patientId: string) => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  patient,
  isOpen,
  onClose,
  onPreviewPrescription,
  onPrintPrescription,
  onAddNewOpd,
}) => {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header matching Page 8 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 capitalize">
              {patient.fullName}
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              {patient.id} • {patient.mobile} • {patient.gender}, {patient.age} yrs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onAddNewOpd(patient.id);
              }}
              className="text-xs bg-[#2da478] hover:bg-[#258d67] text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Visit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visit History List matching Page 8 Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100/40">
          {patient.records.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
              No OPD consultation records found for this patient.
            </div>
          ) : (
            patient.records.map((record, index) => (
              <div
                key={record.id || index}
                className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-5 space-y-3"
              >
                {/* Visit Top Strip */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span className="text-sm font-bold text-slate-800">
                      {record.visitDate}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({record.id})</span>
                  </div>
                  <span className="text-xs bg-sky-50 text-sky-700 font-semibold px-2.5 py-0.5 rounded-full border border-sky-100">
                    {record.chargeType || 'First Visit'}
                  </span>
                </div>

                {/* Symptoms & Diagnosis */}
                <div className="text-xs space-y-1 text-slate-700">
                  {record.diagnosis && (
                    <p>
                      <strong>Diagnosis:</strong> {record.diagnosis}
                    </p>
                  )}
                  {record.symptoms && record.symptoms.length > 0 && (
                    <p>
                      <strong>Symptoms:</strong> {record.symptoms.join(', ')}
                    </p>
                  )}
                </div>

                {/* Medicines List */}
                {record.medicines && record.medicines.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">Medicines:</span>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-700">
                      {record.medicines.map((m, mIdx) => (
                        <li key={mIdx}>
                          <span className="font-semibold">{m.name}</span> — {m.dosage} ({m.frequency}, {m.timing})
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Panchakarma & Clinical Notes */}
                <div className="text-xs space-y-1 text-slate-600">
                  {record.clinicalNotes && (
                    <p>
                      <strong>Notes:</strong> {record.clinicalNotes}
                    </p>
                  )}
                  {record.panchakarmaNotes && (
                    <p>
                      <strong className="text-emerald-800">Panchakarma Notes:</strong> {record.panchakarmaNotes}
                    </p>
                  )}
                  {record.nextVisitDate && (
                    <p className="flex items-center gap-1.5 text-sky-800 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Next Visit: <strong>{record.nextVisitDate}</strong></span>
                    </p>
                  )}
                </div>

                {/* Card Footer: Total & Actions (Preview / Print) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">
                    Total: <span className="font-black text-medihive-800">₹{record.totalFee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreviewPrescription(record)}
                      className="px-3 py-1.5 text-xs font-semibold bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => onPrintPrescription(record)}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#1e536e] text-white hover:bg-[#18445a] rounded-lg flex items-center gap-1 shadow-sm transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

