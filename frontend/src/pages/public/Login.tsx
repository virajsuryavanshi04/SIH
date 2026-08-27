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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F4F7FA] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Card className="w-full max-w-md shadow-md border border-[#DCE5EA] relative z-10 bg-[#FFFFFF] rounded-2xl">
        <CardHeader className="space-y-3 text-center pb-6 border-b border-[#DCE5EA]">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#0B2545] flex items-center justify-center text-[#FFFFFF] shadow-sm">
              <Brain className="w-8 h-8 text-[#1F7A8C]" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-[#102A43]">Official Portal Access</CardTitle>
            <CardDescription className="text-sm text-[#62748A] mt-1">SmartLearn Competency Intelligence System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#102A43]">Official Email Address</label>
              <Input 
                type="email" 
                placeholder="officer@gov.in" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#DCE5EA] focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF] text-sm text-[#102A43]" 
                required
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#102A43]">Password</label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#DCE5EA] focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF] text-sm text-[#102A43]" 
                required
              />
            </div>
            <Button type="submit" className="w-full font-semibold text-sm bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] shadow-xs mt-2 cursor-pointer h-10" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#DCE5EA] space-y-3">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-[#1F7A8C]">
              <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
              <span>Quick Demo Credentials</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <Button 
                variant="secondary" 
                onClick={() => handleDemoLogin('learner')} 
                type="button"
                className="bg-[#EEF5F7] hover:bg-[#EEF5F7]/80 text-[#102A43] text-xs font-semibold border border-[#DCE5EA] flex items-center justify-center gap-1.5 cursor-pointer h-9"
              >
                <User className="w-3.5 h-3.5 text-[#1F7A8C]" />
                <span>Learner Demo</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleDemoLogin('admin')} 
                type="button"
                className="bg-[#EEF5F7] hover:bg-[#EEF5F7]/80 text-[#102A43] text-xs font-semibold border border-[#DCE5EA] flex items-center justify-center gap-1.5 cursor-pointer h-9"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#0B2545]" />
                <span>Admin Demo</span>
              </Button>
            </div>

            <div className="pt-2 text-center">
              <Link 
                to="/onboarding" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F7A8C] hover:text-[#0B2545] transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
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
