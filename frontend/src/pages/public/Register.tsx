import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMsg('Full name is required.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid official email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: trimmedName,
        email: trimmedEmail,
        password: password,
        confirm_password: confirmPassword
      });

      toast({
        title: 'Account Created',
        description: 'Your official learner account was established successfully.'
      });

      await login(trimmedEmail, password);
      navigate('/onboarding');
    } catch (err: any) {
      const serverMsg = err.response?.data?.detail;
      const displayError = typeof serverMsg === 'string' 
        ? serverMsg 
        : 'Registration failed. Please verify your details or use a different email.';
      setErrorMsg(displayError);
      toast({
        title: 'Registration Failed',
        description: displayError,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F4EE] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative select-none my-auto">
      <Card className="w-full max-w-md shadow-[0_4px_24px_rgba(45,48,48,0.06)] border border-[#E2DDD5] relative z-10 bg-[#FFFDF9] rounded-2xl my-auto">
        <CardHeader className="space-y-2 text-center p-6 pb-4 border-b border-[#E2DDD5]">
          <div className="flex items-center justify-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#A85D4C] flex items-center justify-center text-[#FFFDF9] shadow-[0_1px_3px_rgba(168,93,76,0.3)]">
              <Brain className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#292B2B]">SmartLearn</span>
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-[#292B2B]">Create Learner Account</CardTitle>
            <CardDescription className="text-xs text-[#7A756E] mt-0.5">
              Statistical Cadre Professional Learning & Competency System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#A85D4C]/10 border border-[#A85D4C]/25 flex items-center gap-2.5 text-xs text-[#A85D4C]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#292B2B]">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Meera Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-2 focus:ring-[#A85D4C]/25 bg-[#FFFDF9] text-xs text-[#292B2B] h-10 rounded-xl transition-all duration-200 ease-out"
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#292B2B]">
                Official Email Address
              </label>
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
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#292B2B]">
                Password
              </label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-2 focus:ring-[#A85D4C]/25 bg-[#FFFDF9] text-xs text-[#292B2B] h-10 rounded-xl transition-all duration-200 ease-out"
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#292B2B]">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-2 focus:ring-[#A85D4C]/25 bg-[#FFFDF9] text-xs text-[#292B2B] h-10 rounded-xl transition-all duration-200 ease-out"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full font-semibold text-sm bg-[#A85D4C] hover:bg-[#7D4036] text-[#FFFDF9] shadow-xs mt-3 cursor-pointer h-10 rounded-xl transition-all duration-200 ease-out"
              disabled={loading}
            >
              {loading ? 'Creating Official Account...' : 'Register & Proceed to Onboarding'}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#E2DDD5] text-center space-y-2">
            <p className="text-xs text-[#7A756E]">
              Already registered in the Statistical Cadre?
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A85D4C] hover:text-[#7D4036] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sign In to Existing Portal Account</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
