import React from "react";
import { Search, Plus, Sparkles, Flame, Moon, Sun, LogIn, LogOut, Cloud } from "lucide-react";
import { User } from "firebase/auth";
import { TabSection } from "../types";

interface HeaderProps {
  currentTab: TabSection;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenQuickAdd: () => void;
  onOpenAITutor: () => void;
  onOpenPomodoro: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  searchQuery,
  onSearchChange,
  onOpenQuickAdd,
  onOpenAITutor,
  onOpenPomodoro,
  darkMode,
  onToggleDarkMode,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const titles: Record<TabSection, { title: string; subtitle: string }> = {
    geral: { title: "🏠 Visão Geral Operacional", subtitle: "Resumo diário e próximos prazos" },
    trabalhos: { title: "📝 Trabalhos & Entregas", subtitle: "Prazos, notas e tarefas acadêmicas" },
    provas: { title: "🧪 Avaliações & Provas", subtitle: "Datas, conteúdos e simulados gerados por IA" },
    aulas: { title: "📚 Disciplinas & Anotações", subtitle: "Aulas, ementas resumidas e cadernos" },
    horarios: { title: "🕒 Quadro de Horários", subtitle: "Grade semanal e comprovante em PDF" },
    calendario: { title: "📅 Calendário Acadêmico", subtitle: "Eventos, feriados e entregas" },
    reposicoes: { title: "🔄 Aulas de Reposição", subtitle: "Registro e controle de reposições pendentes e agendadas" },
    ementa: { title: "📄 Ementas de Matérias", subtitle: "Documentos e programas de disciplina" },
    config: { title: "⚙️ Configurações & Backup", subtitle: "Exportação, importação e dados locais" },
  };

  const currentInfo = titles[currentTab] || { title: "Painel Acadêmico", subtitle: "" };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
      <div>
        <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {currentInfo.title}
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Global Search Bar */}
        <div className="relative flex-1 min-w-[140px] md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar trabalho, prova ou nota..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-colors"
          />
        </div>

        {/* Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>

        {/* Mobile Quick AI / Pomodoro Buttons */}
        <button
          onClick={onOpenAITutor}
          className="md:hidden p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold shrink-0"
          title="Tutor IA"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenPomodoro}
          className="md:hidden p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold shrink-0"
          title="Pomodoro"
        >
          <Flame className="w-4 h-4" />
        </button>

        {/* Firebase Auth Google Sign-In / Account */}
        {currentUser ? (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || "User"}
                className="w-5 h-5 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Cloud className="w-4 h-4 text-emerald-500" />
            )}
            <span className="hidden sm:inline max-w-[100px] truncate">
              {currentUser.displayName || currentUser.email || "Conectado"}
            </span>
            <button
              onClick={onLogout}
              title="Sair da conta Google"
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors text-emerald-700 dark:text-emerald-300"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs shrink-0"
            title="Entrar com Google para sincronização em nuvem"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Entrar com Google</span>
          </button>
        )}

        {/* Mobile Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold shrink-0"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </div>
    </header>
  );
};
