import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, 
  Sparkles, 
  User as UserIcon, 
  LogOut, 
  Brain, 
  CheckCircle2, 
  Target, 
  BookOpen, 
  ShieldCheck, 
  Clock,
  CheckCheck,
  ChevronDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  type: 'assessment_completed' | 'recommendation_available' | 'learning_progress' | 'competency_update' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      type: 'assessment_completed',
      title: 'Assessment Scored & Verified',
      message: 'Your recent diagnostic test was evaluated. Live competency profile updated.',
      timestamp: '10m ago',
      read: false,
    },
    {
      id: 'n-2',
      type: 'recommendation_available',
      title: 'Priority Recommendation',
      message: 'New iGOT accredited module identified to address your active deficit gap.',
      timestamp: '45m ago',
      read: false,
    },
    {
      id: 'n-3',
      type: 'competency_update',
      title: 'Official Role Benchmarks',
      message: `${user?.role_name || user?.designation || 'Statistical Officer'} competency targets active.`,
      timestamp: '2h ago',
      read: false,
    },
    {
      id: 'n-4',
      type: 'learning_progress',
      title: 'Learning Milestone Logged',
      message: 'Course telemetry synchronized with national training records.',
      timestamp: '1d ago',
      read: true,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Arjun';
  const roleName = user?.role_name || user?.designation || (user?.role === 'admin' ? 'System Administrator' : 'Statistical Officer');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assessment_completed':
        return <CheckCircle2 className="w-4 h-4 text-[#2E8B57]" />;
      case 'recommendation_available':
        return <Target className="w-4 h-4 text-[#A85D4C]" />;
      case 'competency_update':
        return <ShieldCheck className="w-4 h-4 text-[#B38A3D]" />;
      case 'learning_progress':
        return <BookOpen className="w-4 h-4 text-[#2D3030]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#A85D4C]" />;
    }
  };

  return (
    <header className="h-16 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-[#E2DDD5]/80 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-30">
      {/* Left: Greeting & Active Intelligence Status */}
      <div className="flex flex-col text-left">
        <h2 className="text-base sm:text-lg font-bold text-[#292B2B] tracking-tight">
          {getGreeting()}, <span className="text-[#A85D4C]">{firstName}</span>
        </h2>
        <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#7A756E]">
          <span className="w-2 h-2 rounded-full bg-[#2E8B57] animate-pulse" />
          <span>Capacity Intelligence Active</span>
        </div>
      </div>
      
      {/* Right: Notifications & Profile Avatar with Popovers */}
      <div className="flex items-center space-x-3">
        
        {/* Notification Bell with Popover */}
        <div className="relative" ref={notificationsRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="text-[#7A756E] hover:text-[#7D4036] hover:bg-[#EFEBE4] rounded-lg h-9 w-9 relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B38A3D] rounded-full ring-2 ring-[#FFFDF9]" />
            )}
          </Button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFDF9]/95 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(45,48,48,0.08)] border border-[#E2DDD5]/90 py-2 text-left z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-[#E2DDD5]/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#292B2B] uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#A85D4C]/15 text-[#A85D4C] font-mono text-[10px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-[#A85D4C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#E2DDD5]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7A756E]">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "p-3.5 hover:bg-[#EFEBE4] transition-colors cursor-pointer flex items-start space-x-3 text-left",
                        !n.read ? "bg-[#A85D4C]/5" : "bg-[#FFFDF9]"
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-[#FFFDF9] border border-[#E2DDD5] shrink-0 mt-0.5 shadow-2xs">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn("text-xs font-bold text-[#292B2B] truncate", !n.read && "font-black")}>
                            {n.title}
                          </p>
                          <span className="text-[10px] font-mono text-[#8C857B] shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-[#7A756E] line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A85D4C] shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Popover */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center space-x-2 p-1 rounded-xl hover:bg-[#EFEBE4] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#A85D4C]/20"
          >
            <Avatar className="w-8.5 h-8.5 rounded-xl border border-[#E2DDD5] bg-[#A85D4C] text-[#FFFDF9] shadow-2xs">
              <AvatarFallback className="bg-[#A85D4C] text-[#FFFDF9] font-bold text-xs font-mono">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className={cn("w-3.5 h-3.5 text-[#7A756E] transition-transform duration-150", profileOpen && "rotate-180")} />
          </button>

          {/* Profile Dropdown Panel */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#FFFDF9]/95 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(45,48,48,0.08)] border border-[#E2DDD5]/90 py-2 text-left z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-[#E2DDD5]/80">
                <p className="text-xs font-bold text-[#292B2B] truncate">{user?.full_name || 'Arjun Patel'}</p>
                <p className="text-[11px] text-[#7A756E] truncate font-medium">{user?.email || 'arjun.patel@gov.in'}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20">
                    {user?.designation || 'Statistical Officer'}
                  </span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-[#292B2B] hover:bg-[#EFEBE4] transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#7A756E]" />
                  <span>Profile & Official Evidence</span>
                </Link>
                <Link
                  to="/competencies"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-[#292B2B] hover:bg-[#EFEBE4] transition-colors"
                >
                  <Brain className="w-3.5 h-3.5 text-[#7A756E]" />
                  <span>Capability Map</span>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="border-t border-[#E2DDD5] pt-1 mt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="flex items-center space-x-2.5 w-full px-4 py-2 text-xs font-medium text-[#D9534F] hover:bg-[#D9534F]/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

