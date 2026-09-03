import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Eye, 
  Edit3, 
  Printer, 
  ArrowLeft, 
  Trash2, 
  Calendar, 
  Phone, 
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Patient, OPDRecord } from '../../types';
import { useToast } from '../common/Toast';

interface PatientManagementProps {
  patients: Patient[];
  onAddPatient: () => void;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onPrintLatestPrescription: (patient: Patient, record: OPDRecord) => void;
  onBack: () => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({
  patients,
  onAddPatient,
  onViewPatient,
  onEditPatient,
  onPrintLatestPrescription,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Male' | 'Female' | 'Other'>('All');
  const { showToast } = useToast();

  const filteredPatients = useMemo(() => {
    let list = patients;

    if (genderFilter !== 'All') {
      list = list.filter((p) => p.gender === genderFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.mobile.includes(q) ||
          (p.address && p.address.toLowerCase().includes(q))
      );
    }

    return list;
  }, [patients, searchQuery, genderFilter]);

  const handlePrintClick = (patient: Patient) => {
    if (!patient.records || patient.records.length === 0) {
      showToast(`No prescription recorded yet for ${patient.fullName}.`, 'info');
      return;
    }
    const latestRecord = patient.records[0];
    onPrintLatestPrescription(patient, latestRecord);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 page-fade-in no-print">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Patient Management</h1>
            <p className="text-xs text-slate-500">All clinic patient records, history and prescription archive</p>
          </div>
        </div>

        <button
          onClick={onAddPatient}
          className="bg-[#2da478] hover:bg-[#258d67] text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar matching Page 7 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by Name, Mobile Number, or Patient ID..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            {(['All', 'Male', 'Female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 rounded-md transition ${
                  genderFilter === g
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-slate-700 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg">
            Total: <span className="text-[#1e536e] font-black">{filteredPatients.length}</span>
          </div>
        </div>
      </div>

      {/* Main Patients Table matching Page 7 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e536e] text-white text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Patient ID</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-4 py-3.5">Age</th>
                <th className="px-5 py-3.5">DOB / DOR</th>
                <th className="px-4 py-3.5">Gender</th>
                <th className="px-5 py-3.5">Mobile</th>
                <th className="px-5 py-3.5">Last Visit</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No patients match your search query.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onViewPatient(patient)}
                  >
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-xs">
                        {patient.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 capitalize">
                      {patient.fullName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{patient.age}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                      {patient.dob || patient.registrationDate}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          patient.gender === 'Male'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {patient.gender}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{patient.mobile}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium font-mono text-xs">
                      {patient.lastVisitDate}
                    </td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {/* Eye Icon - View (Page 7) */}
                        <button
                          onClick={() => onViewPatient(patient)}
                          title="View Records (Read-Only)"
                          className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Pencil Icon - Edit (Page 7) */}
                        <button
                          onClick={() => onEditPatient(patient)}
                          title="Edit Patient Details"
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* File Icon - Print & Download Prescription (Page 7) */}
                        <button
                          onClick={() => handlePrintClick(patient)}
                          title="Print & Download Latest Prescription"
                          className="p-1.5 text-slate-600 hover:text-[#1e536e] hover:bg-slate-100 rounded-md transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

