import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const location = useLocation();
  const isQuizPage = location.pathname.startsWith('/quiz/') && !location.pathname.endsWith('/result');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F7F4EE]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className={cn(
          "flex-1 bg-[#F7F4EE]",
          isQuizPage 
            ? "overflow-hidden p-3 sm:p-4 flex flex-col min-h-0" 
            : "overflow-y-auto p-6 sm:p-8"
        )}>
          <div className={cn(
            "max-w-7xl mx-auto w-full",
            isQuizPage ? "flex-1 flex flex-col min-h-0 h-full" : ""
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}


