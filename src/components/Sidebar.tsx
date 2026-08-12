import React from "react";
import {
  Home,
  FileText,
  TestTube,
  BookOpen,
  Clock,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Moon,
  Sun,
  Flame,
  RotateCcw,
} from "lucide-react";
import { TabSection } from "../types";

interface SidebarProps {
  currentTab: TabSection;
  onSelectTab: (tab: TabSection) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAITutor: () => void;
  onOpenPomodoro: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  darkMode,
  onToggleDarkMode,
  onOpenAITutor,
  onOpenPomodoro,
}) => {
  const navItems: { id: TabSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "geral", label: "Geral", icon: Home },
    { id: "trabalhos", label: "Trabalhos", icon: FileText },
    { id: "provas", label: "Provas", icon: TestTube },
    { id: "aulas", label: "Aulas & Notas", icon: BookOpen },
    { id: "horarios", label: "Horários", icon: Clock },
    { id: "calendario", label: "Calendário", icon: CalendarIcon },
    { id: "reposicoes", label: "Reposições", icon: RotateCcw },
    { id: "ementa", label: "Ementas", icon: FileSpreadsheet },
    { id: "config", label: "Configurações", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800 p-4 flex-col h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-3.5 rounded-2xl mb-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-slate-900 dark:text-white text-base tracking-tight">
              Painel Acadêmico
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Planner Operacional
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Offline & Local
          </span>
          <span className="text-slate-400 font-semibold">v2.5 Pro</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={onOpenAITutor}
          className="flex items-center justify-center gap-1.5 p-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm group"
        >
          <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          Tutor IA
        </button>
        <button
          onClick={onOpenPomodoro}
          className="flex items-center justify-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          Pomodoro
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 mt-auto flex items-center justify-between text-xs">
        <button
          onClick={onToggleDarkMode}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
          <span>{darkMode ? "Tema Claro" : "Tema Escuro"}</span>
        </button>
        <span className="text-slate-400 text-[10px]">2026 Academic</span>
      </div>
    </aside>
  );
};
