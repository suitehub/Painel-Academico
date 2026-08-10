import React, { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
} from "lucide-react";
import { AppData, Trabalho, FiltroTipo } from "../types";
import { todayISO, isWithinNext7Days, isPast, getDueStatus, fmtBR } from "../lib/dateUtils";

interface TrabalhosSectionProps {
  appData: AppData;
  searchQuery: string;
  onSaveTrabalho: (t: Trabalho) => void;
  onDeleteTrabalho: (id: number) => void;
  onOpenModal: (type: "trabalho", payload?: any) => void;
}

export const TrabalhosSection: React.FC<TrabalhosSectionProps> = ({
  appData,
  searchQuery,
  onSaveTrabalho,
  onDeleteTrabalho,
  onOpenModal,
}) => {
  const [filter, setFilter] = useState<FiltroTipo>("ativos");
  const [selectedDisciplina, setSelectedDisciplina] = useState<number | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const hoje = todayISO();

  let list = [...appData.trabalhos];

  // Apply Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (t) =>
        t.titulo.toLowerCase().includes(q) ||
        t.descricao.toLowerCase().includes(q)
    );
  }

  // Apply Discipline Filter
  if (selectedDisciplina !== "all") {
    list = list.filter((t) => t.disciplinaId === selectedDisciplina);
  }

  // Apply Status Filter
  if (filter === "ativos") list = list.filter((t) => !t.concluido);
  if (filter === "hoje") list = list.filter((t) => !t.concluido && t.dataEntrega === hoje);
  if (filter === "7d") list = list.filter((t) => !t.concluido && isWithinNext7Days(t.dataEntrega));
  if (filter === "atrasados") list = list.filter((t) => !t.concluido && isPast(t.dataEntrega));
  if (filter === "concluidos") list = list.filter((t) => t.concluido);

  // Sort by date ascending
  list.sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega));

  const toggleConcluido = (t: Trabalho, e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveTrabalho({ ...t, concluido: !t.concluido });
  };

  const updateGradeOrWeight = (t: Trabalho, field: "nota" | "peso", value: string) => {
    const num = value === "" ? undefined : parseFloat(value);
    onSaveTrabalho({ ...t, [field]: num });
  };

  const getDisciplinaName = (id?: number) => {
    if (!id) return "Geral";
    const d = appData.disciplinas.find((x) => x.id === id);
    return d ? d.nome : "Geral";
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header Actions & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenModal("trabalho")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Trabalho
            </button>
          </div>

          {/* Discipline Select */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDisciplina}
              onChange={(e) => setSelectedDisciplina(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="all">Todas as Disciplinas</option>
              {appData.disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold scrollbar-none">
          {[
            { id: "ativos", label: " Ativos" },
            { id: "hoje", label: "📍 Hoje" },
            { id: "7d", label: "📅 7 Dias" },
            { id: "atrasados", label: "⛔ Atrasados" },
            { id: "concluidos", label: "✅ Concluídos" },
            { id: "todos", label: "📋 Todos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FiltroTipo)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                filter === tab.id
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
          <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-600 dark:text-slate-400">Nenhum trabalho encontrado nesta visão.</p>
          <p>Clique em "+ Novo Trabalho" para registrar seus prazos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((t) => {
            const status = getDueStatus(t.dataEntrega);
            const isExpanded = expandedId === t.id;
            const discName = getDisciplinaName(t.disciplinaId);

            return (
              <div
                key={t.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all ${
                  t.concluido
                    ? "border-slate-200/80 dark:border-slate-800 opacity-60"
                    : status.type === "late"
                    ? "border-rose-200 dark:border-rose-900/60"
                    : "border-slate-200 dark:border-slate-800 hover:border-emerald-500/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={(e) => toggleConcluido(t, e)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors"
                      title={t.concluido ? "Marcar como pendente" : "Concluir trabalho"}
                    >
                      {t.concluido ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          {discName}
                        </span>
                        <h3 className={`font-extrabold text-sm text-slate-900 dark:text-white ${t.concluido ? "line-through" : ""}`}>
                          {t.titulo}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Entrega: {fmtBR(t.dataEntrega)}
                        </span>
                        {t.peso !== undefined && (
                          <span className="flex items-center gap-1 font-medium">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> Peso: {t.peso}
                          </span>
                        )}
                        {t.nota !== undefined && (
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                            Nota: {t.nota}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Due status badge & options */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        t.concluido
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          : status.type === "today"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : status.type === "late"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {t.concluido ? "Concluído" : status.label}
                    </span>

                    <button
                      onClick={() => onOpenModal("trabalho", t)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir o trabalho "${t.titulo}"?`)) {
                          onDeleteTrabalho(t.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible details / description & grades */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-3 animate-fadeIn">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Descrição e Requisitos:</label>
                      <textarea
                        value={t.descricao}
                        onChange={(e) => onSaveTrabalho({ ...t, descricao: e.target.value })}
                        placeholder="Adicione detalhes sobre o que precisa ser entregue..."
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Peso da Atividade:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={t.peso !== undefined ? t.peso : ""}
                          onChange={(e) => updateGradeOrWeight(t, "peso", e.target.value)}
                          placeholder="Ex: 2.0"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Nota Obtida:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={t.nota !== undefined ? t.nota : ""}
                          onChange={(e) => updateGradeOrWeight(t, "nota", e.target.value)}
                          placeholder="Ex: 9.5"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
