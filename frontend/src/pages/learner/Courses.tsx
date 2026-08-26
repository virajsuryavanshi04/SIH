import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Clock, Globe, Search, Sparkles, BookOpen } from 'lucide-react';
import CourseCard from '@/components/courses/CourseCard';

export default function Courses() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const allCourses = [
    {
      id: 1,
      title: 'Survey Sampling Fundamentals & Design',
      description: 'Master stratified, cluster, and multi-stage sampling techniques configured for government statistical operations.',
      difficulty: 'Intermediate',
      duration_hours: 12,
      language: 'English',
      provider: 'National Statistical Training Institute',
      competencies: ['Sampling Techniques', 'Survey Methodology'],
      match_percent: 94,
      is_recommended: true,
      recommendation_reasons: [
        'Directly addresses your primary competency gap in Sampling Techniques',
        'Covers 3 required official statistical methodologies for Statistical Officers',
        'Practical case studies from National Sample Surveys'
      ]
    },
    {
      id: 2,
      title: 'Python for Statistical Analysis & Automation',
      description: 'Data manipulation with Pandas, statistical hypothesis testing, and automated reporting pipelines.',
      difficulty: 'Beginner',
      duration_hours: 10,
      language: 'English',
      provider: 'Indian Statistical Institute',
      competencies: ['Statistical Programming', 'Data Analysis'],
      match_percent: 88,
      is_recommended: true,
      recommendation_reasons: [
        'Closes your 27-point critical gap in Statistical Programming',
        'Teaches script automation for official data tabulations',
        'Includes reproducible notebook exercises'
      ]
    },
    {
      id: 3,
      title: 'Data Quality Validation & Audit Frameworks',
      description: 'Comprehensive error detection, anomaly scoring, and automated validation rules for census and administrative registries.',
      difficulty: 'Intermediate',
      duration_hours: 8,
      language: 'English',
      provider: 'Ministry of Statistics & Programme Implementation',
      competencies: ['Data Quality'],
      match_percent: 78,
      is_recommended: true,
      recommendation_reasons: [
        'Strengthens governance and quality metrics',
        'Aligns with upcoming departmental data audits'
      ]
    },
    {
      id: 4,
      title: 'Applied Regression Analysis & Modeling',
      description: 'Linear, logistic, and multivariate regression techniques applied to socioeconomic datasets.',
      difficulty: 'Advanced',
      duration_hours: 14,
      language: 'English',
      provider: 'National Statistical Training Institute',
      competencies: ['Statistical Methods', 'Data Analysis'],
      match_percent: 65,
      is_recommended: false,
      recommendation_reasons: ['Advanced mastery module for senior analysts']
    },
    {
      id: 5,
      title: 'Official Statistics Framework & National Accounts',
      description: 'Understanding GDP computation, CPI/IIP indexes, and international statistical standards.',
      difficulty: 'Foundational',
      duration_hours: 6,
      language: 'English',
      provider: 'Indian Statistical Institute',
      competencies: ['Data Interpretation'],
      match_percent: 60,
      is_recommended: false,
      recommendation_reasons: ['Foundational orientation on national accounting']
    }
  ];

  const filteredCourses = allCourses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || c.competencies.some(comp => comp.toLowerCase().includes(filter.toLowerCase()));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B2545] tracking-tight">Internal Course Catalog</h1>
          <p className="text-[#2B2D42] mt-1">AI-curated learning modules mapped directly to government statistical competencies.</p>
        </div>
        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1F7A8C]/10 text-[#1F7A8C] border border-[#1F7A8C]/20 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#1F7A8C]" />
          <span>Recommendations rank based on your diagnosed gaps</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-[#FFFFFF] rounded-xl shadow-xs border border-[#2B2D42]/10">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2B2D42]/60 w-4 h-4" />
          <Input 
            placeholder="Search statistical courses, keywords, or topics..." 
            className="pl-10 border-[#2B2D42]/20 focus:border-[#1F7A8C] focus:ring-[#1F7A8C]/20 bg-[#FFFFFF]" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[220px] border-[#2B2D42]/20 bg-[#FFFFFF]">
            <SelectValue placeholder="Filter Competency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Competencies</SelectItem>
            <SelectItem value="Sampling">Sampling Techniques</SelectItem>
            <SelectItem value="Survey">Survey Methodology</SelectItem>
            <SelectItem value="Programming">Statistical Programming</SelectItem>
            <SelectItem value="Quality">Data Quality</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#0B2545] mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1F7A8C]" />
          Recommended For You ({filteredCourses.filter(c => c.is_recommended).length})
        </h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
