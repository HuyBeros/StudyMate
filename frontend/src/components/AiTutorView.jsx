import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Network, 
  FileText, 
  UploadCloud, 
  ArrowRight, 
  FileCode2, 
  Bot,
  Brain
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AiTutorView({ history, onOpenQuizModal, onOpenMindmapModal, onOpenSummaryModal }) {
  const { t } = useTranslation('ai');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onOpenSummaryModal(file.name);
    }, 1800);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Large Hero AI Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent pointer-events-none"></div>
        
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-blue-100 border border-white/20">
            <Bot className="w-4 h-4" /> AI Tutor Workspace
          </div>

          <h2 className="font-['Be_Vietnam_Pro'] font-extrabold text-3xl sm:text-4xl leading-tight">
            {t('heroGreeting')}
          </h2>

          <p className="text-blue-100 text-sm font-medium leading-relaxed">
            {t('heroDesc')}
          </p>

          <div className="pt-2">
            <button 
              onClick={() => onOpenQuizModal()}
              className="bg-white hover:bg-blue-50 text-blue-600 font-['Inter'] font-bold text-sm py-3 px-6 rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('exploreBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3 Main AI Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: AI Quiz */}
        <div
          onClick={() => onOpenQuizModal()}
          className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-6 card-hover-effect"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t('quiz_title')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                {t('quiz_desc')}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#172136] group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Card 2: Mindmap */}
        <div
          onClick={() => onOpenMindmapModal()}
          className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-6 card-hover-effect"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Network className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t('mindmap_title')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                {t('mindmap_desc')}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#172136] group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Card 3: Summary */}
        <div
          onClick={() => onOpenSummaryModal("preview.pdf")}
          className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-6 card-hover-effect"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t('summary_title')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                {t('summary_desc')}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#172136] group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* 3. Drag & Drop Upload Zone */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[1.01]' 
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C32] hover:border-blue-300 dark:hover:border-blue-600'
        }`}
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
            <UploadCloud className={`w-8 h-8 ${isProcessing ? 'animate-bounce' : ''}`} />
          </div>

          <div>
            <h4 className="font-['Be_Vietnam_Pro'] font-bold text-slate-900 dark:text-white text-lg">
              {t('uploadTitle')}
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              {t('uploadDesc')}
            </p>
          </div>

          <div>
            <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-['Inter'] font-bold text-sm py-3 px-6 rounded-2xl shadow-md shadow-blue-500/25 cursor-pointer transition-all hover:scale-105 active:scale-95">
              <span>{t('uploadBtn')}</span>
              <input 
                type="file" 
                accept=".pdf,.docx,.pptx,.png,.jpg" 
                onChange={handleFileChange}
                className="hidden" 
              />
            </label>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 pt-2 animate-pulse">
              <Brain className="w-4 h-4" />
              <span>{t('processing')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Recent Processed History List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
            {t('recentHistory')}
          </h3>
          {history.length > 0 && (
            <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              {t('viewAll')}
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="bg-white dark:bg-[#111C32] rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-2">
            <Bot className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Chưa có tài liệu nào được xử lý
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Tải tài liệu lên hoặc dùng các tính năng AI phía trên để bắt đầu!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#111C32] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#172136] flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                    <FileCode2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-['Be_Vietnam_Pro'] font-bold text-slate-900 dark:text-white text-sm">
                      {item.title}
                    </h4>
                    <p className="text-slate-400 dark:text-slate-400 text-xs font-medium">
                      {item.action} • {item.timeAgo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onOpenSummaryModal(item.title)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#172136] hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs transition-colors"
                  >
                    {t('viewResult')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
