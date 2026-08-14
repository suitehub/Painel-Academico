import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Plus, Upload, Trash2, Edit2, ExternalLink, Download, FileText } from "lucide-react";
import { AppData, Ementa } from "../types";
import { idbSet, idbGet, idbDel, generateUid } from "../lib/idb";

interface EmentasSectionProps {
  appData: AppData;
  onSaveEmenta: (e: Ementa) => void;
  onDeleteEmenta: (id: number) => void;
  onOpenModal: (type: "ementa", payload?: any) => void;
}

export const EmentasSection: React.FC<EmentasSectionProps> = ({
  appData,
  onSaveEmenta,
  onDeleteEmenta,
  onOpenModal,
}) => {
  const [openEmentaId, setOpenEmentaId] = useState<number | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    const urls: Record<number, string> = {};

    async function loadOpenedFiles() {
      if (openEmentaId === null) return;
      const item = appData.ementas.find((e) => e.id === openEmentaId);
      if (!item || !item.idbKey) return;

      try {
        const file = await idbGet(item.idbKey);
        if (file) {
          const url = URL.createObjectURL(file);
          urls[item.id] = url;
          setFileUrls((prev) => ({ ...prev, [item.id]: url }));
        }
      } catch (err) {
        console.error("Erro ao carregar ementa:", err);
      }
    }

    loadOpenedFiles();

    return () => {
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [openEmentaId, appData.ementas]);

  const toggleEmenta = (id: number) => {
    setOpenEmentaId(openEmentaId === id ? null : id);
  };

  const handleRename = (item: Ementa) => {
    const newTitle = prompt("Novo título para a ementa:", item.titulo);
    if (!newTitle || !newTitle.trim()) return;
    onSaveEmenta({ ...item, titulo: newTitle.trim() });
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Ementas & Programas de Disciplina
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Documentos PDF, DOC e DOCX de objetivos, bibliografias e programas de curso
          </p>
        </div>
        <button
          onClick={() => onOpenModal("ementa")}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar Ementa
        </button>
      </div>

      {/* List */}
      {appData.ementas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
          <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-600 dark:text-slate-400">Nenhuma ementa cadastrada.</p>
          <p>Clique em "+ Adicionar Ementa" para anexar os programas do semestre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appData.ementas.map((item) => {
            const isOpen = openEmentaId === item.id;
            const fileUrl = fileUrls[item.id];
            const isPdf = item.tipo?.toLowerCase() === "pdf";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggleEmenta(item.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase shrink-0">
                        .{item.tipo}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors break-words">
                        {item.titulo}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      Arquivo: {item.nomeArquivo}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleEmenta(item.id)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                    >
                      {isOpen ? "Fechar" : "Visualizar"}
                    </button>

                    <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                      <button
                        onClick={() => onOpenModal("ementa", item)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Editar / Substituir"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Excluir a ementa "${item.titulo}"?`)) {
                            onDeleteEmenta(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Opened View */}
                {isOpen && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fadeIn">
                    {fileUrl ? (
                      isPdf ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Guia
                            </a>
                            <a
                              href={fileUrl}
                              download={item.nomeArquivo}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" /> Baixar
                            </a>
                          </div>

                          <iframe
                            src={fileUrl}
                            title={item.titulo}
                            className="w-full h-[500px] border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50"
                          />
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-2">
                          <p className="text-slate-600 dark:text-slate-300">
                            Arquivo <strong>.{item.tipo}</strong> sem suporte para visualização direta no navegador. Use o botão abaixo para baixar.
                          </p>
                          <a
                            href={fileUrl}
                            download={item.nomeArquivo}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-xs"
                          >
                            <Download className="w-4 h-4" /> Baixar Arquivo ({item.nomeArquivo})
                          </a>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-slate-400">Carregando arquivo do banco offline...</p>
                    )}
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
