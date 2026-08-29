import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Sparkles, User, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: 'Welcome to SmartLearn', description: 'Logged in successfully' });
      
      const meRes = await authApi.getMe();
      if (meRes.data?.role === 'learner' && !meRes.data?.role_id && !meRes.data?.designation) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast({ title: 'Authentication Failed', description: 'Invalid email or password', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (type: 'learner' | 'admin' | 'new_onboard') => {
    if (type === 'learner') {
      setEmail('arjun.patel@gov.in');
      setPassword('learn123');
    } else if (type === 'admin') {
      setEmail('admin@smartlearn.gov.in');
      setPassword('admin123');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F4EE] py-4 sm:py-6 px-4 sm:px-6 lg:px-8 relative select-none my-auto">
      <Card className="w-full max-w-md shadow-[0_4px_24px_rgba(45,48,48,0.06)] border border-[#E2DDD5] relative z-10 bg-[#FFFDF9] rounded-2xl my-auto">
        <CardHeader className="space-y-2 text-center p-6 pb-4 border-b border-[#E2DDD5]">
          <div className="flex items-center justify-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#A85D4C] flex items-center justify-center text-[#FFFDF9] shadow-[0_1px_3px_rgba(168,93,76,0.3)]">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#292B2B]">SmartLearn</span>
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-[#292B2B]">Official Portal Access</CardTitle>
            <CardDescription className="text-xs text-[#7A756E] mt-0.5">SmartLearn Competency Intelligence System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-5 space-y-4">
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#292B2B]">Official Email Address</label>
              <Input 
                type="email" 
                placeholder="officer@gov.in" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-2 focus:ring-[#A85D4C]/25 bg-[#FFFDF9] text-xs text-[#292B2B] h-10 rounded-xl transition-all duration-200 ease-out" 
                required
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#292B2B]">Password</label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-2 focus:ring-[#A85D4C]/25 bg-[#FFFDF9] text-xs text-[#292B2B] h-10 rounded-xl transition-all duration-200 ease-out" 
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full font-semibold text-sm bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] shadow-xs mt-2 cursor-pointer h-10 rounded-xl transition-all duration-200 ease-out" 
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#E2DDD5] space-y-3">
            <div className="flex items-center justify-center space-x-1.5 text-[11px] font-semibold text-[#A85D4C]">
              <Sparkles className="w-3 h-3 text-[#A85D4C]" />
              <span>Quick Demo Credentials</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <Button 
                variant="secondary" 
                onClick={() => handleDemoLogin('learner')} 
                type="button"
                className="bg-[#EFEBE4] hover:bg-[#FFFDF9] hover:border-[#A85D4C]/60 hover:text-[#7D4036] text-[#292B2B] text-xs font-semibold border border-[#E2DDD5] flex items-center justify-center gap-1.5 cursor-pointer h-9 rounded-xl transition-all duration-200 ease-out"
              >
                <User className="w-3.5 h-3.5 text-[#A85D4C]" />
                <span>Learner Demo</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleDemoLogin('admin')} 
                type="button"
                className="bg-[#EFEBE4] hover:bg-[#FFFDF9] hover:border-[#A85D4C]/60 hover:text-[#7D4036] text-[#292B2B] text-xs font-semibold border border-[#E2DDD5] flex items-center justify-center gap-1.5 cursor-pointer h-9 rounded-xl transition-all duration-200 ease-out"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D3030]" />
                <span>Admin Demo</span>
              </Button>
            </div>

            <div className="pt-1 text-center">
              <Link 
                to="/onboarding" 
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A85D4C] hover:text-[#7D4036] transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                <span>Open Role & Framework Onboarding Wizard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
