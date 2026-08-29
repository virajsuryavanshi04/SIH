import { Outlet, Link } from 'react-router-dom';
import { Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4EE]">
      <nav className="border-b border-[#2D3030] bg-[#2D3030] text-[#FFFDF9] sticky top-0 z-50 shadow-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#A85D4C] flex items-center justify-center text-[#FFFDF9] shadow-sm">
                <Brain className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#FFFDF9]">SmartLearn</span>
            </Link>
            <div className="flex items-center space-x-3 sm:space-x-5">
              <Link to="/about" className="hidden sm:inline-block text-[15px] font-medium text-[#FFFDF9]/85 hover:text-[#FFFDF9] transition-colors">
                About Architecture
              </Link>
              <Link to="/login">
                <Button className="bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] text-xs sm:text-[15px] font-semibold shadow-xs transition-colors cursor-pointer px-3 sm:px-4 h-8.5 sm:h-9.5">
                  Portal Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="bg-[#2D3030] border-t border-[#2D3030] py-4 sm:py-5 text-center text-[#FFFDF9]/70 text-xs sm:text-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-4.5 h-4.5 text-[#A85D4C]" />
            <span className="font-bold text-[#FFFDF9]">SmartLearn Platform</span>
            <span className="text-[#FFFDF9]/60 hidden md:inline">| Capacity Building in India's Official Statistical System</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Ministry of Statistics & Programme Implementation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

