import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  Sparkles,
  FileText,
  User,
  MapPin,
  ChevronRight,
  Loader2,
  Award,
} from "lucide-react";
import { AppData, Disciplina, Aula } from "../types";

interface AulasSectionProps {
  appData: AppData;
  onSaveDisciplina: (d: Disciplina) => void;
  onDeleteDisciplina: (id: number) => void;
  onSaveAula: (a: Aula) => void;
  onDeleteAula: (id: number) => void;
  onOpenModal: (type: "disciplina" | "aula", payload?: any) => void;
}

export const AulasSection: React.FC<AulasSectionProps> = ({
  appData,
  onSaveDisciplina,
  onDeleteDisciplina,
  onSaveAula,
  onDeleteAula,
  onOpenModal,
}) => {
  const [activeDisciplinaId, setActiveDisciplinaId] = useState<number | null>(null);
  const [activeAulaId, setActiveAulaId] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<Record<number, string>>({});
  const [loadingSummaryId, setLoadingSummaryId] = useState<number | null>(null);

  const activeDisciplina = appData.disciplinas.find((d) => d.id === activeDisciplinaId);

  const handleSummarizeNote = async (aula: Aula) => {
    setLoadingSummaryId(aula.id);
    try {
      const disc = appData.disciplinas.find((d) => d.id === aula.disciplinaId);
      const res = await fetch("/api/ai/summarize-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aula.titulo,
          notes: aula.conteudo,
          disciplina: disc?.nome || "Geral",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao resumir.");

      setSummaries((prev) => ({ ...prev, [aula.id]: data.summary }));
    } catch (e: any) {
      alert(`⚠️ Erro ao resumir: ${e.message || "Tente novamente."}`);
    } finally {
      setLoadingSummaryId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {!activeDisciplina ? (
        /* Discipline List View */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Suas Disciplinas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecione uma matéria para acessar cadernos e anotações de aula
              </p>
            </div>
            <button
              onClick={() => onOpenModal("disciplina")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nova Disciplina
            </button>
          </div>

          {appData.disciplinas.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-400">Nenhuma matéria cadastrada.</p>
              <p>Clique em "+ Nova Disciplina" para iniciar seus cadernos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appData.disciplinas.map((d) => {
                const aulasList = appData.aulas.filter((a) => a.disciplinaId === d.id);
                const tList = appData.trabalhos.filter((t) => t.disciplinaId === d.id && t.nota !== undefined);
                const pList = appData.provas.filter((p) => p.disciplinaId === d.id && p.nota !== undefined);

                let totalPoints = 0;
                let totalWeight = 0;
                tList.forEach((t) => {
                  const peso = t.peso || 1;
                  totalPoints += (t.nota || 0) * peso;
                  totalWeight += peso;
                });
                pList.forEach((p) => {
                  const peso = p.peso || 1;
                  totalPoints += (p.nota || 0) * peso;
                  totalWeight += peso;
                });

                const average = totalWeight > 0 ? (totalPoints / totalWeight).toFixed(1) : null;

                return (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.cor || "#10b981" }}></span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.codigo || "CÓDIGO"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenModal("disciplina", d)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir a matéria "${d.nome}" e todas as suas anotações?`)) {
                                onDeleteDisciplina(d.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {d.nome}
                      </h3>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {d.professor && (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{d.professor}</span>
                          </div>
                        )}
                        {d.sala && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{d.sala}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-500">
                        <span>{aulasList.length} aula(s) registrada(s)</span>
                        {average && (
                          <span className="ml-2 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold">
                            Média: {average}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setActiveDisciplinaId(d.id);
                          setActiveAulaId(null);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1"
                      >
                        Abrir Caderno <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Inside Active Discipline View */
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveDisciplinaId(null);
                  setActiveAulaId(null);
                }}
                className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeDisciplina.cor || "#10b981" }}></span>
                  {activeDisciplina.nome}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeDisciplina.codigo || "Caderno de Anotações de Aula"}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenModal("aula", { disciplinaId: activeDisciplina.id })}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nova Aula
            </button>
          </div>

          {/* Lectures List */}
          {appData.aulas.filter((a) => a.disciplinaId === activeDisciplina.id).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold text-sm text-slate-600 dark:text-slate-400">Nenhuma aula anotada nesta matéria.</p>
              <p>Clique em "+ Nova Aula" para registrar tópicos e notas de aula.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appData.aulas
                .filter((a) => a.disciplinaId === activeDisciplina.id)
                .map((a) => {
                  const isOpen = activeAulaId === a.id;
                  const hasSummary = !!summaries[a.id];

                  return (
                    <div
                      key={a.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setActiveAulaId(isOpen ? null : a.id)}
                        >
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            {a.titulo}
                          </h4>
                          <span className="text-xs text-slate-400">
                            {a.data ? `Data: ${a.data}` : "Anotação de aula"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSummarizeNote(a)}
                            disabled={loadingSummaryId === a.id || !a.conteudo.trim()}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 disabled:opacity-50"
                            title="Resumir anotação com IA"
                          >
                            {loadingSummaryId === a.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            Resumir IA
                          </button>

                          <button
                            onClick={() => setActiveAulaId(isOpen ? null : a.id)}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            {isOpen ? "Fechar" : "Editar / Ver"}
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Excluir a aula "${a.titulo}"?`)) {
                                onDeleteAula(a.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Content Body & AI Summary Box */}
                      {isOpen && (
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Conteúdo das Anotações:</label>
                            <textarea
                              value={a.conteudo}
                              onChange={(e) => onSaveAula({ ...a, conteudo: e.target.value })}
                              placeholder="Escreva suas notas de aula aqui..."
                              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500 leading-relaxed font-mono"
                              rows={8}
                            />
                          </div>

                          {/* AI Generated Summary Box */}
                          {hasSummary && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-xl text-xs space-y-2 text-emerald-950 dark:text-emerald-100">
                              <div className="flex items-center justify-between font-bold text-sm text-emerald-800 dark:text-emerald-300">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-emerald-500" /> Resumo Didático por IA
                                </span>
                                <button
                                  onClick={() => setSummaries((prev) => ({ ...prev, [a.id]: "" }))}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed font-sans">{summaries[a.id]}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
