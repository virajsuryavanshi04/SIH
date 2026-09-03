import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseApi, competencyApi, roleApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, Globe, Search, Sparkles, BookOpen, Layers, Award, Filter, Target } from 'lucide-react';
import CourseCard from '@/components/courses/CourseCard';

export default function Courses() {
  const [searchParams] = useSearchParams();
  const focusedCourseId = searchParams.get('course_id') || searchParams.get('courseId');
  const focusedCompId = searchParams.get('competency_id') || searchParams.get('competencyId');
  const hasAutoScrolled = useRef<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'recommended' | 'all'>('recommended');
  const [courses, setCourses] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [compFilter, setCompFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        setLoading(true);
        const [recsRes, compRes, rolesRes] = await Promise.all([
          viewMode === 'recommended' ? courseApi.getRecommended() : courseApi.getAll(),
          competencyApi.getAll(),
          roleApi.getAll()
        ]);
        setCourses(recsRes.data || []);
        setCompetencies(compRes.data || []);
        setRoles(rolesRes.data || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoursesData();
  }, [viewMode]);

  // Automatic smooth scroll to focused priority course on initial render
  useEffect(() => {
    if (!loading && focusedCourseId && !hasAutoScrolled.current && courses.length > 0) {
      hasAutoScrolled.current = true;
      const targetElement = document.getElementById(`course-card-${focusedCourseId}`);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetElement.focus();
        }, 180);
      }
    }
  }, [loading, focusedCourseId, courses]);

  // Extract unique providers
  const providers = Array.from(new Set(courses.map(c => c.provider).filter(Boolean))).sort();

  const filteredCourses = courses.filter(c => {
    const compName = c.competency_name || c.competency || '';
    const matchesSearch = !search || 
      c.title?.toLowerCase().includes(search.toLowerCase()) || 
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase()) ||
      c.provider?.toLowerCase().includes(search.toLowerCase());
    
    const matchesComp = compFilter === 'all' || compName.toLowerCase().includes(compFilter.toLowerCase()) || (c.competency_id === Number(compFilter));
    const matchesProvider = providerFilter === 'all' || c.provider === providerFilter;

    return matchesSearch && matchesComp && matchesProvider;
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#A85D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#2D3030]">Loading curated iGOT Karmayogi catalogue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#A85D4C] uppercase tracking-widest mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>iGOT KARMAYOGI LEARNING CATALOGUE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D3030] tracking-tight">
            {viewMode === 'recommended' ? 'Personalized Learning Recommendations' : 'Official iGOT Course Catalogue'}
          </h1>
          <p className="text-xs sm:text-sm text-[#292B2B]/80 mt-1">
            Curated accredited courses aligned to SmartLearn competency benchmarks and official public governance roles.
          </p>
        </div>
        
        {/* Toggle Mode */}
        <div className="flex items-center bg-[#EFEBE4] p-1 rounded-xl border border-[#E2DDD5] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('recommended')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'recommended'
                ? 'bg-[#FFFDF9] text-[#A85D4C] shadow-xs'
                : 'text-[#7A756E] hover:text-[#292B2B]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Recommended
            </span>
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'all'
                ? 'bg-[#FFFDF9] text-[#A85D4C] shadow-xs'
                : 'text-[#7A756E] hover:text-[#292B2B]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              All iGOT (60)
            </span>
          </button>
        </div>
      </div>

      {/* Search & Multi-filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 p-4 sm:p-5 bg-[#FFFDF9] rounded-2xl shadow-xs border border-[#E2DDD5]">
        <div className="relative col-span-1 sm:col-span-1 lg:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756E] w-4 h-4" />
          <Input 
            placeholder="Search courses, providers, topics..." 
            className="pl-10 border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-[#A85D4C]/20 bg-[#FFFDF9] text-sm font-medium text-[#292B2B] h-10 rounded-xl" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        <Select value={compFilter} onValueChange={setCompFilter}>
          <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-sm font-medium text-[#292B2B] h-10 rounded-xl">
            <SelectValue placeholder="Filter Competency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All 20 Competencies</SelectItem>
            {competencies.map(comp => (
              <SelectItem key={comp.id} value={String(comp.id)}>{comp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-sm font-medium text-[#292B2B] h-10 rounded-xl">
            <SelectValue placeholder="Filter Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map(prov => (
              <SelectItem key={prov} value={prov}>{prov}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-[#292B2B] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#A85D4C]" />
            {viewMode === 'recommended' ? 'Ranked Recommendations' : 'Curated Course Directory'} ({filteredCourses.length})
          </h2>
          <span className="text-xs font-mono text-[#7A756E] font-semibold">
            {viewMode === 'recommended' ? 'Ranked by Deficit Impact' : '60 Accredited Modules'}
          </span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] space-y-3">
            <BookOpen className="w-8 h-8 text-[#7A756E]/30 mx-auto" />
            <p className="text-sm font-bold text-[#292B2B]">No matching iGOT courses found</p>
            <p className="text-xs text-[#7A756E]">Try resetting your search keyword or filters.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredCourses.map(course => {
              const isTargetCourse = Boolean(
                focusedCourseId && 
                (String(course.id) === String(focusedCourseId) || 
                 String(course.course_id) === String(focusedCourseId) ||
                 String(course.igot_identifier) === String(focusedCourseId) ||
                 String(course.external_id) === String(focusedCourseId))
              );

              return (
                <CourseCard 
                  key={course.id || course.igot_identifier} 
                  course={course} 
                  isPriorityFocus={isTargetCourse}
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
