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
} from "lucide-react";
import { TabSection } from "../types";

interface BottomNavProps {
  currentTab: TabSection;
  onSelectTab: (tab: TabSection) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems: { id: TabSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "geral", label: "Geral", icon: Home },
    { id: "trabalhos", label: "Trab.", icon: FileText },
    { id: "provas", label: "Provas", icon: TestTube },
    { id: "aulas", label: "Aulas", icon: BookOpen },
    { id: "horarios", label: "Horário", icon: Clock },
    { id: "calendario", label: "Calend.", icon: CalendarIcon },
    { id: "ementa", label: "Ementa", icon: FileSpreadsheet },
    { id: "config", label: "Config", icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 px-2 shadow-lg">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`shrink-0 flex flex-col items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all min-w-[62px] ${
                isActive
                  ? "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
              <span className="text-[11px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
