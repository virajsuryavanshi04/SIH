import { useAuth } from '@/contexts/AuthContext';
import { Bell, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { user } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : 'Arjun';

  return (
    <header className="h-16 bg-[#FFFFFF] border-b border-[#2B2D42]/10 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-10">
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
      
      {/* Right: Minimal Notification & Profile Avatar */}
      <div className="flex items-center space-x-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-[#2B2D42] hover:text-[#1F7A8C] hover:bg-[#F4F6F9] rounded-lg h-9 w-9 cursor-pointer"
        >
          <Bell className="w-4 h-4" />
        </Button>
        <div className="flex items-center space-x-3 border-l border-[#2B2D42]/10 pl-3">
          <Avatar className="h-8 w-8 ring-1 ring-[#2B2D42]/15">
            <AvatarFallback className="bg-[#0B2545] text-[#FFFFFF] font-bold text-xs">
              {user?.full_name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
