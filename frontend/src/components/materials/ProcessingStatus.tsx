import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export default function ProcessingStatus({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { label: 'Document Uploaded' },
    { label: 'Text Extracted' },
    { label: 'Topics Identified' },
    { label: 'Competencies Mapped' }
  ];

  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= steps.length) {
        clearInterval(interval);
        setTimeout(onComplete, 1000);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="py-6">
      <div className="flex justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-[#D8E5EC] -z-10" />
        
        {/* Active line */}
        <div 
          className="absolute top-5 left-0 h-1 bg-[#176B87] -z-10 transition-all duration-500" 
          style={{ width: `${(Math.min(currentStep, steps.length - 1) / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step.label} className="flex flex-col items-center">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 bg-[#FFFFFF] transition-colors duration-300",
                isCompleted ? "border-[#2E8B57] text-[#2E8B57]" : 
                isCurrent ? "border-[#176B87] text-[#176B87]" : "border-[#D8E5EC] text-[#7A8C98]"
              )}>
                {isCompleted ? (
                  <Check className="w-5 h-5 text-[#2E8B57]" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#176B87]" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "mt-3 text-xs font-medium text-center w-24",
                isCompleted || isCurrent ? "text-[#123047] font-bold" : "text-[#5D7180]"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

