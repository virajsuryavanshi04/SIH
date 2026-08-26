import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, CheckCircle } from 'lucide-react';
import GeneratedQuestionCard from './GeneratedQuestionCard';

export default function QuestionGenerator() {
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setQuestions([
        {
          id: 1,
          text: "Based on the manual, what is the primary purpose of stratification in the National Survey?",
          competency_tag: "Sampling Techniques",
          difficulty: "Intermediate",
          explanation: "Section 4.2 states stratification is used to ensure adequate representation of all subgroups.",
          options: [
            { text: "To reduce data collection costs", is_correct: false },
            { text: "To ensure adequate representation of all subgroups", is_correct: true },
            { text: "To simplify the data entry process", is_correct: false },
            { text: "To eliminate non-response bias", is_correct: false }
          ]
        }
      ]);
    }, 2000);
  };

  if (questions.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/30 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#2E7D32]" />
            <span className="font-bold">Successfully generated 10 questions</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setQuestions([])}>Configure Again</Button>
        </div>
        
        <div className="space-y-6">
          {questions.map((q) => (
            <GeneratedQuestionCard key={q.id} question={q} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#0B2545]">Number of Questions</label>
          <Select defaultValue="10">
            <SelectTrigger className="border-[#2B2D42]/20 bg-[#FFFFFF]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 Questions</SelectItem>
              <SelectItem value="10">10 Questions</SelectItem>
              <SelectItem value="20">20 Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-bold text-[#0B2545]">Target Difficulty</label>
          <Select defaultValue="mixed">
            <SelectTrigger className="border-[#2B2D42]/20 bg-[#FFFFFF]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button size="lg" className="w-full bg-[#1F7A8C] hover:bg-[#1F7A8C]/90 text-[#FFFFFF] font-bold shadow-xs cursor-pointer" onClick={handleGenerate} disabled={generating}>
        {generating ? 'AI Generating Questions...' : <><Sparkles className="w-4 h-4 mr-2" /> Generate Assessment</>}
      </Button>
    </div>
  );
}
