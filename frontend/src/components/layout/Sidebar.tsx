import { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onFocusCapture={() => setIsExpanded(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsExpanded(false);
        }
      }}
      className={cn(
        "flex flex-col h-screen bg-[#2D3030] text-[#FFFDF9] border-r border-[#2D3030] z-30 shadow-[2px_0_8px_rgba(45,48,48,0.08)] shrink-0 select-none",
        "transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-hidden",
        isExpanded ? "w-[272px]" : "w-[76px]"
      )}
    >
      {/* Brand Header */}
      <div className="px-3 h-14 border-b border-[#FFFDF9]/10 shrink-0 flex items-center overflow-hidden">
        <Link
          to="/"
          className={cn(
            "flex items-center text-left w-full transition-all duration-200",
            isExpanded ? "px-1.5 space-x-3" : "justify-center px-0"
          )}
        >
          <div className="w-8.5 h-8.5 rounded-lg bg-[#A85D4C] flex items-center justify-center text-[#FFFDF9] shadow-[0_1px_3px_rgba(168,93,76,0.3)] shrink-0">
            <Brain className="w-4.5 h-4.5" />
          </div>
          <div
            className={cn(
              "min-w-0 transition-opacity duration-200 ease-in-out whitespace-nowrap overflow-hidden flex-col justify-center",
              isExpanded ? "opacity-100 flex" : "opacity-0 hidden"
            )}
          >
            <span className="text-[16px] font-bold tracking-tight text-[#FFFDF9] leading-tight block">
              SmartLearn
            </span>
            <span className="text-[10px] font-medium text-[#FFFDF9]/75 tracking-wider leading-tight mt-0.5 block">
              Competency Intelligence
            </span>
          </div>
        </Link>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-2.5 sm:px-3 py-2 sm:py-2.5 space-y-2.5 sm:space-y-3 overflow-hidden">
        {groups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {/* Section Heading */}
            <div
              className={cn(
                "px-3 pt-1 pb-0.5 text-[11px] font-semibold tracking-wider text-[#FFFDF9]/50 uppercase text-left whitespace-nowrap transition-opacity duration-200 overflow-hidden",
                isExpanded ? "opacity-100 block" : "opacity-0 hidden"
              )}
            >
              {group.title}
            </div>

            {/* Navigation Links */}
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin' || link.to === '/dashboard'}
                title={!isExpanded ? link.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-xl text-[14px] sm:text-[15px] transition-all duration-200 text-left h-9",
                    isExpanded ? "px-3 space-x-3 w-full" : "px-0 justify-center w-10 mx-auto",
                    isActive 
                      ? "bg-[#A85D4C] text-[#FFFDF9] shadow-[0_1px_3px_rgba(168,93,76,0.3)] font-semibold" 
                      : "text-[#FFFDF9]/80 hover:bg-[#FFFDF9]/10 hover:text-[#FFFDF9] font-medium"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <link.icon className={cn("w-[18px] h-[18px] shrink-0 transition-colors", isActive ? "text-[#FFFDF9]" : "text-[#FFFDF9]/70")} />
                    <span
                      className={cn(
                        "truncate whitespace-nowrap transition-opacity duration-200",
                        isExpanded ? "opacity-100 inline-block" : "opacity-0 hidden"
                      )}
                    >
                      {link.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className="p-2.5 sm:p-3 border-t border-[#FFFDF9]/10 bg-[#2D3030] shrink-0 overflow-hidden">
        <div
          className={cn(
            "flex items-center rounded-xl bg-[#FFFDF9]/5 border border-[#FFFDF9]/10 mb-1.5 transition-all duration-200",
            isExpanded ? "p-2 space-x-2.5 text-left w-full shadow-[0_1px_2px_rgba(0,0,0,0.1)]" : "p-1 justify-center w-10 mx-auto"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-[#A85D4C] text-[#FFFDF9] flex items-center justify-center font-semibold text-xs shadow-xs shrink-0 font-mono">
            {user?.full_name?.charAt(0) || 'A'}
          </div>
          <div
            className={cn(
              "flex-1 min-w-0 transition-opacity duration-200 whitespace-nowrap overflow-hidden",
              isExpanded ? "opacity-100 block" : "opacity-0 hidden"
            )}
          >
            <p className="text-sm font-semibold text-[#FFFDF9] truncate leading-tight">{user?.full_name || 'Arjun Patel'}</p>
            <p className="text-xs text-[#FFFDF9]/75 truncate font-medium mt-0.5">
              {user?.designation || (isAdmin ? 'System Administrator' : 'Statistical Officer')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          title={!isExpanded ? 'Sign Out' : undefined}
          className={cn(
            "flex items-center rounded-xl text-xs sm:text-sm font-medium text-[#FFFDF9]/75 hover:text-[#B38A3D] hover:bg-[#FFFDF9]/10 transition-all duration-200 cursor-pointer text-left h-8",
            isExpanded ? "px-2.5 space-x-2 w-full" : "px-0 justify-center w-10 mx-auto"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span
            className={cn(
              "whitespace-nowrap transition-opacity duration-200",
              isExpanded ? "opacity-100 inline-block" : "opacity-0 hidden"
            )}
          >
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
}


