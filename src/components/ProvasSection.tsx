import React, { useState } from "react";
import {
  TestTube,
  Plus,
  Filter,
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Award,
  Sparkles,
  HelpCircle,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { AppData, Prova, FiltroTipo, QuizQuestion } from "../types";
import { todayISO, isWithinNext7Days, isPast, getDueStatus, fmtBR } from "../lib/dateUtils";

interface ProvasSectionProps {
  appData: AppData;
  searchQuery: string;
  onSaveProva: (p: Prova) => void;
  onDeleteProva: (id: number) => void;
  onOpenModal: (type: "prova", payload?: any) => void;
}

export const ProvasSection: React.FC<ProvasSectionProps> = ({
  appData,
  searchQuery,
  onSaveProva,
  onDeleteProva,
  onOpenModal,
}) => {
  const [filter, setFilter] = useState<FiltroTipo>("ativos");
  const [selectedDisciplina, setSelectedDisciplina] = useState<number | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // AI Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [activeQuizExam, setActiveQuizExam] = useState<Prova | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const hoje = todayISO();

  let list = [...appData.provas];

  // Apply Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.titulo.toLowerCase().includes(q) ||
        p.descricao.toLowerCase().includes(q)
    );
  }

  // Apply Discipline Filter
  if (selectedDisciplina !== "all") {
    list = list.filter((p) => p.disciplinaId === selectedDisciplina);
  }

  // Apply Status Filter
  if (filter === "ativos") list = list.filter((p) => !p.concluido);
  if (filter === "hoje") list = list.filter((p) => !p.concluido && p.data === hoje);
  if (filter === "7d") list = list.filter((p) => !p.concluido && isWithinNext7Days(p.data));
  if (filter === "atrasados") list = list.filter((p) => !p.concluido && isPast(p.data));
  if (filter === "concluidos") list = list.filter((p) => p.concluido);

  list.sort((a, b) => a.data.localeCompare(b.data));

  const toggleConcluido = (p: Prova, e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveProva({ ...p, concluido: !p.concluido });
  };

  const updateGradeOrWeight = (p: Prova, field: "nota" | "peso", value: string) => {
    const num = value === "" ? undefined : parseFloat(value);
    onSaveProva({ ...p, [field]: num });
  };

  const getDisciplinaName = (id?: number) => {
    if (!id) return "Geral";
    const d = appData.disciplinas.find((x) => x.id === id);
    return d ? d.nome : "Geral";
  };

  const handleGenerateQuiz = async (prova: Prova) => {
    setActiveQuizExam(prova);
    setLoadingQuiz(true);
    setQuizQuestions(null);
    setUserAnswers({});
    setQuizSubmitted(false);

    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prova.titulo,
          description: prova.descricao || "Tópicos de estudo gerais para a avaliação",
          count: 3,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar simulado.");
      setQuizQuestions(data.questions || []);
    } catch (err: any) {
      alert(`⚠️ Erro ao gerar quiz: ${err.message || "Tente novamente."}`);
      setActiveQuizExam(null);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header Actions & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenModal("prova")}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Nova Prova
            </button>
          </div>

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
            { id: "atrasados", label: "⛔ Passadas" },
            { id: "concluidos", label: "✅ Concluídas" },
            { id: "todos", label: "📋 Todas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FiltroTipo)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                filter === tab.id
                  ? "bg-purple-600 text-white shadow-xs"
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
          <TestTube className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-600 dark:text-slate-400">Nenhuma prova cadastrada nesta opção.</p>
          <p>Clique em "+ Nova Prova" para cadastrar datas e conteúdos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p) => {
            const status = getDueStatus(p.data);
            const isExpanded = expandedId === p.id;
            const discName = getDisciplinaName(p.disciplinaId);

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all ${
                  p.concluido
                    ? "border-slate-200/80 dark:border-slate-800 opacity-60"
                    : status.type === "late"
                    ? "border-rose-200 dark:border-rose-900/60"
                    : "border-slate-200 dark:border-slate-800 hover:border-purple-500/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={(e) => toggleConcluido(p, e)}
                      className="mt-0.5 text-slate-400 hover:text-purple-500 transition-colors"
                      title={p.concluido ? "Marcar como pendente" : "Concluir prova"}
                    >
                      {p.concluido ? (
                        <CheckCircle2 className="w-5 h-5 text-purple-500 fill-purple-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                          {discName}
                        </span>
                        <h3 className={`font-extrabold text-sm text-slate-900 dark:text-white ${p.concluido ? "line-through" : ""}`}>
                          {p.titulo}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Data da Prova: {fmtBR(p.data)}
                        </span>
                        {p.peso !== undefined && (
                          <span className="flex items-center gap-1 font-medium">
                            <Award className="w-3.5 h-3.5 text-amber-500" /> Peso: {p.peso}
                          </span>
                        )}
                        {p.nota !== undefined && (
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                            Nota: {p.nota}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateQuiz(p)}
                      className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                      title="Gerar Simulado por IA"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Simulado IA
                    </button>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.concluido
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          : status.type === "today"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : status.type === "late"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                      }`}
                    >
                      {p.concluido ? "Concluída" : status.label}
                    </span>

                    <button
                      onClick={() => onOpenModal("prova", p)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir a prova "${p.titulo}"?`)) {
                          onDeleteProva(p.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-3 animate-fadeIn">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Conteúdo & Tópicos de Estudo:</label>
                      <textarea
                        value={p.descricao}
                        onChange={(e) => onSaveProva({ ...p, descricao: e.target.value })}
                        placeholder="Adicione tópicos, capítulos e fórmulas cobradas na prova..."
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Peso da Avaliação:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={p.peso !== undefined ? p.peso : ""}
                          onChange={(e) => updateGradeOrWeight(p, "peso", e.target.value)}
                          placeholder="Ex: 4.0"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Nota Final Obtida:</label>
                        <input
                          type="number"
                          step="0.1"
                          value={p.nota !== undefined ? p.nota : ""}
                          onChange={(e) => updateGradeOrWeight(p, "nota", e.target.value)}
                          placeholder="Ex: 8.5"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-purple-500"
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

      {/* AI Quiz Modal */}
      {(loadingQuiz || activeQuizExam) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Simulado IA: {activeQuizExam?.titulo}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveQuizExam(null);
                  setQuizQuestions(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              {loadingQuiz ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                  <p className="font-bold text-sm">Gerando questões customizadas com Gemini IA...</p>
                  <p className="text-xs text-slate-400">Criando opções e explicações detalhadas baseadas no seu conteúdo.</p>
                </div>
              ) : quizQuestions && quizQuestions.length > 0 ? (
                <>
                  {quizQuestions.map((q, qIdx) => {
                    const selected = userAnswers[qIdx];
                    return (
                      <div key={qIdx} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs">
                            Q{qIdx + 1}
                          </span>
                          {q.question}
                        </h4>

                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isChosen = selected === oIdx;
                            const isCorrect = q.correctIndex === oIdx;

                            let btnStyle = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200";
                            if (quizSubmitted) {
                              if (isCorrect) {
                                btnStyle = "bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold";
                              } else if (isChosen && !isCorrect) {
                                btnStyle = "bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-900 dark:text-rose-200 font-bold";
                              }
                            } else if (isChosen) {
                              btnStyle = "bg-purple-100 dark:bg-purple-900 border-purple-500 text-purple-900 dark:text-purple-200 font-bold";
                            }

                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleSelectOption(qIdx, oIdx)}
                                className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                                {quizSubmitted && isChosen && !isCorrect && <X className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-xs text-purple-900 dark:text-purple-200 border border-purple-200/60 dark:border-purple-800/60">
                            <strong>Explicação:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : null}
            </div>

            {/* Quiz Footer Controls */}
            {quizQuestions && quizQuestions.length > 0 && !loadingQuiz && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                {!quizSubmitted ? (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={Object.keys(userAnswers).length < quizQuestions.length}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    Verificar Respostas ({Object.keys(userAnswers).length}/{quizQuestions.length})
                  </button>
                ) : (
                  <button
                    onClick={() => handleGenerateQuiz(activeQuizExam!)}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Refazer Novo Simulado
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
