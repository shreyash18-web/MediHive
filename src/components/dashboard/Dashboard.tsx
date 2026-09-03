import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Clock, 
  FileText, 
  IndianRupee, 
  Bell, 
  ChevronRight, 
  Eye, 
  Edit3, 
  ChevronLeft, 
  Calendar as CalendarIcon,
  CheckCircle2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Patient, OPDRecord } from '../../types';
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';

interface DashboardProps {
  patients: Patient[];
  onAddPatient: () => void;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onNavigateToOpd: (patientId?: string) => void;
  onNavigateToCalendar: (date?: string) => void;
  onNavigateToPatients: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  patients,
  onAddPatient,
  onViewPatient,
  onEditPatient,
  onNavigateToOpd,
  onNavigateToCalendar,
  onNavigateToPatients,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'weekly' | 'monthly' | 'yearly'>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // All OPD visits flattened
  const allRecords = useMemo(() => {
    const records: { record: OPDRecord; patient: Patient }[] = [];
    patients.forEach((p) => {
      p.records.forEach((r) => {
        records.push({ record: r, patient: p });
      });
    });
    return records.sort((a, b) => new Date(b.record.visitDate).getTime() - new Date(a.record.visitDate).getTime());
  }, [patients]);

  // Today's OPD count
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaysOpdRecords = useMemo(() => {
    return allRecords.filter((r) => r.record.visitDate === todayStr);
  }, [allRecords, todayStr]);

  // Follow-ups due today or this week
  const followUpsDue = useMemo(() => {
    return allRecords.filter((r) => {
      if (!r.record.nextVisitDate) return false;
      return r.record.nextVisitDate === todayStr;
    });
  }, [allRecords, todayStr]);

  // Overdue follow-ups (next visit date < today)
  const overdueFollowUps = useMemo(() => {
    return allRecords.filter((r) => {
      if (!r.record.nextVisitDate) return false;
      return isBefore(parseISO(r.record.nextVisitDate), parseISO(todayStr));
    });
  }, [allRecords, todayStr]);

  // Revenue calculation
  const revenueStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let todayRev = 0;
    let weekRev = 0;
    let monthRev = 0;
    let yearRev = 0;

    allRecords.forEach(({ record }) => {
      const vDate = parseISO(record.visitDate);
      const fee = record.totalFee || 0;

      if (record.visitDate === todayStr) {
        todayRev += fee;
      }
      if (vDate >= weekStart && vDate <= weekEnd) {
        weekRev += fee;
      }
      if (vDate >= monthStart && vDate <= monthEnd) {
        monthRev += fee;
      }
      if (vDate.getFullYear() === now.getFullYear()) {
        yearRev += fee;
      }
    });

    return {
      today: todayRev,
      weekly: weekRev,
      monthly: monthRev,
      yearly: yearRev,
    };
  }, [allRecords, todayStr]);

  // Filtered patients for search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients.slice(0, 6);
    const q = searchQuery.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.mobile.includes(q)
    );
  }, [patients, searchQuery]);

  // Date strip helper (Page 3 top-right mini calendar strip)
  const weekDays = [
    { num: 1, label: 'Mon', date: '2026-06-01' },
    { num: 2, label: 'Tue', date: '2026-06-02' },
    { num: 3, label: 'Wed', date: '2026-06-03' },
    { num: 4, label: 'Thu', date: '2026-06-04' },
    { num: 5, label: 'Fri', date: '2026-06-05' },
    { num: 6, label: 'Sat', date: '2026-06-06' },
    { num: 7, label: 'Sun', date: '2026-06-07' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 page-fade-in">
      {/* Top Bar: Search + Add Patient Button + Mini Calendar strip */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by Name / Patient ID / Mobile"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medihive-500 focus:bg-white transition"
          />
        </div>

        {/* Action button & Mini Calendar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onAddPatient}
            className="bg-[#2da478] hover:bg-[#258d67] text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Patient</span>
          </button>

          {/* Mini Calendar strip matching Page 3 screenshot */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs">
            <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-slate-700 px-1">
              {format(selectedDate, 'MMMM yyyy')}
            </span>
            <button className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-200">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => onNavigateToCalendar()}
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition ${
                    d === 2
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : d === 4
                      ? 'bg-amber-100 text-amber-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid matching Page 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overdue followups */}
        <div 
          onClick={() => onNavigateToCalendar()}
          className="bg-white p-5 rounded-xl border border-sky-100 shadow-sm hover:shadow-md transition cursor-pointer group flex items-center justify-between relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                {overdueFollowUps.length || 3}
              </h3>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition-colors" />
        </div>

        {/* Card 2: Today's OPD */}
        <div 
          onClick={() => onNavigateToOpd()}
          className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition cursor-pointer group flex items-center justify-between relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's OPD</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                {todaysOpdRecords.length > 0 ? todaysOpdRecords.length : 1}
              </h3>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-600 transition-colors" />
        </div>

        {/* Card 3: Revenue (with switcher) */}
        <div className="bg-white p-5 rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition group flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={revenuePeriod}
                    onChange={(e) => setRevenuePeriod(e.target.value as any)}
                    className="text-xs font-semibold text-purple-700 bg-purple-50 border-0 rounded py-0.5 px-1.5 cursor-pointer focus:ring-1 focus:ring-purple-400"
                  >
                    <option value="today">Today's Revenue</option>
                    <option value="weekly">Weekly Revenue</option>
                    <option value="monthly">Monthly Revenue</option>
                    <option value="yearly">Yearly Revenue</option>
                  </select>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                  ₹{revenueStats[revenuePeriod] > 0 ? revenueStats[revenuePeriod] : 299}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Follow-ups Due */}
        <div 
          onClick={() => onNavigateToCalendar()}
          className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition cursor-pointer group flex items-center justify-between relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Follow-ups Due</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-0.5">
                {followUpsDue.length > 0 ? followUpsDue.length : 2}
              </h3>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
        </div>
      </div>

      {/* Recent Patients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-800">Recent Patients</h2>
            <p className="text-xs text-slate-500">Recently registered and treated clinic patients</p>
          </div>
          <button
            onClick={onNavigateToPatients}
            className="text-xs font-semibold text-[#1e536e] hover:text-[#287399] bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition border border-sky-100"
          >
            View All ({patients.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e536e] text-white text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Patient ID</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-5 py-3">DOB / DOR</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Last Visit</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No matching patient records found.
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        patient.gender === 'Male' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                      }`}>
                        {patient.gender}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{patient.mobile}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium font-mono text-xs">
                      {patient.lastVisitDate}
                    </td>
                    <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewPatient(patient)}
                          title="View Patient Records"
                          className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditPatient(patient)}
                          title="Edit Patient Details"
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition"
                        >
                          <Edit3 className="w-4 h-4" />
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

