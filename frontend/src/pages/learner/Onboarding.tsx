import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roleApi, userApi } from '@/lib/api';
import { Role, RoleCompetencyItem, Department } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  Briefcase, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Target, 
  Award, 
  Clock, 
  ChevronRight,
  Info
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();

  // Data states
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleCompetencies, setRoleCompetencies] = useState<RoleCompetencyItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [experienceYears, setExperienceYears] = useState<number>(3);
  const [selectedWorkAreas, setSelectedWorkAreas] = useState<string[]>([]);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingComp, setLoadingComp] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  const workAreaOptions = [
    'Survey Sampling & Design',
    'National Sample Surveys (NSS)',
    'Registry Validation & Quality Audits',
    'Macroeconomic Accounting (GDP/CPI)',
    'Data Cleaning & Imputation',
    'Statistical Modeling (R/Python)',
    'Field Enumeration & Verification'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rolesRes, deptsRes] = await Promise.all([
          roleApi.getAll(),
          userApi.getDepartments()
        ]);
        setRoles(rolesRes.data);
        setDepartments(deptsRes.data);

        // Select first role by default
        if (rolesRes.data && rolesRes.data.length > 0) {
          const first = rolesRes.data[0];
          setSelectedRole(first);
          fetchRoleCompetencies(first.id);
        }
        if (deptsRes.data && deptsRes.data.length > 0) {
          setSelectedDeptId(deptsRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load onboarding options:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchRoleCompetencies = async (roleId: number) => {
    try {
      setLoadingComp(true);
      const res = await roleApi.getCompetencies(roleId);
      setRoleCompetencies(res.data);
    } catch (err) {
      console.error('Failed to fetch role competencies:', err);
    } finally {
      setLoadingComp(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    fetchRoleCompetencies(role.id);
  };

  const toggleWorkArea = (area: string) => {
    setSelectedWorkAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleFinishOnboarding = async (startAssessment: boolean = true) => {
    if (!selectedRole) return;
    try {
      setSubmitting(true);
      await userApi.completeOnboarding({
        role_id: selectedRole.id,
        department_id: selectedDeptId || undefined,
        experience_years: experienceYears,
        work_areas: selectedWorkAreas
      });

      if (startAssessment) {
        navigate('/assessment');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#0B2545]">Loading professional framework options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FA] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Title Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
            <span>Professional Capability Framework</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#102A43] tracking-tight leading-tight">
            Let's personalize your learning journey.
          </h1>
          <p className="text-[#62748A] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Select your official designation to benchmark required competencies for India's Statistical System. 
            Scores are derived purely from assessment evidence—never self-reported.
          </p>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto">
          {[
            { num: 1, label: 'Official Role' },
            { num: 2, label: 'Department & Experience' },
            { num: 3, label: 'Capability Framework' }
          ].map(step => (
            <button
              key={step.num}
              onClick={() => setActiveStep(step.num)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeStep === step.num
                  ? 'bg-[#0B2545] text-[#FFFFFF] shadow-sm ring-2 ring-[#0B2545]/20'
                  : activeStep > step.num
                  ? 'bg-[#2E7D32]/15 text-[#2E7D32] border border-[#2E7D32]/30'
                  : 'bg-[#FFFFFF] text-[#62748A] border border-[#DCE5EA] hover:bg-[#EEF5F7]'
              }`}
            >
              <span>{step.num}</span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </div>

        {/* STEP 1: Role Selection */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <Card className="bg-[#FFFFFF] border border-[#DCE5EA] shadow-sm rounded-2xl">
              <CardHeader className="border-b border-[#DCE5EA] pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-left">
                    <CardTitle className="text-lg sm:text-xl font-semibold text-[#102A43] flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#1F7A8C]" /> Step 1: Select your professional role
                    </CardTitle>
                    <CardDescription className="text-sm text-[#62748A]">
                      This helps us personalize your competency framework and learning path.
                    </CardDescription>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#1F7A8C] px-2.5 py-1 bg-[#1F7A8C]/10 rounded-md border border-[#1F7A8C]/20">
                    {roles.length} Cadres
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {roles.map(role => {
                    const isSelected = selectedRole?.id === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleRoleSelect(role)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#1F7A8C]/5 border-[#1F7A8C] ring-2 ring-[#1F7A8C]/20 shadow-xs'
                            : 'bg-[#FFFFFF] border-[#2B2D42]/15 hover:border-[#1F7A8C]/40 hover:bg-[#F4F6F9]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-[#0B2545]">{role.name}</h3>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-[#1F7A8C]" />
                              )}
                            </div>
                            <p className="text-xs text-[#2B2D42] leading-relaxed">
                              {role.description || 'Core official statistical role.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setActiveStep(2)}
                    className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold px-6"
                  >
                    Continue to Department <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2: Department & Experience */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-sm">
              <CardHeader className="border-b border-[#2B2D42]/10 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#1F7A8C]" /> Step 2: Department & Experience
                  </CardTitle>
                  <CardDescription className="text-xs text-[#2B2D42]">
                    Contextual information to tailor practice materials and operational workflows.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Department Grid */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#0B2545] uppercase tracking-wider block">
                    Organization Division / Department
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {departments.map(dept => {
                      const isSelected = selectedDeptId === dept.id;
                      return (
                        <div
                          key={dept.id}
                          onClick={() => setSelectedDeptId(dept.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#1F7A8C]/5 border-[#1F7A8C] ring-1 ring-[#1F7A8C]'
                              : 'bg-[#FFFFFF] border-[#2B2D42]/15 hover:border-[#1F7A8C]/30'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-[#0B2545]">{dept.name}</p>
                            <span className="text-[10px] font-mono text-[#2B2D42]/60 font-semibold uppercase">
                              Code: {dept.code}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1F7A8C]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Experience Slider */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0B2545] uppercase tracking-wider">
                      Years of Experience in Official Statistics
                    </label>
                    <span className="text-xs font-mono font-bold text-[#1F7A8C] bg-[#1F7A8C]/10 px-2.5 py-0.5 rounded-md">
                      {experienceYears} {experienceYears === 1 ? 'Year' : 'Years'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#2B2D42]/10 rounded-lg appearance-none cursor-pointer accent-[#1F7A8C]"
                  />
                  <div className="flex justify-between text-[10px] text-[#2B2D42]/50 font-mono font-semibold">
                    <span>Entry Level (0-1 yr)</span>
                    <span>Mid Career (5-10 yrs)</span>
                    <span>Senior (15+ yrs)</span>
                  </div>
                </div>

                {/* Self-Declared Work Context Tags (Optional) */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-[#0B2545] uppercase tracking-wider block">
                    Key Work Focus Areas <span className="text-[#2B2D42]/50 font-normal">(Optional context)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {workAreaOptions.map(area => {
                      const isSelected = selectedWorkAreas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleWorkArea(area)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            isSelected
                              ? 'bg-[#0B2545] text-[#FFFFFF] border-[#0B2545]'
                              : 'bg-[#F4F6F9] text-[#2B2D42] border-[#2B2D42]/15 hover:border-[#1F7A8C]/40'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-[#2B2D42]/10">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(1)}
                    className="text-xs font-bold border-[#2B2D42]/20"
                  >
                    Back to Roles
                  </Button>
                  <Button
                    onClick={() => setActiveStep(3)}
                    className="bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold px-6"
                  >
                    Review Framework <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Capability Framework Preview & Start Assessment */}
        {activeStep === 3 && (
          <div className="space-y-6">
            
            {/* Framework Details Card */}
            <Card className="bg-[#FFFFFF] border border-[#2B2D42]/10 shadow-sm">
              <CardHeader className="border-b border-[#2B2D42]/10 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#1F7A8C]" /> Step 3: Required Competency Framework
                    </CardTitle>
                    <CardDescription className="text-xs text-[#2B2D42]">
                      Official benchmarks calibrated for <strong>{selectedRole?.name}</strong>.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0B2545] bg-[#F4F6F9] border border-[#2B2D42]/10 px-3 py-1 rounded-md">
                      Role: {selectedRole?.name}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Notice Box on Assessment Evidence Rule */}
                <div className="p-3.5 rounded-xl bg-[#1F7A8C]/5 border border-[#1F7A8C]/20 flex items-start gap-3">
                  <Info className="w-4 h-4 text-[#1F7A8C] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#2B2D42] space-y-1 leading-relaxed">
                    <p className="font-bold text-[#0B2545]">Strict Evidence-Based Profiling:</p>
                    <p>
                      Your initial competency profile will show as <strong>"Not yet assessed"</strong>. 
                      Once you complete the baseline assessment, your score and gap analysis will be derived directly from your answers.
                    </p>
                  </div>
                </div>

                {/* Dynamic Competency Targets List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#2B2D42]/70 uppercase tracking-wider px-2">
                    <span>Competency Domain</span>
                    <span>Target Benchmark</span>
                  </div>
                  
                  {loadingComp ? (
                    <div className="py-8 text-center text-xs text-[#2B2D42]">Loading official benchmarks...</div>
                  ) : (
                    <div className="grid gap-2.5">
                      {roleCompetencies.map(rc => (
                        <div
                          key={rc.competency_id}
                          className="p-3 rounded-xl bg-[#F4F6F9] border border-[#2B2D42]/10 flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-[#0B2545]">{rc.competency_name}</p>
                            <span className="text-[10px] font-mono text-[#2B2D42]/60">
                              Level {rc.target_level} • Weight {rc.weight}x
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-[#0B2545] bg-[#FFFFFF] px-2.5 py-1 rounded-md border border-[#2B2D42]/10">
                              Target: {rc.target_score}%
                            </span>
                            <span className="text-[11px] font-bold text-[#2B2D42]/50 bg-[#2B2D42]/5 px-2 py-0.5 rounded">
                              Not Assessed
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Final Call to Action Section */}
                <div className="p-6 rounded-2xl bg-[#0B2545] text-[#FFFFFF] space-y-4 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#FFFFFF]">Ready to establish your competency baseline?</h3>
                    <p className="text-xs text-[#FFFFFF]/80 leading-relaxed">
                      The baseline assessment adapts to your role, evaluating your proficiency across the {roleCompetencies.length} required competencies.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <Button
                      onClick={() => handleFinishOnboarding(true)}
                      disabled={submitting}
                      className="w-full sm:w-auto bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold px-8 shadow-xs"
                    >
                      {submitting ? 'Saving Profile...' : 'Start Baseline Assessment'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleFinishOnboarding(false)}
                      disabled={submitting}
                      className="w-full sm:w-auto text-xs font-bold text-[#FFFFFF] border-[#FFFFFF]/20 hover:bg-[#FFFFFF]/10 hover:text-[#FFFFFF]"
                    >
                      Go to Dashboard First
                    </Button>
                  </div>
                </div>

                {/* Back Button */}
                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(2)}
                    className="text-xs font-bold border-[#2B2D42]/20"
                  >
                    Back to Department & Experience
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
