import React, { useState } from "react";
import { Download, Upload, Moon, Sun, RefreshCw, Shield, HardDrive, CheckCircle2, Trash2 } from "lucide-react";
import { AppData } from "../types";
import { idbGet, idbSet, idbClear } from "../lib/idb";
import { getInitialData, getEmptyData } from "../lib/storage";

interface ConfigSectionProps {
  appData: AppData;
  onRestoreData: (data: AppData) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  appData,
  onRestoreData,
  darkMode,
  onToggleDarkMode,
}) => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fileToDataURL = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleExportBackup = async () => {
    setExporting(true);
    setStatusMsg("Coletando metadados e arquivos para o backup...");

    try {
      const payload: any = JSON.parse(JSON.stringify(appData));
      payload.__files = {};

      // Backup timetable & calendar files
      for (const slot of ["horarios", "calendario"] as const) {
        const info = payload.arquivos?.[slot];
        if (info?.idbKey) {
          const blob = await idbGet(info.idbKey);
          if (blob) {
            payload.__files[info.idbKey] = {
              name: info.nome,
              type: blob.type,
              dataURL: await fileToDataURL(blob),
            };
          }
        }
      }

      // Backup ementas files
      for (const e of payload.ementas || []) {
        if (e.idbKey) {
          const blob = await idbGet(e.idbKey);
          if (blob) {
            payload.__files[e.idbKey] = {
              name: e.nomeArquivo,
              type: blob.type,
              dataURL: await fileToDataURL(blob),
            };
          }
        }
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `backup-painel-academico-${new Date().toISOString().split("T")[0]}.json`;
      a.click();

      setStatusMsg("Backup exportado com sucesso (incluindo arquivos PDF)!");
    } catch (err: any) {
      console.error(err);
      setStatusMsg("Falha ao exportar backup.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportBackup = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setImporting(true);
      setStatusMsg("Restaurando dados do backup...");

      try {
        const text = await file.text();
        const payload = JSON.parse(text);

        // Restore files into IndexedDB
        if (payload.__files) {
          for (const [key, meta] of Object.entries<any>(payload.__files)) {
            const blobRes = await fetch(meta.dataURL);
            const blob = await blobRes.blob();
            const restoredFile = new File([blob], meta.name, { type: meta.type });
            await idbSet(key, restoredFile);
          }
        }

        delete payload.__files;

        const cleanData: AppData = {
          disciplinas: payload.disciplinas || [],
          aulas: payload.aulas || [],
          trabalhos: payload.trabalhos || [],
          provas: payload.provas || [],
          ementas: payload.ementas || [],
          horariosAulas: payload.horariosAulas || [],
          arquivos: payload.arquivos || { horarios: null, calendario: null },
        };

        onRestoreData(cleanData);
        setStatusMsg("Backup restaurado com sucesso!");
      } catch (err) {
        console.error(err);
        setStatusMsg("Falha ao importar arquivo de backup JSON.");
      } finally {
        setImporting(false);
      }
    };

    input.click();
  };

  const handleResetData = () => {
    if (confirm("Deseja restaurar os dados de exemplo padrão? Todas as alterações atuais serão sobrescritas.")) {
      const sample = getInitialData();
      onRestoreData(sample);
      setStatusMsg("Dados resetados para os exemplos acadêmicos iniciais.");
    }
  };

  const handleClearAllData = async () => {
    if (confirm("⚠️ Tem certeza que deseja APAGAR TODOS os dados e arquivos salvos? Esta ação não pode ser desfeita.")) {
      await idbClear();
      onRestoreData(getEmptyData());
      setStatusMsg("Todos os dados e arquivos foram apagados com sucesso.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-3xl">
      {statusMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Backup Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-500" /> Backup Completo do Painel
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Seus dados são 100% privados e salvos no navegador. Faça exportação periódica para garantir cópias de segurança.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportBackup}
            disabled={exporting}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar Backup (com PDFs)
          </button>

          <button
            onClick={handleImportBackup}
            disabled={importing}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" /> Importar Backup JSON
          </button>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />} Tema Visual
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Alterne entre modo claro e modo escuro otimizado para longas leituras
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDarkMode}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-2"
          >
            {darkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          </button>
        </div>
      </div>

      {/* Reset & Privacy Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" /> Dados & Limpeza do Painel
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gerencie o armazenamento do aplicativo. Apague tudo ou restaure os dados de exemplo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleClearAllData}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Apagar Todos os Dados
          </button>

          <button
            onClick={handleResetData}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs transition-colors border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Carregar Dados de Exemplo
          </button>
        </div>
      </div>
    </div>
  );
};
