import React, { useState, useEffect } from "react";
import {
  Clock,
  Upload,
  Trash2,
  Plus,
  ExternalLink,
  Download,
  FileText,
  Coffee,
  GripVertical,
  Move,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { AppData, HorarioAula } from "../types";
import { idbSet, idbGet, idbDel, generateUid } from "../lib/idb";
import { DIAS_SEMANA_ABREV, DIAS_SEMANA } from "../lib/dateUtils";

interface HorariosSectionProps {
  appData: AppData;
  onSaveHorario: (h: HorarioAula) => void;
  onDeleteHorario: (id: string) => void;
  onUpdateArquivos: (arquivos: any) => void;
}

export interface FixedTimeSlot {
  id: string;
  inicio: string;
  fim: string;
  label: string;
  isBreak?: boolean;
}

export const FIXED_TIME_SLOTS: FixedTimeSlot[] = [
  { id: "slot-1", inicio: "07:15", fim: "08:00", label: "07:15 - 08:00" },
  { id: "slot-2", inicio: "08:00", fim: "08:45", label: "08:00 - 08:45" },
  { id: "slot-3", inicio: "08:45", fim: "09:30", label: "08:45 - 09:30" },
  { id: "slot-4", inicio: "09:30", fim: "09:40", label: "09:30 - 09:40", isBreak: true },
  { id: "slot-5", inicio: "09:40", fim: "10:25", label: "09:40 - 10:25" },
  { id: "slot-6", inicio: "10:25", fim: "11:10", label: "10:25 - 11:10" },
  { id: "slot-7", inicio: "11:10", fim: "11:55", label: "11:10 - 11:55" },
];

export const HorariosSection: React.FC<HorariosSectionProps> = ({
  appData,
  onSaveHorario,
  onDeleteHorario,
  onUpdateArquivos,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Drag and Drop state
  const [draggedSlot, setDraggedSlot] = useState<{
    diaSemana: number;
    inicio: string;
    fim: string;
    disciplinaId: number;
    horarioId?: string;
  } | null>(null);

  const [dragOverCell, setDragOverCell] = useState<{
    diaSemana: number;
    inicio: string;
  } | null>(null);

  // View mode
  const [selectedDayMobile, setSelectedDayMobile] = useState<number>(1);

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

  // Days 1 (Seg) to 6 (Sáb)
  const days = [1, 2, 3, 4, 5, 6];

  // Helper to find existing slot record for a day and time slot
  const getSlotRecord = (diaSemana: number, inicio: string) => {
    return appData.horariosAulas.find(
      (h) => h.diaSemana === diaSemana && h.horaInicio === inicio
    );
  };

  const getDisciplina = (id?: number) => {
    if (!id) return null;
    return appData.disciplinas.find((x) => x.id === id) || null;
  };

  // Assign or move a discipline to a slot
  const handleSlotChange = (
    diaSemana: number,
    slot: FixedTimeSlot,
    newDiscId: number
  ) => {
    const existing = getSlotRecord(diaSemana, slot.inicio);

    if (newDiscId === 0) {
      // Set to Aula Livre (Remove)
      if (existing) {
        onDeleteHorario(existing.id);
      }
    } else {
      // Assign or update
      if (existing) {
        onSaveHorario({
          ...existing,
          disciplinaId: newDiscId,
        });
      } else {
        onSaveHorario({
          id: generateUid("h"),
          disciplinaId: newDiscId,
          diaSemana,
          horaInicio: slot.inicio,
          horaFim: slot.fim,
        });
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    diaSemana: number,
    slot: FixedTimeSlot,
    disciplinaId: number,
    horarioId?: string
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ diaSemana, inicio: slot.inicio, fim: slot.fim, disciplinaId, horarioId })
    );
    setDraggedSlot({
      diaSemana,
      inicio: slot.inicio,
      fim: slot.fim,
      disciplinaId,
      horarioId,
    });
  };

  const handleDragOver = (e: React.DragEvent, diaSemana: number, inicio: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell({ diaSemana, inicio });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetDia: number, targetSlot: FixedTimeSlot) => {
    e.preventDefault();
    setDragOverCell(null);

    if (targetSlot.isBreak) return; // Cannot drop into Intervalo

    try {
      const dataRaw = e.dataTransfer.getData("text/plain");
      if (!dataRaw) return;
      const srcData = JSON.parse(dataRaw);

      if (srcData.diaSemana === targetDia && srcData.inicio === targetSlot.inicio) {
        return; // Dropped on same cell
      }

      const targetExisting = getSlotRecord(targetDia, targetSlot.inicio);

      // Assign dragged discipline to target slot
      if (targetExisting) {
        onSaveHorario({
          ...targetExisting,
          disciplinaId: srcData.disciplinaId,
        });
      } else {
        onSaveHorario({
          id: generateUid("h"),
          disciplinaId: srcData.disciplinaId,
          diaSemana: targetDia,
          horaInicio: targetSlot.inicio,
          horaFim: targetSlot.fim,
        });
      }

      // Move target's previous discipline (if any) to source slot, or clear source slot
      const srcExisting = getSlotRecord(srcData.diaSemana, srcData.inicio);
      if (targetExisting && targetExisting.disciplinaId > 0) {
        if (srcExisting) {
          onSaveHorario({
            ...srcExisting,
            disciplinaId: targetExisting.disciplinaId,
          });
        } else {
          onSaveHorario({
            id: generateUid("h"),
            disciplinaId: targetExisting.disciplinaId,
            diaSemana: srcData.diaSemana,
            horaInicio: srcData.inicio,
            horaFim: srcData.fim,
          });
        }
      } else {
        if (srcExisting) {
          onDeleteHorario(srcExisting.id);
        }
      }
    } catch (err) {
      console.error("Erro ao mover disciplina pelo horário:", err);
    } finally {
      setDraggedSlot(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Grade Horária Acadêmica
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Arraste ou selecione as disciplinas para organizar seus horários. Horários sem aula são marcados como <strong className="text-slate-700 dark:text-slate-300">Aula Livre</strong>. O intervalo de <strong className="text-amber-600 dark:text-amber-400">9:30 às 9:40</strong> é fixo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl font-medium">
              <Move className="w-3.5 h-3.5 text-indigo-500" />
              Arraste para mover
            </span>
          </div>
        </div>

        {/* Mobile Day Selector Tabs */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {days.map((diaNum) => (
            <button
              key={diaNum}
              onClick={() => setSelectedDayMobile(diaNum)}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl shrink-0 transition-all ${
                selectedDayMobile === diaNum
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {DIAS_SEMANA_ABREV[diaNum]}
            </button>
          ))}
        </div>

        {/* Desktop Timetable Matrix Grid */}
        <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs bg-white dark:bg-slate-900">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-900 dark:bg-slate-950 text-white text-xs uppercase tracking-wider font-extrabold border-b border-slate-800">
                <th className="p-3 w-36 text-center border-r border-slate-800">
                  <div className="flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Horário</span>
                  </div>
                </th>
                {days.map((diaNum) => (
                  <th key={diaNum} className="p-3 text-center border-r border-slate-800/60 last:border-r-0">
                    {DIAS_SEMANA[diaNum]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-xs">
              {FIXED_TIME_SLOTS.map((slot) => {
                if (slot.isBreak) {
                  return (
                    <tr key={slot.id} className="bg-amber-500/10 dark:bg-amber-950/30 border-y border-amber-200 dark:border-amber-900/50">
                      <td className="p-2.5 font-bold text-center text-amber-700 dark:text-amber-300 border-r border-amber-200 dark:border-amber-900/50 bg-amber-100/50 dark:bg-amber-950/60 font-mono text-[11px]">
                        {slot.label}
                      </td>
                      <td colSpan={6} className="p-2.5 text-center font-extrabold text-amber-800 dark:text-amber-200 tracking-wide">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-200/60 dark:bg-amber-900/60 rounded-full text-xs">
                          <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                          INTERVALO (9:30 - 9:40) - RECREIO FIXO
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[11px] whitespace-nowrap">
                      {slot.label}
                    </td>

                    {days.map((diaNum) => {
                      const slotRecord = getSlotRecord(diaNum, slot.inicio);
                      const disc = slotRecord ? getDisciplina(slotRecord.disciplinaId) : null;
                      const isHovered =
                        dragOverCell?.diaSemana === diaNum && dragOverCell?.inicio === slot.inicio;

                      return (
                        <td
                          key={diaNum}
                          onDragOver={(e) => handleDragOver(e, diaNum, slot.inicio)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, diaNum, slot)}
                          className={`p-1.5 border-r border-slate-200 dark:border-slate-800/80 last:border-r-0 transition-all ${
                            isHovered
                              ? "bg-emerald-100/80 dark:bg-emerald-950/60 ring-2 ring-emerald-500 inset-0"
                              : ""
                          }`}
                        >
                          <div className="relative group/cell min-h-[58px] flex flex-col justify-between p-2 rounded-xl transition-all">
                            {disc ? (
                              <div
                                draggable
                                onDragStart={(e) =>
                                  handleDragStart(
                                    e,
                                    diaNum,
                                    slot,
                                    disc.id,
                                    slotRecord?.id
                                  )
                                }
                                className="w-full h-full p-2 rounded-xl text-white shadow-xs relative flex flex-col justify-between cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-0.5"
                                style={{
                                  backgroundColor: disc.cor || "#3b82f6",
                                }}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-extrabold text-[11px] leading-tight line-clamp-2">
                                    {disc.nome}
                                  </span>
                                  <GripVertical className="w-3.5 h-3.5 text-white/70 shrink-0 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                                </div>

                                <div className="mt-1 flex items-center justify-between text-[10px] text-white/90">
                                  <span className="truncate max-w-[80px]">
                                    {disc.sala || disc.professor || disc.codigo || "Aula"}
                                  </span>

                                  <select
                                    value={disc.id}
                                    onChange={(e) =>
                                      handleSlotChange(diaNum, slot, Number(e.target.value))
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-black/20 hover:bg-black/40 border-0 rounded text-[10px] text-white font-bold p-0.5 cursor-pointer outline-none max-w-[20px]"
                                    title="Mover ou alterar disciplina neste horário"
                                  >
                                    <option value={0} className="text-slate-800 bg-white">
                                      ⚪ Aula Livre
                                    </option>
                                    {appData.disciplinas.map((d) => (
                                      <option key={d.id} value={d.id} className="text-slate-800 bg-white">
                                        {d.nome}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ) : (
                              /* Aula Livre (Empty slot) */
                              <div className="w-full h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-800/20 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-colors group/free">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover/free:text-emerald-600 dark:group-hover/free:text-emerald-400">
                                  Aula Livre
                                </span>

                                <select
                                  value={0}
                                  onChange={(e) =>
                                    handleSlotChange(diaNum, slot, Number(e.target.value))
                                  }
                                  className="mt-1 w-full text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer outline-none hover:border-emerald-500"
                                >
                                  <option value={0}>+ Definir Aula</option>
                                  {appData.disciplinas.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.nome}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card Grid */}
        <div className="block md:hidden space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-xl font-extrabold text-xs text-center uppercase tracking-wider flex items-center justify-between">
            <span>{DIAS_SEMANA[selectedDayMobile]}</span>
            <span className="text-[10px] text-emerald-400 font-semibold lowercase">
              (selecione a matéria abaixo)
            </span>
          </div>

          <div className="space-y-2.5">
            {FIXED_TIME_SLOTS.map((slot) => {
              if (slot.isBreak) {
                return (
                  <div
                    key={slot.id}
                    className="p-3 bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between text-amber-800 dark:text-amber-200 font-bold text-xs"
                  >
                    <span className="font-mono">{slot.label}</span>
                    <span className="flex items-center gap-1.5 bg-amber-200 dark:bg-amber-900/60 px-2.5 py-1 rounded-full text-[11px]">
                      <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      RECREIO FIXO
                    </span>
                  </div>
                );
              }

              const slotRecord = getSlotRecord(selectedDayMobile, slot.inicio);
              const disc = slotRecord ? getDisciplina(slotRecord.disciplinaId) : null;

              return (
                <div
                  key={slot.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2 text-xs"
                >
                  {/* Slot Top Header: Time + Discipline Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{slot.label}</span>
                    </div>

                    <select
                      value={disc ? disc.id : 0}
                      onChange={(e) =>
                        handleSlotChange(selectedDayMobile, slot, Number(e.target.value))
                      }
                      className="max-w-[160px] px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-800 dark:text-slate-200 outline-none truncate"
                    >
                      <option value={0}>⚪ Aula Livre</option>
                      {appData.disciplinas.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slot Main Content Block */}
                  <div className="w-full min-w-0">
                    {disc ? (
                      <div
                        className="p-2.5 rounded-xl text-white font-bold flex items-center justify-between shadow-2xs w-full"
                        style={{ backgroundColor: disc.cor || "#3b82f6" }}
                      >
                        <span className="truncate text-xs">{disc.nome}</span>
                        {(disc.sala || disc.professor) && (
                          <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-md font-medium shrink-0 ml-2">
                            {disc.sala || disc.professor}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-slate-400 dark:text-slate-500 font-medium italic text-[11px]">
                        Aula Livre (Sem aula atribuída)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
