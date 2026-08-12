import React, { useState } from "react";
import { X, FileText, TestTube, BookOpen, FileSpreadsheet, Plus, RotateCcw, Calendar as CalendarIcon } from "lucide-react";
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
  const [activeType, setActiveType] = useState<"trabalho" | "prova" | "disciplina" | "aula" | "ementa" | "reposicao" | "evento">(
    modalType === "quickSheet" || !modalType ? "trabalho" : (modalType as any)
  );

  // Common Form Fields
  const [titulo, setTitulo] = useState(payload?.titulo || payload?.nome || "");
  const [data, setData] = useState(payload?.dataEntrega || payload?.data || todayISO());
  const [horario, setHorario] = useState(payload?.horario || "14:00");
  const [categoria, setCategoria] = useState<"evento" | "academico" | "pessoal" | "outro">(payload?.categoria || "academico");
  const [descricao, setDescricao] = useState(payload?.descricao || payload?.conteudo || "");
  const [disciplinaId, setDisciplinaId] = useState<number>(
    payload?.disciplinaId || appData.disciplinas[0]?.id || 0
  );
  const [peso, setPeso] = useState<string>(payload?.peso !== undefined ? String(payload.peso) : "2.0");
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (activeType === "trabalho") {
      if (!titulo.trim()) return alert("Preencha o título do trabalho.");
      onSaveTrabalho({
        id: payload?.id || Date.now(),
        titulo: titulo.trim(),
        dataEntrega: data,
        descricao: descricao.trim(),
        concluido: payload?.concluido || false,
        disciplinaId: disciplinaId || undefined,
        peso: peso ? parseFloat(peso) : undefined,
        nota: payload?.nota,
      });
    } else if (activeType === "prova") {
      if (!titulo.trim()) return alert("Preencha o nome da prova.");
      onSaveProva({
        id: payload?.id || Date.now(),
        titulo: titulo.trim(),
        data: data,
        descricao: descricao.trim(),
        concluido: payload?.concluido || false,
        disciplinaId: disciplinaId || undefined,
        peso: peso ? parseFloat(peso) : undefined,
        nota: payload?.nota,
      });
    } else if (activeType === "disciplina") {
      if (!titulo.trim()) return alert("Preencha o nome da disciplina.");
      onSaveDisciplina({
        id: payload?.id || Date.now(),
        nome: titulo.trim(),
        codigo: payload?.codigo || "",
        professor: payload?.professor || "",
        sala: payload?.sala || "",
        cor: payload?.cor || "#10b981",
      });
    } else if (activeType === "aula") {
      if (!titulo.trim()) return alert("Preencha o título da aula.");
      if (!disciplinaId) return alert("Selecione uma matéria.");
      onSaveAula({
        id: payload?.id || Date.now(),
        disciplinaId,
        titulo: titulo.trim(),
        conteudo: descricao.trim(),
        data,
      });
    } else if (activeType === "ementa") {
      if (!titulo.trim()) return alert("Preencha o título da ementa.");
      if (!file && !payload?.idbKey) return alert("Selecione um arquivo PDF, DOC ou DOCX.");

      let key = payload?.idbKey;
      let filename = payload?.nomeArquivo || "";
      let ext = payload?.tipo || "";

      if (file) {
        key = generateUid("ementa");
        await idbSet(key, file);
        filename = file.name;
        ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      }

      onSaveEmenta({
        id: payload?.id || Date.now(),
        titulo: titulo.trim(),
        nomeArquivo: filename,
        tipo: ext,
        idbKey: key,
        disciplinaId: disciplinaId || undefined,
      });
    } else if (activeType === "reposicao") {
      if (!disciplinaId) return alert("Selecione uma matéria.");
      onSaveReposicao({
        id: payload?.id || Date.now(),
        disciplinaId,
        data,
        horario: payload?.horario || undefined,
        sala: payload?.sala || undefined,
        motivo: descricao.trim() || undefined,
        concluida: payload?.concluida || false,
      });
    } else if (activeType === "evento") {
      if (!titulo.trim()) return alert("Preencha o título do evento.");
      if (onSaveEvento) {
        onSaveEvento({
          id: payload?.id || Date.now(),
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" /> {payload ? "Editar Item" : "Adicionar Rápido"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        {!payload && (
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
          {/* Title input */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">
              {activeType === "disciplina" ? "Nome da Disciplina:" : activeType === "evento" ? "Título do Evento:" : "Título:"}
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

          {/* Discipline selector for assignment, exam, lecture, syllabus */}
          {activeType !== "disciplina" && activeType !== "evento" && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                Matéria / Disciplina:
              </label>
              <select
                value={disciplinaId}
                onChange={(e) => setDisciplinaId(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
              >
                {appData.disciplinas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date picker */}
          {(activeType === "trabalho" || activeType === "prova" || activeType === "aula" || activeType === "evento" || activeType === "reposicao") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Data:
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {activeType === "evento" && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Horário:</label>
                  <input
                    type="text"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    placeholder="Ex: 14:00"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              )}
            </div>
          )}

          {/* Category for Event */}
          {activeType === "evento" && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">Categoria:</label>
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

          {/* Weight picker for assignment and exam */}
          {(activeType === "trabalho" || activeType === "prova") && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">Peso / Valor:</label>
              <input
                type="number"
                step="0.1"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Ex: 2.0"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          )}

          {/* File picker for ementa */}
          {activeType === "ementa" && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">Arquivo (PDF, DOC, DOCX):</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">O arquivo será armazenado localmente em seu aparelho via IndexedDB.</p>
            </div>
          )}

          {/* Description / Content textarea */}
          {activeType !== "ementa" && activeType !== "disciplina" && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                {activeType === "aula" ? "Anotações da Aula:" : "Descrição e Observações:"}
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
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all"
          >
            Salvar Item
          </button>
        </div>
      </div>
    </div>
  );
};
