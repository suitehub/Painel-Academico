import React, { useState } from "react";
import {
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  TestTube,
  Award,
  ChevronRight,
  Plus,
  ArrowRight,
  Brain,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { AppData, TabSection } from "../types";
import { todayISO, isWithinNext7Days, isPast, getDueStatus, fmtBR } from "../lib/dateUtils";
import { callStudyPlan } from "../lib/aiService";

interface GeralSectionProps {
  appData: AppData;
  onSelectTab: (tab: TabSection) => void;
  onOpenQuickAdd: (type?: string) => void;
  onOpenAITutor: () => void;
  onEditTrabalho: (t: any) => void;
  onEditProva: (p: any) => void;
}

export const GeralSection: React.FC<GeralSectionProps> = ({
  appData,
  onSelectTab,
  onOpenQuickAdd,
  onOpenAITutor,
  onEditTrabalho,
  onEditProva,
}) => {
  const hoje = todayISO();
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const trabalhosAtivos = appData.trabalhos.filter((t) => !t.concluido);
  const provasAtivas = appData.provas.filter((p) => !p.concluido);
  const reposicoesAtivas = appData.reposicoes.filter((r) => !r.concluida);

  const trabalhosHoje = trabalhosAtivos.filter((t) => t.dataEntrega === hoje);
  const provasHoje = provasAtivas.filter((p) => p.data === hoje);
  const reposicoesHoje = reposicoesAtivas.filter((r) => r.data === hoje);

  const trabalhosSemana = trabalhosAtivos.filter((t) => isWithinNext7Days(t.dataEntrega));
  const provasSemana = provasAtivas.filter((p) => isWithinNext7Days(p.data));
  const reposicoesSemana = reposicoesAtivas.filter((r) => isWithinNext7Days(r.data));

  const atrasosT = trabalhosAtivos.filter((t) => isPast(t.dataEntrega));
  const atrasosP = provasAtivas.filter((p) => isPast(p.data));

  const todosAtrasados = [
    ...atrasosT.map((t) => ({ type: "trabalho", item: t, data: t.dataEntrega })),
    ...atrasosP.map((p) => ({ type: "prova", item: p, data: p.data })),
  ];

  const hojeList = [
    ...trabalhosAtivos.map((t) => ({ type: "trabalho", id: t.id, titulo: t.titulo, data: t.dataEntrega, ref: t, discId: t.disciplinaId })),
    ...provasAtivas.map((p) => ({ type: "prova", id: p.id, titulo: p.titulo, data: p.data, ref: p, discId: p.disciplinaId })),
  ].filter((x) => x.data === hoje);

  const semanaList = [
    ...trabalhosAtivos.map((t) => ({ type: "trabalho", id: t.id, titulo: t.titulo, data: t.dataEntrega, ref: t, discId: t.disciplinaId })),
    ...provasAtivas.map((p) => ({ type: "prova", id: p.id, titulo: p.titulo, data: p.data, ref: p, discId: p.disciplinaId })),
  ]
    .filter((x) => isWithinNext7Days(x.data))
    .sort((a, b) => a.data.localeCompare(b.data));

  // Compute Grade Averages
  const disciplinasWithGrades = appData.disciplinas.map((d) => {
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
    return { ...d, average };
  });

  const validAverages = disciplinasWithGrades.map((d) => (d.average ? parseFloat(d.average) : null)).filter((v) => v !== null) as number[];
  const crGlobal = validAverages.length > 0 ? (validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(1) : "N/A";

  const handleGenerateStudyPlan = async () => {
    setLoadingPlan(true);
    try {
      const itemsToPlan = [
        ...trabalhosAtivos.map((t) => ({ tipo: "Trabalho", titulo: t.titulo, prazo: t.dataEntrega, descricao: t.descricao })),
        ...provasAtivas.map((p) => ({ tipo: "Prova", titulo: p.titulo, data: p.data, conteudo: p.descricao })),
      ];

      const data = await callStudyPlan(itemsToPlan);
      setAiPlan(data.plan);
    } catch (e: any) {
      setAiPlan(`⚠️ Não foi possível gerar o plano. ${e.message || ""}`);
    } finally {
      setLoadingPlan(false);
    }
  };

  const getDisciplinaName = (id?: number) => {
    if (!id) return null;
    const d = appData.disciplinas.find((x) => x.id === id);
    return d ? d.nome : null;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Overdue Items Alert Banner if any */}
      {todosAtrasados.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3 text-red-900 dark:text-red-200 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Atenção: Você possui {todosAtrasados.length} atividade(s) atrasada(s)!</h4>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Revise e atualize os prazos para manter sua organização acadêmica em dia.
            </p>
          </div>
          <button
            onClick={() => onSelectTab("trabalhos")}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            Ver Atrasados
          </button>
        </div>
      )}

      {/* Replacement Classes Notice Banner if any for today or this week */}
      {reposicoesAtivas.length > 0 && (reposicoesHoje.length > 0 || reposicoesSemana.length > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-xs">
          <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm">Aulas de Reposição Agendadas</h4>
              {reposicoesHoje.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                  ⚠️ HOJE: {reposicoesHoje.length}
                </span>
              )}
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              {reposicoesHoje.length > 0
                ? `Você tem ${reposicoesHoje.length} aula(s) de reposição agendada(s) para hoje!`
                : `Você tem ${reposicoesSemana.length} aula(s) de reposição agendada(s) para esta semana.`}
            </p>
            <div className="mt-2 space-y-1">
              {reposicoesSemana.slice(0, 3).map((r) => {
                const disc = appData.disciplinas.find((d) => d.id === r.disciplinaId);
                return (
                  <div key={r.id} className="text-xs flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    <strong className="text-slate-900 dark:text-white">{disc?.nome || "Matéria"}:</strong>
                    <span>{fmtBR(r.data)}</span>
                    {r.horario && <span className="text-amber-800 dark:text-amber-300">({r.horario})</span>}
                    {r.sala && <span className="text-slate-500 dark:text-slate-400">- {r.sala}</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => onSelectTab("reposicoes")}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            Ver Reposições
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Hoje */}
        <div
          onClick={() => onSelectTab("trabalhos")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Para HOJE</span>
            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {trabalhosHoje.length + provasHoje.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {trabalhosHoje.length} trab. + {provasHoje.length} prova(s)
          </p>
        </div>

        {/* 7 Dias */}
        <div
          onClick={() => onSelectTab("trabalhos")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Em 7 Dias</span>
            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {trabalhosSemana.length + provasSemana.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Atividades nesta semana
          </p>
        </div>

        {/* Atrasados */}
        <div
          onClick={() => onSelectTab("trabalhos")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Atrasados</span>
            <div className="p-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
            {atrasosT.length + atrasosP.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Requer atenção urgente
          </p>
        </div>

        {/* CR Estimado */}
        <div
          onClick={() => onSelectTab("aulas")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Média CR Est.</span>
            <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {crGlobal}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Desempenho acadêmico
          </p>
        </div>
      </div>

      {/* Quick Action Bar & AI Planner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Tutor de Produtividade IA
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">
              Gerar Plano de Estudos Inteligente
            </h3>
            <p className="text-xs text-emerald-100 max-w-xl">
              Deixe a IA analisar suas provas e trabalhos pendentes para montar uma estratégia de estudo personalizada passo a passo.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleGenerateStudyPlan}
              disabled={loadingPlan}
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {loadingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  Gerando Plano...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 text-emerald-600" />
                  Gerar Plano Semanal
                </>
              )}
            </button>
            <button
              onClick={onOpenQuickAdd}
              className="p-2.5 bg-emerald-500/30 hover:bg-emerald-500/50 text-white font-bold rounded-xl text-xs transition-all backdrop-blur-sm"
              title="Adicionar rápido"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Plan Output Modal/Box */}
        {aiPlan && (
          <div className="mt-4 pt-4 border-t border-white/20 bg-emerald-950/40 p-4 rounded-xl text-xs text-emerald-50 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between font-bold text-sm text-emerald-200">
              <span className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-emerald-300" /> Seu Plano de Estudos Recomendado:
              </span>
              <button onClick={() => setAiPlan(null)} className="text-white hover:text-emerald-200">
                ✕ Fechar
              </button>
            </div>
            <div className="whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto pr-2">
              {aiPlan}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Hoje vs Próximos 7 Dias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HOJE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" /> Atividades de Hoje
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {hojeList.length} item(s)
            </span>
          </div>

          {hojeList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60" />
              <p className="font-medium">Nenhum compromisso pendente para hoje!</p>
              <p className="text-[11px] text-slate-400">Aproveite para adiantar matérias dos próximos dias.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {hojeList.map((item) => {
                const discName = getDisciplinaName(item.discId);
                const isWork = item.type === "trabalho";
                return (
                  <div
                    key={`${item.type}_${item.id}`}
                    onClick={() => (isWork ? onEditTrabalho(item.ref) : onEditProva(item.ref))}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl text-white mt-0.5 ${
                          isWork ? "bg-blue-500" : "bg-purple-500"
                        }`}
                      >
                        {isWork ? <FileText className="w-4 h-4" /> : <TestTube className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.titulo}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {discName && <span className="font-medium text-emerald-600 dark:text-emerald-400">{discName}</span>}
                          <span>•</span>
                          <span>Entregar HOJE</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shrink-0">
                      📍 HOJE
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PRÓXIMOS 7 DIAS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" /> Próximos 7 Dias
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {semanaList.length} item(s)
            </span>
          </div>

          {semanaList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
              <p className="font-medium">Nenhum compromisso marcado para a semana 🎉</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {semanaList.map((item) => {
                const discName = getDisciplinaName(item.discId);
                const isWork = item.type === "trabalho";
                const status = getDueStatus(item.data);
                return (
                  <div
                    key={`${item.type}_${item.id}`}
                    onClick={() => (isWork ? onEditTrabalho(item.ref) : onEditProva(item.ref))}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl text-white mt-0.5 ${
                          isWork ? "bg-blue-500" : "bg-purple-500"
                        }`}
                      >
                        {isWork ? <FileText className="w-4 h-4" /> : <TestTube className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {item.titulo}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {discName && <span className="font-medium text-emerald-600 dark:text-emerald-400">{discName}</span>}
                          <span>•</span>
                          <span>Data: {fmtBR(item.data)}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        status.type === "today"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : status.type === "late"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                      }`}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Compromissos do Dia e da Semana (Trabalhos, Provas, Reposições e Eventos) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" /> Agenda de Compromissos (Dia & Semana)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Todos os trabalhos, provas, aulas de reposição e eventos programados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab("calendario")}
              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              Ver no Calendário
            </button>
            <button
              onClick={() => onOpenQuickAdd("evento")}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> + Evento / Compromisso
            </button>
          </div>
        </div>

        {/* List of Compromissos */}
        {(() => {
          const eventosAtivos = (appData.eventos || []).filter((e) => !e.concluido);

          const allCompromissosSemana = [
            ...trabalhosAtivos.map((t) => ({
              kind: "trabalho" as const,
              id: `t_${t.id}`,
              titulo: t.titulo,
              data: t.dataEntrega,
              horario: undefined,
              badge: "📝 Trabalho",
              badgeStyle: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
              discId: t.disciplinaId,
              detail: t.descricao,
              ref: t,
              targetTab: "trabalhos",
            })),
            ...provasAtivas.map((p) => ({
              kind: "prova" as const,
              id: `p_${p.id}`,
              titulo: p.titulo,
              data: p.data,
              horario: undefined,
              badge: "🧪 Prova",
              badgeStyle: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
              discId: p.disciplinaId,
              detail: p.descricao,
              ref: p,
              targetTab: "provas",
            })),
            ...reposicoesAtivas.map((r) => ({
              kind: "reposicao" as const,
              id: `r_${r.id}`,
              titulo: `Aula de Reposição - ${getDisciplinaName(r.disciplinaId) || "Matéria"}`,
              data: r.data,
              horario: r.horario,
              badge: "🔄 Reposição",
              badgeStyle: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
              discId: r.disciplinaId,
              detail: r.motivo ? `Motivo: ${r.motivo}` : r.sala ? `Sala: ${r.sala}` : undefined,
              ref: r,
              targetTab: "reposicoes",
            })),
            ...eventosAtivos.map((ev) => ({
              kind: "evento" as const,
              id: `ev_${ev.id}`,
              titulo: ev.titulo,
              data: ev.data,
              horario: ev.horario,
              badge: "🎉 Evento",
              badgeStyle: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
              discId: ev.disciplinaId,
              detail: ev.descricao,
              ref: ev,
              targetTab: "calendario",
            })),
          ]
            .filter((item) => isWithinNext7Days(item.data))
            .sort((a, b) => a.data.localeCompare(b.data));

          if (allCompromissosSemana.length === 0) {
            return (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                Nenhum compromisso ou evento agendado para esta semana!
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allCompromissosSemana.map((c) => {
                const discName = getDisciplinaName(c.discId);
                const isToday = c.data === hoje;
                const dueStatus = getDueStatus(c.data);

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectTab(c.targetTab)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                      isToday
                        ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-purple-500"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${c.badgeStyle}`}>
                          {c.badge}
                        </span>
                        {discName && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {discName}
                          </span>
                        )}
                        {c.horario && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            🕒 {c.horario}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {c.titulo}
                      </h4>

                      {c.detail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {c.detail}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-block ${
                          isToday
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {isToday ? "HOJE" : dueStatus.label}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{fmtBR(c.data)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Disciplinas Overview & Grade Averages */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500" /> Desempenho por Disciplina
          </h3>
          <button
            onClick={() => onSelectTab("aulas")}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Ver Disciplinas <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {disciplinasWithGrades.map((d) => (
            <div
              key={d.id}
              onClick={() => onSelectTab("aulas")}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:border-emerald-500 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{d.nome}</span>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.cor || "#10b981" }}></span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{d.codigo || "Sem código"}</p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500">Média Calculada:</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                  {d.average !== null ? d.average : "--"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
