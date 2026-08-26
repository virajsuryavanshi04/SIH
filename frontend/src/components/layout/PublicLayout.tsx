import { Outlet, Link } from 'react-router-dom';
import { Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9]">
      <nav className="border-b border-[#0B2545] bg-[#0B2545] text-[#FFFFFF] sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#1F7A8C] flex items-center justify-center text-[#FFFFFF] shadow-sm">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#FFFFFF]">SmartLearn</span>
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                  SIH 2026
                </span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/about" className="text-sm font-semibold text-[#FFFFFF]/80 hover:text-[#FFFFFF] transition-colors">
                About Architecture
              </Link>
              <Link to="/login">
                <Button className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-semibold shadow-xs">
                  Portal Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[#0B2545] border-t border-[#0B2545] py-8 text-center text-[#FFFFFF]/70 text-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-[#1F7A8C]" />
            <span className="font-bold text-[#FFFFFF]">SmartLearn Platform</span>
            <span className="text-[#FFFFFF]/60">| Capacity Building in India's Official Statistical System</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Ministry of Statistics & Programme Implementation. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
