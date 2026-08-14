import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  TestTube,
  BookOpen,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Calendar as CalendarIcon,
  Edit2,
  Check,
} from "lucide-react";
import { AppData, Trabalho, Prova, Disciplina, Aula, Ementa, AulaReposicao, EventoCalendario } from "../types";
import { todayISO } from "../lib/dateUtils";
import { idbSet, generateUid } from "../lib/idb";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalType: "trabalho" | "prova" | "disciplina" | "aula" | "ementa" | "reposicao" | "evento" | "quickSheet" | null;
  payload?: any;
  appData: AppData;
  onSaveTrabalho: (t: Trabalho) => void;
  onSaveProva: (p: Prova) => void;
  onSaveDisciplina: (d: Disciplina) => void;
  onSaveAula: (a: Aula) => void;
  onSaveEmenta: (e: Ementa) => void;
  onSaveReposicao: (r: AulaReposicao) => void;
  onSaveEvento?: (e: EventoCalendario) => void;
}

const COLOR_PRESETS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  modalType,
  payload,
  appData,
  onSaveTrabalho,
  onSaveProva,
  onSaveDisciplina,
  onSaveAula,
  onSaveEmenta,
  onSaveReposicao,
  onSaveEvento,
}) => {
  const isEditing = Boolean(payload && payload.id);

  const [activeType, setActiveType] = useState<
    "trabalho" | "prova" | "disciplina" | "aula" | "ementa" | "reposicao" | "evento"
  >("trabalho");

  // Form Fields
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(todayISO());
  const [horario, setHorario] = useState("14:00");
  const [categoria, setCategoria] = useState<"evento" | "academico" | "pessoal" | "outro">("academico");
  const [descricao, setDescricao] = useState("");
  const [disciplinaId, setDisciplinaId] = useState<number>(0);
  const [peso, setPeso] = useState<string>("2.0");
  const [nota, setNota] = useState<string>("");
  const [codigo, setCodigo] = useState("");
  const [professor, setProfessor] = useState("");
  const [sala, setSala] = useState("");
  const [cor, setCor] = useState("#10b981");
  const [file, setFile] = useState<File | null>(null);

  // Sync state whenever modal is opened or payload/type changes
  useEffect(() => {
    if (isOpen) {
      let initialType: "trabalho" | "prova" | "disciplina" | "aula" | "ementa" | "reposicao" | "evento" = "trabalho";

      if (modalType && modalType !== "quickSheet") {
        initialType = modalType as any;
      } else if (payload?.dataEntrega) {
        initialType = "trabalho";
      } else if (payload?.codigo || payload?.professor) {
        initialType = "disciplina";
      } else if (payload?.nomeArquivo) {
        initialType = "ementa";
      } else if (payload?.motivo) {
        initialType = "reposicao";
      } else if (payload?.categoria) {
        initialType = "evento";
      } else if (payload?.conteudo !== undefined) {
        initialType = "aula";
      }

      setActiveType(initialType);
      setTitulo(payload?.titulo || payload?.nome || "");
      setData(payload?.dataEntrega || payload?.data || todayISO());
      setHorario(payload?.horario || "14:00");
      setCategoria(payload?.categoria || "academico");
      setDescricao(payload?.descricao || payload?.conteudo || payload?.motivo || "");
      setDisciplinaId(
        payload?.disciplinaId !== undefined && payload?.disciplinaId !== null
          ? Number(payload.disciplinaId)
          : appData.disciplinas[0]?.id || 0
      );
      setPeso(payload?.peso !== undefined ? String(payload.peso) : "2.0");
      setNota(payload?.nota !== undefined && payload?.nota !== null ? String(payload.nota) : "");
      setCodigo(payload?.codigo || "");
      setProfessor(payload?.professor || "");
      setSala(payload?.sala || "");
      setCor(payload?.cor || "#10b981");
      setFile(null);
    }
  }, [isOpen, modalType, payload, appData.disciplinas]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (activeType === "trabalho") {
      if (!titulo.trim()) return alert("Preencha o título do trabalho.");
      onSaveTrabalho({
        id: isEditing ? payload.id : Date.now(),
        titulo: titulo.trim(),
        dataEntrega: data,
        descricao: descricao.trim(),
        concluido: payload?.concluido || false,
        disciplinaId: disciplinaId || undefined,
        peso: peso ? parseFloat(peso) : undefined,
        nota: nota.trim() !== "" ? parseFloat(nota) : undefined,
      });
    } else if (activeType === "prova") {
      if (!titulo.trim()) return alert("Preencha o nome da prova.");
      onSaveProva({
        id: isEditing ? payload.id : Date.now(),
        titulo: titulo.trim(),
        data: data,
        descricao: descricao.trim(),
        concluido: payload?.concluido || false,
        disciplinaId: disciplinaId || undefined,
        peso: peso ? parseFloat(peso) : undefined,
        nota: nota.trim() !== "" ? parseFloat(nota) : undefined,
      });
    } else if (activeType === "disciplina") {
      if (!titulo.trim()) return alert("Preencha o nome da disciplina.");
      onSaveDisciplina({
        id: isEditing ? payload.id : Date.now(),
        nome: titulo.trim(),
        codigo: codigo.trim() || undefined,
        professor: professor.trim() || undefined,
        sala: sala.trim() || undefined,
        cor: cor || "#10b981",
      });
    } else if (activeType === "aula") {
      if (!titulo.trim()) return alert("Preencha o título da aula.");
      if (!disciplinaId) return alert("Selecione uma matéria.");
      onSaveAula({
        id: isEditing ? payload.id : Date.now(),
        disciplinaId,
        titulo: titulo.trim(),
        conteudo: descricao.trim(),
        data,
      });
    } else if (activeType === "ementa") {
      if (!titulo.trim()) return alert("Preencha o título da ementa.");
      if (!file && !payload?.idbKey) return alert("Selecione um arquivo PDF, DOC ou DOCX.");

      let key = payload?.idbKey || "";
      let filename = payload?.nomeArquivo || "";
      let ext = payload?.tipo || "";

      if (file) {
        key = generateUid("ementa");
        await idbSet(key, file);
        filename = file.name;
        ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      }

      onSaveEmenta({
        id: isEditing ? payload.id : Date.now(),
        titulo: titulo.trim(),
        nomeArquivo: filename,
        tipo: ext,
        idbKey: key,
        disciplinaId: disciplinaId || undefined,
      });
    } else if (activeType === "reposicao") {
      if (!disciplinaId) return alert("Selecione uma matéria.");
      if (!data) return alert("Selecione a data da reposição.");
      onSaveReposicao({
        id: isEditing ? payload.id : Date.now(),
        disciplinaId,
        data,
        horario: horario.trim() || undefined,
        sala: sala.trim() || undefined,
        motivo: descricao.trim() || undefined,
        concluida: payload?.concluida || false,
      });
    } else if (activeType === "evento") {
      if (!titulo.trim()) return alert("Preencha o título do evento.");
      if (onSaveEvento) {
        onSaveEvento({
          id: isEditing ? payload.id : Date.now(),
          titulo: titulo.trim(),
          data,
          horario: horario.trim() || undefined,
          descricao: descricao.trim() || undefined,
          categoria,
          concluido: payload?.concluido || false,
        });
      }
    }

    onClose();
  };

  const getLabelByType = (type: string) => {
    switch (type) {
      case "trabalho":
        return "Trabalho";
      case "prova":
        return "Prova";
      case "disciplina":
        return "Disciplina";
      case "aula":
        return "Aula";
      case "ementa":
        return "Ementa";
      case "reposicao":
        return "Reposição";
      case "evento":
        return "Evento";
      default:
        return "Item";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl text-white ${
                isEditing ? "bg-amber-500" : "bg-emerald-500"
              }`}
            >
              {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {isEditing ? `Editar ${getLabelByType(activeType)}` : modalType === "quickSheet" ? "Adicionar Rápido" : `Novo(a) ${getLabelByType(activeType)}`}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isEditing ? "Modifique os campos abaixo e salve as alterações." : "Preencha as informações para salvar."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs (Only shown when adding new items from quickSheet) */}
        {!isEditing && (!modalType || modalType === "quickSheet") && (
          <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto text-xs font-semibold scrollbar-none">
            {[
              { type: "trabalho", label: "📝 Trabalho", icon: FileText },
              { type: "prova", label: "🧪 Prova", icon: TestTube },
              { type: "evento", label: "🎉 Evento", icon: CalendarIcon },
              { type: "disciplina", label: "📚 Disciplina", icon: BookOpen },
              { type: "aula", label: "✍️ Aula", icon: FileText },
              { type: "reposicao", label: "🔄 Reposição", icon: RotateCcw },
              { type: "ementa", label: "📄 Ementa", icon: FileSpreadsheet },
            ].map((tab) => (
              <button
                key={tab.type}
                onClick={() => setActiveType(tab.type as any)}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                  activeType === tab.type
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Title / Name input */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              {activeType === "disciplina"
                ? "Nome da Disciplina:"
                : activeType === "evento"
                ? "Título do Evento:"
                : "Título:"}
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={
                activeType === "trabalho"
                  ? "Ex: Relatório de Laboratório"
                  : activeType === "prova"
                  ? "Ex: P1 de Cálculo"
                  : activeType === "evento"
                  ? "Ex: Simpósio de Tecnologia / Feira de Carreiras"
                  : activeType === "disciplina"
                  ? "Ex: Estrutura de Dados"
                  : activeType === "aula"
                  ? "Ex: Resolução de Exercícios"
                  : "Ex: Ementa de Cálculo 1"
              }
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Disciplina extra fields */}
          {activeType === "disciplina" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Código da Matéria:
                  </label>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ex: MAT01 / CC102"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Professor(a):
                  </label>
                  <input
                    type="text"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="Ex: Prof. Roberto Carlos"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Sala / Local:
                  </label>
                  <input
                    type="text"
                    value={sala}
                    onChange={(e) => setSala(e.target.value)}
                    placeholder="Ex: Sala 204 - Bloco C"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Cor de Identificação:
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCor(c)}
                        className="w-6 h-6 rounded-full transition-transform flex items-center justify-center border border-white/20"
                        style={{ backgroundColor: c, transform: cor === c ? "scale(1.2)" : "scale(1)" }}
                      >
                        {cor === c && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Discipline selector for assignment, exam, lecture, reposicao, syllabus */}
          {activeType !== "disciplina" && activeType !== "evento" && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Matéria / Disciplina:
              </label>
              <select
                value={disciplinaId}
                onChange={(e) => setDisciplinaId(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
              >
                {appData.disciplinas.length === 0 && <option value={0}>Nenhuma matéria cadastrada</option>}
                {appData.disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome} {d.codigo ? `(${d.codigo})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time picker */}
          {(activeType === "trabalho" ||
            activeType === "prova" ||
            activeType === "aula" ||
            activeType === "evento" ||
            activeType === "reposicao") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {activeType === "trabalho"
                    ? "Data de Entrega:"
                    : activeType === "prova"
                    ? "Data da Prova:"
                    : "Data:"}
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {(activeType === "evento" || activeType === "reposicao") && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Horário:
                  </label>
                  <input
                    type="text"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    placeholder="Ex: 14:00 ou 14:00 - 16:00"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              )}

              {activeType === "reposicao" && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Sala / Local (Opcional):
                  </label>
                  <input
                    type="text"
                    value={sala}
                    onChange={(e) => setSala(e.target.value)}
                    placeholder="Ex: Lab 02 / Sala 10"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              )}
            </div>
          )}

          {/* Category for Event */}
          {activeType === "evento" && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Categoria:</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
              >
                <option value="academico">🎓 Acadêmico (Palestra, Congresso, Feira)</option>
                <option value="evento">🎉 Evento Geral / Festivo</option>
                <option value="pessoal">👤 Compromisso Pessoal</option>
                <option value="outro">📌 Outro</option>
              </select>
            </div>
          )}

          {/* Weight and Grade picker for assignment and exam */}
          {(activeType === "trabalho" || activeType === "prova") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Peso / Valor da Avaliação:
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 2.0"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Nota Obtida (Opcional):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Ex: 8.5"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>
          )}

          {/* File picker for ementa */}
          {activeType === "ementa" && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                {payload?.nomeArquivo ? "Substituir Arquivo (PDF, DOC, DOCX):" : "Arquivo (PDF, DOC, DOCX):"}
              </label>
              {payload?.nomeArquivo && (
                <div className="mb-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">Arquivo atual: {payload.nomeArquivo}</span>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {payload?.nomeArquivo
                  ? "Envie um novo arquivo apenas se desejar substituir o atual."
                  : "O arquivo será armazenado localmente em seu aparelho via IndexedDB."}
              </p>
            </div>
          )}

          {/* Description / Content textarea */}
          {activeType !== "ementa" && activeType !== "disciplina" && (
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                {activeType === "aula"
                  ? "Anotações da Aula:"
                  : activeType === "reposicao"
                  ? "Motivo da Reposição / Observações:"
                  : "Descrição e Observações:"}
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Insira detalhes, local, observações ou requisitos..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 ${
              isEditing
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4" /> Salvar Alterações
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Adicionar {getLabelByType(activeType)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
