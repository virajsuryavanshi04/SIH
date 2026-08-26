import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Brain, CheckSquare, Compass, 
  BookOpen, FileText, TrendingUp, User as UserIcon,
  Users, BarChart3, LogOut, Database, ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const { isLearner, isAdmin, logout, user } = useAuth();

  const learnerGroups = [
    {
      title: 'INTELLIGENCE',
      links: [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/competencies', label: 'Capability Map', icon: Brain },
        { to: '/assessment', label: 'Assessments', icon: CheckSquare },
      ]
    },
    {
      title: 'DEVELOPMENT',
      links: [
        { to: '/learning-path', label: 'Learning Path', icon: Compass },
        { to: '/courses', label: 'iGOT Learning', icon: BookOpen },
        { to: '/materials', label: 'Practice', icon: FileText },
      ]
    },
    {
      title: 'INSIGHTS',
      links: [
        { to: '/progress', label: 'Progress', icon: TrendingUp },
        { to: '/profile', label: 'Evidence', icon: UserIcon },
      ]
    }
  ];

  const adminGroups = [
    {
      title: 'INTELLIGENCE',
      links: [
        { to: '/admin', label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/competencies', label: 'Capability Map', icon: Brain },
        { to: '/admin/question-bank', label: 'Assessments', icon: Database },
      ]
    },
    {
      title: 'DEVELOPMENT',
      links: [
        { to: '/admin/materials', label: 'Curricula & Practice', icon: FileText },
      ]
    },
    {
      title: 'INSIGHTS',
      links: [
        { to: '/admin/gaps', label: 'Workforce Heatmap', icon: BarChart3 },
        { to: '/admin/employees', label: 'Officer Directory', icon: Users },
        { to: '/admin/analytics', label: 'Progress & Analytics', icon: TrendingUp },
      ]
    }
  ];

  const groups = isLearner ? learnerGroups : (isAdmin ? adminGroups : []);

  return (
    <div className="flex flex-col h-full w-64 bg-[#0B2545] text-[#FFFFFF] border-r border-[#0B2545] z-20 shadow-md">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-[#FFFFFF]/10">
        <Link to="/" className="flex items-center space-x-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-[#1F7A8C] flex items-center justify-center text-[#FFFFFF] shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-[#FFFFFF] block leading-none">SmartLearn</span>
            <span className="text-[10px] font-medium text-[#FFFFFF]/70 tracking-wider block mt-1">
              Competency Intelligence
            </span>
          </div>
        </Link>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-mono font-bold tracking-widest text-[#FFFFFF]/50 uppercase text-left">
              {group.title}
            </div>
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin' || link.to === '/dashboard'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 text-left",
                    isActive 
                      ? "bg-[#1F7A8C] text-[#FFFFFF] shadow-xs font-bold" 
                      : "text-[#FFFFFF]/75 hover:bg-[#FFFFFF]/10 hover:text-[#FFFFFF]"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <link.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#FFFFFF]" : "text-[#FFFFFF]/70")} />
                    <span className="truncate">{link.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className="p-4 border-t border-[#FFFFFF]/10 bg-[#0B2545]">
        <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-[#FFFFFF]/5 border border-[#FFFFFF]/10 mb-2 text-left">
          <div className="w-8 h-8 rounded-lg bg-[#1F7A8C] text-[#FFFFFF] flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#FFFFFF] truncate">{user?.full_name || 'Arjun Patel'}</p>
            <p className="text-[10px] text-[#FFFFFF]/70 truncate font-medium">
              {user?.designation || (isAdmin ? 'System Administrator' : 'Statistical Officer')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2.5 px-3 py-1.5 w-full rounded-lg text-xs font-medium text-[#FFFFFF]/70 hover:text-[#D4AF37] hover:bg-[#FFFFFF]/10 transition-colors cursor-pointer text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
