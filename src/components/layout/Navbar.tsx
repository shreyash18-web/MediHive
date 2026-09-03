import React from 'react';
import { DoctorProfile, ClinicSettings } from '../../types';
import { MediHiveLogo } from '../common/MediHiveLogo';
import { User, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface NavbarProps {
  doctor: DoctorProfile;
  clinic: ClinicSettings;
  activeFollowUpsCount?: number;
  onNavigateToCalendar?: () => void;
  onOpenFollowUps?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  doctor,
  clinic,
  activeFollowUpsCount = 0,
  onNavigateToCalendar,
  onOpenFollowUps,
}) => {
  const currentDateFormatted = format(new Date(), 'dd MMMM yyyy');

  return (
    <header className="bg-gradient-to-r from-[#1e536e] via-[#236484] to-[#1e536e] text-white px-4 sm:px-6 py-2.5 shadow-md flex items-center justify-between z-30 no-print">
      {/* Left side: Brand or Greeting */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center">
          <MediHiveLogo size="sm" textColor="text-white" />
        </div>
        <div className="border-l border-white/20 pl-4 py-0.5 hidden sm:block">
          <span className="text-sm font-semibold tracking-wide text-sky-100">
            Welcome <span className="text-white font-bold">{doctor.name}</span>
          </span>
        </div>
      </div>

      {/* Right side: Follow-up Reminders, Date & Clinic Profile Badge */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Date indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-sky-100 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
          <CalendarIcon className="w-3.5 h-3.5 text-sky-300" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* Follow-up Reminder Bell */}
        {activeFollowUpsCount > 0 && (
          <button
            onClick={onOpenFollowUps || onNavigateToCalendar}
            title={`${activeFollowUpsCount} Follow-ups due today`}
            className="relative p-1.5 rounded-full bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 transition border border-amber-300/40"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {activeFollowUpsCount}
            </span>
          </button>
        )}

        {/* Doctor & Clinic Profile Pill matching screenshots (top-right card) */}
        <div className="flex items-center gap-2.5 bg-white text-slate-800 px-3 py-1 rounded-full shadow-sm border border-slate-100 text-left">
          <div className="w-7 h-7 rounded-full bg-[#1e536e] text-white flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
            {doctor.photoUrl ? (
              <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-sky-200" />
            )}
          </div>
          <div className="pr-1 leading-tight hidden xs:block">
            <p className="text-xs font-bold text-slate-900 truncate max-w-[150px] sm:max-w-[180px]">
              {doctor.name}
            </p>
            <p className="text-[10px] font-medium text-slate-500 truncate max-w-[150px] sm:max-w-[180px]">
              {clinic.name}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

