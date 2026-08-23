import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Sparkles, Brain, Code2 } from 'lucide-react';

export default function AiLoadingState({ isVisible, type }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Đang đọc tài liệu', icon: <Code2 className="w-5 h-5" /> },
    { title: 'Phân tích ngữ cảnh', icon: <Brain className="w-5 h-5" /> },
    { title: type === 'quiz' ? 'Đang soạn câu hỏi' : type === 'mindmap' ? 'Đang tạo sơ đồ' : 'Đang tóm tắt', icon: <Sparkles className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      const timer1 = setTimeout(() => setCurrentStep(1), 3000);
      const timer2 = setTimeout(() => setCurrentStep(2), 7000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 flex flex-col items-center">
        
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-[#111C32] p-1 rounded-full">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
        </div>

        <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white mb-6">
          AI đang xử lý...
        </h3>

        <div className="w-full space-y-4">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isActive = currentStep === idx;
            const isPending = currentStep < idx;

            return (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50' :
                  isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 ring-2 ring-blue-500/20' :
                  'bg-slate-100 text-slate-400 dark:bg-slate-800'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm transition-colors duration-500 ${
                    isCompleted ? 'text-emerald-600 dark:text-emerald-400' :
                    isActive ? 'text-blue-600 dark:text-blue-400' :
                    'text-slate-400'
                  }`}>
                    {step.title}
                  </p>
                  {isActive && (
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full w-1/2 animate-[progress_1.5s_ease-in-out_infinite]"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <p className="mt-8 text-xs text-slate-400 font-medium text-center">
          Quá trình này có thể mất từ 10 - 20 giây tuỳ vào độ dài tài liệu.
        </p>

        <style>{`
          @keyframes progress {
            0% { transform: translateX(-100%); width: 50%; }
            100% { transform: translateX(200%); width: 50%; }
          }
        `}</style>
      </div>
    </div>
  );
}
