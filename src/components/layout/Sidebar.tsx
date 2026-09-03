import React from 'react';
import { 
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  Calendar, 
  Settings, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { MediHiveLogo } from '../common/MediHiveLogo';

export type NavigationTab = 
  | 'dashboard'
  | 'opd'
  | 'patients'
  | 'calendar'
  | 'settings'
  | 'help';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onLogout: () => void;
  pendingFollowUpsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  pendingFollowUpsCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'opd' as NavigationTab, label: 'OPD', icon: Stethoscope },
    { id: 'patients' as NavigationTab, label: 'Patient Management', icon: Users },
    { 
      id: 'calendar' as NavigationTab, 
      label: 'Calendar', 
      icon: Calendar,
      badge: pendingFollowUpsCount > 0 ? pendingFollowUpsCount : undefined
    },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#194358] text-slate-100 flex flex-col justify-between h-screen shrink-0 border-r border-[#153a4c] select-none no-print transition-all">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-[#245770]">
          <MediHiveLogo size="md" textColor="text-white" />
          <p className="text-[11px] text-sky-200/70 mt-1 pl-10 font-medium">Clinic Management System</p>
        </div>

        {/* Main Navigation */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#2b7194] text-white shadow-inner font-semibold'
                    : 'text-sky-100/80 hover:bg-[#20516b] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sky-300' : 'text-sky-200/70 group-hover:text-white'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-400 text-slate-900 font-bold text-[11px] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Help & Logout */}
      <div className="p-3 border-t border-[#245770] space-y-1">
        <button
          onClick={() => onSelectTab('help')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            currentTab === 'help'
              ? 'bg-[#2b7194] text-white font-semibold'
              : 'text-sky-100/80 hover:bg-[#20516b] hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-sky-300" />
          <span>Help Center</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-200/80 hover:bg-rose-900/30 hover:text-rose-100 transition-all"
        >
          <LogOut className="w-4 h-4 text-rose-300" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

