import React, { useState, useEffect } from 'react';
import { courseApi, competencyApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, Globe, Search, Sparkles, BookOpen, Layers, Award } from 'lucide-react';
import CourseCard from '@/components/courses/CourseCard';

export default function Courses() {
  const [loading, setLoading] = useState<boolean>(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        setLoading(true);
        const [recsRes, compRes] = await Promise.all([
          courseApi.getRecommended(),
          competencyApi.getAll()
        ]);
        setCourses(recsRes.data || []);
        setCompetencies(compRes.data || []);
      } catch (err) {
        console.error('Failed to load recommended courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoursesData();
  }, []);

  const filteredCourses = courses.filter(c => {
    const compName = c.competency_name || '';
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase()) ||
                          compName.toLowerCase().includes(search.toLowerCase());
    
    const matchesComp = filter === 'all' || compName.toLowerCase().includes(filter.toLowerCase()) || (c.competency_id === Number(filter));
    const matchesType = resourceTypeFilter === 'all' || c.resource_type === resourceTypeFilter;

    return matchesSearch && matchesComp && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#A85D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#2D3030]">Curating personalized iGOT & official learning resources...</p>
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
            <span>ACCREDITED LEARNING REPOSITORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D3030] tracking-tight">
            Personalized Learning Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#292B2B]/80 mt-1">
            Ranked by your diagnosed competency gaps, weak subtopics, and official role benchmark requirements.
          </p>
        </div>
        
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#A85D4C]/10 text-[#A85D4C] border border-[#A85D4C]/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#A85D4C]" />
          <span>Explainable Weighted Ranking Active</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 sm:p-5 bg-[#FFFDF9] rounded-2xl shadow-xs border border-[#E2DDD5]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A756E] w-4 h-4" />
          <Input 
            placeholder="Search resources, topics..." 
            className="pl-10 border-[#E2DDD5] focus:border-[#A85D4C] focus:ring-[#A85D4C]/20 bg-[#FFFDF9] text-sm font-medium text-[#292B2B] h-10 rounded-xl" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-sm font-medium text-[#292B2B] h-10 rounded-xl">
            <SelectValue placeholder="Filter Competency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Competencies</SelectItem>
            {competencies.map(comp => (
              <SelectItem key={comp.id} value={String(comp.id)}>{comp.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
          <SelectTrigger className="border-[#E2DDD5] bg-[#FFFDF9] text-sm font-medium text-[#292B2B] h-10 rounded-xl">
            <SelectValue placeholder="Resource Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resource Types</SelectItem>
            <SelectItem value="course">iGOT Comprehensive Courses</SelectItem>
            <SelectItem value="igot_microlearning">iGOT Micro-Learning</SelectItem>
            <SelectItem value="smartlearn_material">SmartLearn Labs & Modules</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-[#292B2B] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#A85D4C]" />
            Recommended Resources ({filteredCourses.length})
          </h2>
          <span className="text-xs font-mono text-[#7A756E] font-semibold">
            Ranked by Deficit Impact
          </span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFDF9] rounded-2xl border border-[#E2DDD5] space-y-3">
            <BookOpen className="w-8 h-8 text-[#7A756E]/30 mx-auto" />
            <p className="text-sm font-bold text-[#292B2B]">No matching learning resources found</p>
            <p className="text-xs text-[#7A756E]">Try adjusting your keyword filter or competency selection.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
