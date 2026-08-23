import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Sigma, 
  Atom, 
  Languages, 
  Code2, 
  FileText, 
  Folder,
  BookOpen,
  Pencil,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const iconMap = {
  Sigma: Sigma,
  Atom: Atom,
  Languages: Languages,
  Code2: Code2
};

export default function SubjectsView({ subjects, onOpenNewSubject, onEditSubject, onDeleteSubject, onSubjectClick }) {
  const { t } = useTranslation('subjects');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredSubjects = subjects.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'ALL' || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  const typeLabels = {
    ALL:        t('filter_all'),
    SCHOOL:     t('filter_school'),
    SELF_STUDY: t('filter_self'),
    LANGUAGE:   t('filter_lang'),
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto" onClick={() => setOpenMenuId(null)}>
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="font-['Be_Vietnam_Pro'] font-bold text-3xl text-slate-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-['Be_Vietnam_Pro'] font-medium text-sm max-w-2xl leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C32] hover:bg-slate-50 dark:hover:bg-slate-800 font-['Inter'] font-bold text-sm text-slate-700 dark:text-slate-200 shadow-2xs transition-all">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{t('filter')}</span>
          </button>
          
          <button 
            onClick={onOpenNewSubject}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-['Inter'] font-bold text-sm shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>{t('addSubject')}</span>
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#111C32] p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pl-10 pr-4 py-2 rounded-xl outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'SCHOOL', 'SELF_STUDY', 'LANGUAGE'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-1.5 rounded-xl font-['Inter'] text-xs font-bold transition-all ${
                selectedType === type
                  ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Subjects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject) => {
          const IconComp = iconMap[subject.icon] || BookOpen;
          return (
            <div
              key={subject.id}
              onClick={() => onSubjectClick && onSubjectClick(subject.id)}
              className="cursor-pointer bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6 group card-hover-effect relative"
            >
              <div className="space-y-4">
                {/* Icon & 3-dot Menu Header */}
                <div className="flex items-center justify-between">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === subject.id ? null : subject.id);
                      }}
                      className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {openMenuId === subject.id && (
                      <div 
                        className="absolute right-0 top-10 w-44 bg-white dark:bg-[#172136] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            if (onEditSubject) onEditSubject(subject);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Chỉnh sửa môn học</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            if (onDeleteSubject) onDeleteSubject(subject);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 transition-colors border-t border-slate-100 dark:border-slate-800/80"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <span>Xóa môn học</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
                    {subject.description}
                  </p>
                </div>
              </div>

              {/* Progress & Document Counts */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400 font-['Inter']">{t('progress')}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-['Manrope'] font-bold">{subject.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${subject.progress}%`, backgroundColor: subject.color }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
                  <div className="flex items-center gap-1.5">
                    <Folder className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{subject.totalDocuments || 0} {t('documents')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>{subject.totalNotes || 0} {t('notes')}</span>
                  </div>
                </div>

                {/* Explicit View Detail Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSubjectClick && subject.id != null) {
                      onSubjectClick(subject.id);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all group-hover:bg-blue-600 group-hover:text-white"
                >
                  <span>Xem chi tiết môn học</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add New Subject Card */}
        <div
          onClick={onOpenNewSubject}
          className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-blue-50/40 dark:hover:bg-slate-900/50 group min-h-[280px]"
        >
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
            <Plus className="w-8 h-8" />
          </div>
          <h4 className="font-['Be_Vietnam_Pro'] font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {t('addSubjectCard')}
          </h4>
          <p className="text-slate-400 text-xs font-medium mt-1 max-w-xs">
            {t('addSubjectHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
