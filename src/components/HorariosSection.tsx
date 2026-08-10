import React, { useState, useEffect } from "react";
import { Clock, Upload, Trash2, Plus, ExternalLink, Download, FileText, AlertCircle } from "lucide-react";
import { AppData, HorarioAula } from "../types";
import { idbSet, idbGet, idbDel, generateUid } from "../lib/idb";
import { DIAS_SEMANA_ABREV } from "../lib/dateUtils";

interface HorariosSectionProps {
  appData: AppData;
  onSaveHorario: (h: HorarioAula) => void;
  onDeleteHorario: (id: string) => void;
  onUpdateArquivos: (arquivos: any) => void;
}

export const HorariosSection: React.FC<HorariosSectionProps> = ({
  appData,
  onSaveHorario,
  onDeleteHorario,
  onUpdateArquivos,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // New Slot Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDiscId, setNewDiscId] = useState<number>(appData.disciplinas[0]?.id || 0);
  const [newDia, setNewDia] = useState<number>(1);
  const [newInicio, setNewInicio] = useState("08:00");
  const [newFim, setNewFim] = useState("09:40");

  const pdfInfo = appData.arquivos?.horarios;

  useEffect(() => {
    let active = true;
    let currentObjectUrl: string | null = null;

    async function loadPdfFile() {
      if (!pdfInfo?.idbKey) {
        setPdfUrl(null);
        return;
      }
      setLoadingPdf(true);
      try {
        const file = await idbGet(pdfInfo.idbKey);
        if (file && active) {
          currentObjectUrl = URL.createObjectURL(file);
          setPdfUrl(currentObjectUrl);
        }
      } catch (err) {
        console.error("Erro ao carregar PDF do IndexedDB:", err);
      } finally {
        if (active) setLoadingPdf(false);
      }
    }

    loadPdfFile();

    return () => {
      active = false;
      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
      }
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
      const key = generateUid("horarios");
      await idbSet(key, file);

      const newArquivos = {
        ...appData.arquivos,
        horarios: {
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
    if (!confirm("Remover o comprovante de horários em PDF?")) return;

    try {
      await idbDel(pdfInfo.idbKey);
      const newArquivos = { ...appData.arquivos, horarios: null };
      onUpdateArquivos(newArquivos);
      setPdfUrl(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSlot = () => {
    if (!newDiscId) {
      alert("Selecione uma disciplina válida.");
      return;
    }

    const slot: HorarioAula = {
      id: generateUid("h"),
      disciplinaId: newDiscId,
      diaSemana: newDia,
      horaInicio: newInicio,
      horaFim: newFim,
    };

    onSaveHorario(slot);
    setShowAddForm(false);
  };

  const getDisciplinaName = (id: number) => {
    const d = appData.disciplinas.find((x) => x.id === id);
    return d ? d.nome : "Desconhecida";
  };

  const getDisciplinaColor = (id: number) => {
    const d = appData.disciplinas.find((x) => x.id === id);
    return d?.cor || "#3b82f6";
  };

  // Group slots by day (1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb)
  const days = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Interactive Grid Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" /> Grade Horária Semanal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aulas organizadas por dia da semana e horário
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Horário
          </button>
        </div>

        {/* Form Add Slot */}
        {showAddForm && (
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-fadeIn text-xs">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Adicionar Novo Bloco de Aula</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Disciplina:</label>
                <select
                  value={newDiscId}
                  onChange={(e) => setNewDiscId(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs outline-none text-slate-800 dark:text-slate-200"
                >
                  {appData.disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Dia da Semana:</label>
                <select
                  value={newDia}
                  onChange={(e) => setNewDia(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value={1}>Segunda-feira</option>
                  <option value={2}>Terça-feira</option>
                  <option value={3}>Quarta-feira</option>
                  <option value={4}>Quinta-feira</option>
                  <option value={5}>Sexta-feira</option>
                  <option value={6}>Sábado</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Início:</label>
                <input
                  type="time"
                  value={newInicio}
                  onChange={(e) => setNewInicio(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs outline-none text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Término:</label>
                <input
                  type="time"
                  value={newFim}
                  onChange={(e) => setNewFim(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs outline-none text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSlot}
                className="px-4 py-1.5 bg-emerald-500 text-white font-bold rounded-xl"
              >
                Salvar Horário
              </button>
            </div>
          </div>
        )}

        {/* Timetable Weekly Columns */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
          {days.map((diaNum) => {
            const slots = appData.horariosAulas.filter((h) => h.diaSemana === diaNum);
            slots.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

            return (
              <div
                key={diaNum}
                className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3 flex flex-col h-full min-h-[160px]"
              >
                <div className="text-center font-extrabold text-xs pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {DIAS_SEMANA_ABREV[diaNum]}
                </div>

                <div className="mt-2 space-y-2 flex-1">
                  {slots.length === 0 ? (
                    <div className="text-[11px] text-slate-400 text-center py-4 italic">Livre</div>
                  ) : (
                    slots.map((s) => {
                      const color = getDisciplinaColor(s.disciplinaId);
                      const discName = getDisciplinaName(s.disciplinaId);

                      return (
                        <div
                          key={s.id}
                          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 shadow-2xs relative group"
                          style={{ borderLeftWidth: "4px", borderLeftColor: color }}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-white">
                            <span className="truncate">{discName}</span>
                            <button
                              onClick={() => onDeleteHorario(s.id)}
                              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remover"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" /> {s.horaInicio} - {s.horaFim}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PDF Schedule Storage Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Comprovante de Horário em PDF
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Anexe a grade horária oficial emitida pela universidade (armazenado offline via IndexedDB)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-xs flex items-center gap-2 shrink-0">
            <Upload className="w-4 h-4" /> Selecionar PDF do Horário
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

        {/* File Details & Viewer */}
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
              title="PDF Horário"
              className="w-full h-[550px] border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50"
            />
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            Nenhum arquivo PDF anexado para esta sessão.
          </div>
        )}
      </div>
    </div>
  );
};
