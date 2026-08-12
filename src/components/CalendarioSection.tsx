import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Upload, FileText, ExternalLink, Download, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Clock } from "lucide-react";
import { AppData, EventoCalendario } from "../types";
import { idbSet, idbGet, idbDel, generateUid } from "../lib/idb";
import { fmtBR, parseLocalDate } from "../lib/dateUtils";

interface CalendarioSectionProps {
  appData: AppData;
  onUpdateArquivos: (arquivos: any) => void;
  onSelectTab: (tab: any) => void;
  onOpenQuickAdd?: (type?: string, payload?: any) => void;
  onToggleEvento?: (id: number) => void;
  onDeleteEvento?: (id: number) => void;
}

export const CalendarioSection: React.FC<CalendarioSectionProps> = ({
  appData,
  onUpdateArquivos,
  onSelectTab,
  onOpenQuickAdd,
  onToggleEvento,
  onDeleteEvento,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  const pdfInfo = appData.arquivos?.calendario;

  useEffect(() => {
    let active = true;
    let currentObjectUrl: string | null = null;

    async function loadPdfFile() {
      if (!pdfInfo?.idbKey) {
        setPdfUrl(null);
        return;
      }
      try {
        const file = await idbGet(pdfInfo.idbKey);
        if (file && active) {
          currentObjectUrl = URL.createObjectURL(file);
          setPdfUrl(currentObjectUrl);
        }
      } catch (err) {
        console.error("Erro ao carregar PDF:", err);
      }
    }

    loadPdfFile();

    return () => {
      active = false;
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    };
  }, [pdfInfo?.idbKey]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Por favor, selecione um arquivo em formato PDF.");
      return;
    }

    try {
      const key = generateUid("calendario");
      await idbSet(key, file);

      const newArquivos = {
        ...appData.arquivos,
        calendario: {
          idbKey: key,
          nome: file.name,
          atualizadoEm: new Date().toISOString().split("T")[0],
        },
      };

      onUpdateArquivos(newArquivos);
      e.target.value = "";
    } catch (err) {
      alert("Erro ao salvar PDF no armazenamento local.");
    }
  };

  const handleRemovePdf = async () => {
    if (!pdfInfo) return;
    if (!confirm("Remover o calendário oficial em PDF?")) return;

    try {
      await idbDel(pdfInfo.idbKey);
      const newArquivos = { ...appData.arquivos, calendario: null };
      onUpdateArquivos(newArquivos);
      setPdfUrl(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Calendar month rendering logic
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  // Find assignments, exams, replacement classes & custom events for a specific day string (YYYY-MM-DD)
  const getEventsForDay = (dayNum: number) => {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(dayNum).padStart(2, "0");
    const iso = `${year}-${mStr}-${dStr}`;

    const tList = appData.trabalhos.filter((t) => t.dataEntrega === iso);
    const pList = appData.provas.filter((p) => p.data === iso);
    const rList = appData.reposicoes.filter((r) => r.data === iso);
    const eList = (appData.eventos || []).filter((e) => e.data === iso);

    return { tList, pList, rList, eList, iso };
  };

  const eventosDoMes = (appData.eventos || []).filter((ev) => {
    const [y, m] = ev.data.split("-").map(Number);
    return y === year && m === month + 1;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Interactive Month Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-500" /> Calendário Acadêmico Mensal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualização de entregas, provas, reposições e eventos
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenQuickAdd && (
              <button
                onClick={() => onOpenQuickAdd("evento")}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> + Evento
              </button>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={prevMonth}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-slate-900 dark:text-white px-2 min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Month Grid Outer Container with scrollable wrapper for small phones */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <div className="min-w-[330px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs text-slate-400 uppercase py-1 border-b border-slate-100 dark:border-slate-800">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            {/* Month Grid Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mt-1">
              {/* Empty cells before month start */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty_${idx}`} className="h-14 sm:h-20 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl"></div>
              ))}

              {/* Days of Month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const { tList, pList, rList, eList } = getEventsForDay(dayNum);
                const totalEvents = tList.length + pList.length + rList.length + eList.length;

                return (
                  <div
                    key={`day_${dayNum}`}
                    className={`h-14 sm:h-20 p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between transition-all ${
                      totalEvents > 0
                        ? "bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-2xs"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/60 text-slate-500"
                    }`}
                  >
                    <div className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{dayNum}</div>

                    <div className="space-y-0.5 overflow-hidden">
                      {tList.slice(0, 1).map((t) => (
                        <div
                          key={t.id}
                          onClick={() => onSelectTab("trabalhos")}
                          className="bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded-md font-bold truncate cursor-pointer hover:opacity-80"
                          title={`Trabalho: ${t.titulo}`}
                        >
                          📝 {t.titulo}
                        </div>
                      ))}

                      {pList.slice(0, 1).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => onSelectTab("provas")}
                          className="bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded-md font-bold truncate cursor-pointer hover:opacity-80"
                          title={`Prova: ${p.titulo}`}
                        >
                          🧪 {p.titulo}
                        </div>
                      ))}

                      {rList.slice(0, 1).map((r) => {
                        const disc = appData.disciplinas.find((d) => d.id === r.disciplinaId);
                        return (
                          <div
                            key={r.id}
                            onClick={() => onSelectTab("reposicoes")}
                            className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded-md font-bold truncate cursor-pointer hover:opacity-80"
                            title={`Reposição: ${disc?.nome || "Matéria"}`}
                          >
                            🔄 Rep: {disc?.nome || "Matéria"}
                          </div>
                        );
                      })}

                  {eList.slice(0, 1).map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-[8px] sm:text-[10px] px-0.5 sm:px-1 py-0.5 rounded-md font-bold truncate cursor-pointer hover:opacity-80"
                      title={`Evento: ${ev.titulo}`}
                    >
                      🎉 {ev.titulo}
                    </div>
                  ))}

                  {totalEvents > 2 && (
                    <div className="text-[9px] font-bold text-slate-400 text-right">+{totalEvents - 2} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>

      {/* Eventos do Mês Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-500" /> Eventos & Compromissos de {monthNames[month]}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registros e lembretes cadastrados para este mês
            </p>
          </div>

          {onOpenQuickAdd && (
            <button
              onClick={() => onOpenQuickAdd("evento")}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Evento
            </button>
          )}
        </div>

        {eventosDoMes.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <p>Nenhum evento registrado para {monthNames[month]}.</p>
            {onOpenQuickAdd && (
              <button
                onClick={() => onOpenQuickAdd("evento")}
                className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                + Clique para adicionar um evento
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {eventosDoMes.map((ev) => {
              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    ev.concluido
                      ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60"
                      : "bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-500 text-white">
                        {ev.categoria?.toUpperCase() || "EVENTO"}
                      </span>
                      {ev.horario && (
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-500" /> {ev.horario}
                        </span>
                      )}
                    </div>

                    <h4 className={`font-bold text-sm ${ev.concluido ? "line-through text-slate-500" : "text-slate-900 dark:text-white"}`}>
                      {ev.titulo}
                    </h4>

                    {ev.descricao && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {ev.descricao}
                      </p>
                    )}

                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                      📅 {fmtBR(ev.data)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onToggleEvento && (
                      <button
                        onClick={() => onToggleEvento(ev.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          ev.concluido
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white"
                        }`}
                        title={ev.concluido ? "Marcar como pendente" : "Marcar como concluído"}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {onDeleteEvento && (
                      <button
                        onClick={() => {
                          if (confirm(`Excluir evento "${ev.titulo}"?`)) onDeleteEvento(ev.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PDF Official Calendar Upload & Viewer Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> PDF do Calendário Acadêmico Oficial
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Anexe o calendário de início/fim de semestre, provas finais e feriados em PDF
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs flex items-center gap-2 shrink-0">
            <Upload className="w-4 h-4" /> Selecionar PDF do Calendário
            <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
          </label>

          {pdfInfo && (
            <button
              onClick={handleRemovePdf}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl text-xs transition-colors"
            >
              Remover PDF
            </button>
          )}
        </div>

        {pdfInfo && pdfUrl ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <span>
                Arquivo: <strong>{pdfInfo.nome}</strong> (Atualizado em {pdfInfo.atualizadoEm})
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1 hover:border-emerald-500"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Guia
                </a>
                <a
                  href={pdfUrl}
                  download={pdfInfo.nome}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1 hover:border-emerald-500"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar
                </a>
              </div>
            </div>

            <iframe
              src={pdfUrl}
              title="PDF Calendário"
              className="w-full h-[550px] border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50"
            />
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Nenhum calendário oficial em PDF anexado no momento.
          </div>
        )}
      </div>
    </div>
  );
};
