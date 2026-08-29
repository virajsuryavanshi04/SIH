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
    <div className="flex-1 flex items-center justify-center bg-[#F7F4EE] py-6 px-4 sm:px-6 lg:px-8 relative">
      <Card className="w-full max-w-md shadow-md border border-[#E2DDD5] relative z-10 bg-[#FFFDF9] rounded-2xl">
        <CardHeader className="space-y-2.5 text-center p-5 pb-4 border-b border-[#E2DDD5]">
          <div className="flex items-center justify-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#A85D4C] flex items-center justify-center text-[#FFFDF9] shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#292B2B]">SmartLearn</span>
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-[#292B2B]">Official Portal Access</CardTitle>
            <CardDescription className="text-xs text-[#7A756E] mt-0.5">SmartLearn Competency Intelligence System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-4 space-y-3.5">
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#292B2B]">Official Email Address</label>
              <Input 
                type="email" 
                placeholder="officer@gov.in" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-[#A85D4C]/20 bg-[#FFFDF9] text-xs text-[#292B2B] h-9" 
                required
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#292B2B]">Password</label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-[#A85D4C]/20 bg-[#FFFDF9] text-xs text-[#292B2B] h-9" 
                required
              />
            </div>
            <Button type="submit" className="w-full font-semibold text-xs bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] shadow-xs mt-1.5 cursor-pointer h-9" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </Button>
          </form>

          <div className="mt-3.5 pt-3.5 border-t border-[#E2DDD5] space-y-2.5">
            <div className="flex items-center justify-center space-x-1.5 text-[11px] font-semibold text-[#A85D4C]">
              <Sparkles className="w-3 h-3 text-[#A85D4C]" />
              <span>Quick Demo Credentials</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="secondary" 
                onClick={() => handleDemoLogin('learner')} 
                type="button"
                className="bg-[#EFEBE4] hover:bg-[#EFEBE4]/80 text-[#292B2B] text-xs font-semibold border border-[#E2DDD5] flex items-center justify-center gap-1.5 cursor-pointer h-8.5"
              >
                <User className="w-3.5 h-3.5 text-[#A85D4C]" />
                <span>Learner Demo</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleDemoLogin('admin')} 
                type="button"
                className="bg-[#EFEBE4] hover:bg-[#EFEBE4]/80 text-[#292B2B] text-xs font-semibold border border-[#E2DDD5] flex items-center justify-center gap-1.5 cursor-pointer h-8.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D3030]" />
                <span>Admin Demo</span>
              </Button>
            </div>

            <div className="pt-1 text-center">
              <Link 
                to="/onboarding" 
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A85D4C] hover:text-[#2D3030] transition-colors"
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
