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
          <div className="w-9 h-9 border-3 border-[#1F7A8C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#0B2545]">Curating personalized iGOT & official learning resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#1F7A8C] uppercase tracking-widest mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>ACCREDITED LEARNING REPOSITORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight">
            Personalized Learning Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#2B2D42]/80 mt-1">
            Ranked by your diagnosed competency gaps, weak subtopics, and official role benchmark requirements.
          </p>
        </div>
        
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
          <span>Explainable Weighted Ranking Active</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FFFFFF] rounded-xl shadow-xs border border-[#2B2D42]/10">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2B2D42]/60 w-4 h-4" />
          <Input 
            placeholder="Search resources, topics..." 
            className="pl-10 border-[#2B2D42]/20 focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF] text-xs font-medium" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="border-[#2B2D42]/20 bg-[#FFFFFF] text-xs font-medium">
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
          <SelectTrigger className="border-[#2B2D42]/20 bg-[#FFFFFF] text-xs font-medium">
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1F7A8C]" />
            Recommended Resources ({filteredCourses.length})
          </h2>
          <span className="text-xs font-mono text-[#2B2D42]/60 font-semibold">
            Ranked by Deficit Impact
          </span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#2B2D42]/10 space-y-3">
            <BookOpen className="w-8 h-8 text-[#2B2D42]/30 mx-auto" />
            <p className="text-sm font-bold text-[#0B2545]">No matching learning resources found</p>
            <p className="text-xs text-[#2B2D42]/60">Try adjusting your keyword filter or competency selection.</p>
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
