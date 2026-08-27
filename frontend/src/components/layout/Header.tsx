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
        return <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />;
      case 'recommendation_available':
        return <Target className="w-4 h-4 text-[#1F7A8C]" />;
      case 'competency_update':
        return <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />;
      case 'learning_progress':
        return <BookOpen className="w-4 h-4 text-[#0B2545]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#1F7A8C]" />;
    }
  };

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#2B2D42]/10 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-30">
      {/* Left: Greeting & Active Intelligence Status */}
      <div className="flex flex-col text-left">
        <h2 className="text-base sm:text-lg font-bold text-[#0B2545] tracking-tight">
          {getGreeting()}, <span className="text-[#1F7A8C]">{firstName}</span>
        </h2>
        <div className="flex items-center space-x-1.5 text-[11px] font-medium text-[#2B2D42]/70">
          <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
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
            className="text-[#2B2D42] hover:text-[#1F7A8C] hover:bg-[#F4F6F9] rounded-lg h-9 w-9 relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full ring-2 ring-[#FFFFFF]" />
            )}
          </Button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFFFF] rounded-xl shadow-lg border border-[#2B2D42]/15 py-2 text-left z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-[#2B2D42]/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#1F7A8C]/15 text-[#1F7A8C] font-mono text-[10px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-[#1F7A8C] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#2B2D42]/5">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#2B2D42]/60">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "p-3.5 hover:bg-[#F4F6F9] transition-colors cursor-pointer flex items-start space-x-3 text-left",
                        !n.read ? "bg-[#1F7A8C]/5" : "bg-[#FFFFFF]"
                      )}
                    >
                      <div className="p-1.5 rounded-lg bg-[#FFFFFF] border border-[#2B2D42]/10 shrink-0 mt-0.5 shadow-2xs">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className={cn("text-xs font-bold text-[#0B2545] truncate", !n.read && "font-black")}>
                            {n.title}
                          </p>
                          <span className="text-[10px] font-mono text-[#2B2D42]/50 shrink-0">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#2B2D42]/80 leading-snug line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A8C] shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar with Popover */}
        <div className="relative border-l border-[#2B2D42]/10 pl-3" ref={profileRef}>
          <button 
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            aria-label="User Profile Menu"
            className="flex items-center space-x-2 rounded-full p-0.5 hover:ring-2 hover:ring-[#1F7A8C]/30 transition-all cursor-pointer"
          >
            <Avatar className="h-8 w-8 ring-1 ring-[#2B2D42]/15">
              <AvatarFallback className="bg-[#0B2545] text-[#FFFFFF] font-bold text-xs font-mono">
                {user?.full_name?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="w-3 h-3 text-[#2B2D42]/60 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] rounded-xl shadow-lg border border-[#2B2D42]/15 py-2 text-left z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Details Header */}
              <div className="px-4 py-3 border-b border-[#2B2D42]/10 space-y-1">
                <p className="text-xs font-bold text-[#0B2545] leading-tight">
                  {user?.full_name || 'Arjun Patel'}
                </p>
                <p className="text-[11px] text-[#2B2D42]/60 font-mono truncate">
                  {user?.email || 'arjun.patel@gov.in'}
                </p>
                <div className="pt-1">
                  <span className="inline-block px-2 py-0.5 bg-[#1F7A8C]/10 text-[#1F7A8C] font-mono text-[10px] font-bold rounded">
                    {roleName}
                  </span>
                </div>
              </div>

              {/* Menu Links */}
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-[#2B2D42] hover:bg-[#F4F6F9] hover:text-[#1F7A8C] transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#1F7A8C]" />
                  <span>View Profile & Credentials</span>
                </Link>
              </div>

              {/* Sign Out Button */}
              <div className="pt-1 border-t border-[#2B2D42]/10">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2.5 px-4 py-2 w-full text-xs font-medium text-[#0B2545] hover:bg-[#F4F6F9] hover:text-[#D4AF37] transition-colors cursor-pointer text-left"
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

