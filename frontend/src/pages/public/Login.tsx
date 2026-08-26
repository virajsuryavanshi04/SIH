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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F4F6F9] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Card className="w-full max-w-md shadow-md border border-[#2B2D42]/10 relative z-10 bg-[#FFFFFF]">
        <CardHeader className="space-y-3 text-center pb-6 border-b border-[#2B2D42]/10">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#0B2545] flex items-center justify-center text-[#FFFFFF] shadow-sm">
              <Brain className="w-8 h-8 text-[#1F7A8C]" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-[#0B2545]">Official Portal Access</CardTitle>
            <CardDescription className="text-[#2B2D42]/60 mt-1">SmartLearn Competency Intelligence System</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#2B2D42]">Official Email Address</label>
              <Input 
                type="email" 
                placeholder="officer@gov.in" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-[#2B2D42]/20 focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF]" 
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#2B2D42]">Password</label>
              <Input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#2B2D42]/20 focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF]" 
                required
              />
            </div>
            <Button type="submit" className="w-full font-bold bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] shadow-xs mt-2 cursor-pointer" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2B2D42]/10 space-y-3">
            <div className="flex items-center justify-center space-x-2 text-xs font-bold text-[#1F7A8C]">
              <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
              <span>Quick Demo Credentials</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <Button 
                variant="secondary" 
                onClick={() => handleDemoLogin('learner')} 
                className="text-xs py-2 h-auto flex items-center justify-center space-x-1.5 shadow-2xs font-semibold"
              >
                <User className="w-3.5 h-3.5 text-[#1F7A8C]" />
                <span>Learner (Arjun)</span>
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => handleDemoLogin('admin')} 
                className="text-xs py-2 h-auto flex items-center justify-center space-x-1.5 shadow-2xs font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#1F7A8C]" />
                <span>Admin (Manager)</span>
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
