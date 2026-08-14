import React, { useState } from "react";
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  AlertCircle,
  X,
} from "lucide-react";
import { AppData, AulaReposicao, FiltroTipo } from "../types";
import { todayISO, isWithinNext7Days, isPast, fmtBR } from "../lib/dateUtils";

interface ReposicoesSectionProps {
  appData: AppData;
  searchQuery?: string;
  onSaveReposicao: (r: AulaReposicao) => void;
  onDeleteReposicao: (id: number) => void;
  onToggleReposicaoConcluida?: (id: number) => void;
  onOpenModal?: (type: "reposicao", payload?: any) => void;
}

export const ReposicoesSection: React.FC<ReposicoesSectionProps> = ({
  appData,
  searchQuery = "",
  onSaveReposicao,
  onDeleteReposicao,
  onToggleReposicaoConcluida,
  onOpenModal,
}) => {
  const hoje = todayISO();
  const [filter, setFilter] = useState<FiltroTipo>("ativos");
  const [localSearch, setLocalSearch] = useState("");
  const [editingItem, setEditingItem] = useState<AulaReposicao | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const effectiveSearch = (searchQuery || localSearch).trim().toLowerCase();

  const handleToggle = (item: AulaReposicao, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onToggleReposicaoConcluida) {
      onToggleReposicaoConcluida(item.id);
    } else {
      onSaveReposicao({ ...item, concluida: !item.concluida });
    }
  };

  // Form states
  const [disciplinaId, setDisciplinaId] = useState<number>(
    appData.disciplinas[0]?.id || 0
  );
  const [data, setData] = useState(hoje);
  const [horario, setHorario] = useState("");
  const [sala, setSala] = useState("");
  const [motivo, setMotivo] = useState("");

  const handleOpenForm = (item?: AulaReposicao) => {
    if (item) {
      setEditingItem(item);
      setDisciplinaId(item.disciplinaId);
      setData(item.data);
      setHorario(item.horario || "");
      setSala(item.sala || "");
      setMotivo(item.motivo || "");
    } else {
      setEditingItem(null);
      setDisciplinaId(appData.disciplinas[0]?.id || 0);
      setData(hoje);
      setHorario("");
      setSala("");
      setMotivo("");
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplinaId) return alert("Por favor, selecione uma matéria.");
    if (!data) return alert("Por favor, selecione uma data para a reposição.");

    const item: AulaReposicao = {
      id: editingItem?.id || Date.now(),
      disciplinaId,
      data,
      horario: horario.trim() || undefined,
      sala: sala.trim() || undefined,
      motivo: motivo.trim() || undefined,
      concluida: editingItem?.concluida || false,
    };

    onSaveReposicao(item);
    handleCloseForm();
  };

  // Filter logic
  const filteredList = appData.reposicoes.filter((item) => {
    const disc = appData.disciplinas.find((d) => d.id === item.disciplinaId);
    const discNome = disc?.nome || "";
    const matchesSearch =
      discNome.toLowerCase().includes(effectiveSearch) ||
      (item.motivo || "").toLowerCase().includes(effectiveSearch) ||
      (item.sala || "").toLowerCase().includes(effectiveSearch);

    if (!matchesSearch) return false;

    if (filter === "ativos") return !item.concluida;
    if (filter === "hoje") return !item.concluida && item.data === hoje;
    if (filter === "7d") return !item.concluida && isWithinNext7Days(item.data);
    if (filter === "atrasados") return !item.concluida && isPast(item.data);
    if (filter === "concluidos") return item.concluida;

    return true;
  });

  // Sort by date ascending
  const sortedList = [...filteredList].sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Aulas de Reposição
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agende e acompanhe todas as aulas de reposição do semestre
              </p>
            </div>
          </div>

          <button
            onClick={() => (onOpenModal ? onOpenModal("reposicao") : handleOpenForm())}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Agendar Reposição
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3 pt-2">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por matéria, motivo..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full scrollbar-none text-xs font-semibold">
            {[
              { id: "ativos", label: "Pendentes" },
              { id: "hoje", label: "Hoje" },
              { id: "7d", label: "Esta Semana" },
              { id: "atrasados", label: "Atrasadas" },
              { id: "concluidos", label: "Realizadas" },
              { id: "todos", label: "Todas" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as FiltroTipo)}
                className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                  filter === f.id
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form Modal / In-place Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                {editingItem ? "Editar Reposição" : "Nova Aula de Reposição"}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs">
              {/* Disciplina */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Matéria / Disciplina:
                </label>
                <select
                  value={disciplinaId}
                  onChange={(e) => setDisciplinaId(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
                >
                  {appData.disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Data da Reposição:
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Horário e Sala (Grid) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Horário (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 14:00 - 16:00"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Sala / Local (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lab 02 / Bloco A"
                    value={sala}
                    onChange={(e) => setSala(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Motivo / Descrição */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Motivo / Observações:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Reposição da aula do dia 12 devido a feriado..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List of Reposições Cards */}
      {sortedList.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma aula de reposição encontrada
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Você pode agendar aulas de reposição clicando no botão acima ou pedindo para o Tutor IA.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedList.map((item) => {
            const disc = appData.disciplinas.find((d) => d.id === item.disciplinaId);
            const discCor = disc?.cor || "#f59e0b";
            const isToday = item.data === hoje;
            const isUpcoming = isWithinNext7Days(item.data);
            const isOverdue = !item.concluida && isPast(item.data);

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all shadow-xs space-y-3 ${
                  item.concluida
                    ? "border-slate-200 dark:border-slate-800 opacity-60"
                    : isToday
                    ? "border-amber-500/80 ring-2 ring-amber-500/20"
                    : isOverdue
                    ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Header line with Discipline & Status tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: discCor }}
                    />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {disc?.nome || "Matéria"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.concluida ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        Realizada
                      </span>
                    ) : isToday ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                        ⚠️ Hoje
                      </span>
                    ) : isUpcoming ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                        Esta Semana
                      </span>
                    ) : isOverdue ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                        Pendente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                        Agendada
                      </span>
                    )}
                  </div>
                </div>

                {/* Details (Date, Time, Room) */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Data: {fmtBR(item.data)}
                    </span>
                  </div>

                  {item.horario && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Horário: {item.horario}</span>
                    </div>
                  )}

                  {item.sala && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Local: {item.sala}</span>
                    </div>
                  )}

                  {item.motivo && (
                    <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="italic">{item.motivo}</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={(e) => handleToggle(item, e)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      item.concluida
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40 hover:bg-emerald-100"
                        : "text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    {item.concluida ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                        <span>Realizada</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-slate-400" />
                        <span>Marcar como Realizada</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => (onOpenModal ? onOpenModal("reposicao", item) : handleOpenForm(item))}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteReposicao(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
