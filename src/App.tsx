import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { AppData, TabSection, Trabalho, Prova, Disciplina, Aula, Ementa, HorarioAula } from "./types";
import { loadAppData, saveAppData, clearAllData, getEmptyData } from "./lib/storage";
import { idbClear } from "./lib/idb";
import {
  subscribeToAuth,
  loginWithGoogle,
  logoutFirebase,
  saveUserDataToFirestore,
  subscribeUserDataFromFirestore,
} from "./lib/firebase";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { Header } from "./components/Header";
import { GeralSection } from "./components/GeralSection";
import { TrabalhosSection } from "./components/TrabalhosSection";
import { ProvasSection } from "./components/ProvasSection";
import { AulasSection } from "./components/AulasSection";
import { HorariosSection } from "./components/HorariosSection";
import { CalendarioSection } from "./components/CalendarioSection";
import { EmentasSection } from "./components/EmentasSection";
import { ConfigSection } from "./components/ConfigSection";
import { AITutorModal } from "./components/AITutorModal";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { QuickAddModal } from "./components/QuickAddModal";

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<TabSection>("geral");
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("academic_theme") === "dark";
  });

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Firestore realtime sync when user is logged in
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeDoc = subscribeUserDataFromFirestore(
      currentUser.uid,
      (remoteData) => {
        setAppData(remoteData);
        saveAppData(remoteData);
        setLastSyncTime(new Date().toISOString());
      },
      (err) => {
        console.error("Erro ao escutar Firestore:", err);
      }
    );

    return () => unsubscribeDoc();
  }, [currentUser?.uid]);

  // Modals state
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [quickAddModal, setQuickAddModal] = useState<{
    isOpen: boolean;
    type: "trabalho" | "prova" | "disciplina" | "aula" | "ementa" | "quickSheet" | null;
    payload?: any;
  }>({
    isOpen: false,
    type: null,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark mode class with <html> and <body> elements
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("academic_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("academic_theme", "light");
    }
  }, [darkMode]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const updateAppData = (updater: (prev: AppData) => AppData) => {
    setAppData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      if (currentUser) {
        saveUserDataToFirestore(currentUser.uid, next)
          .then(() => setLastSyncTime(new Date().toISOString()))
          .catch((err) => console.error("Erro ao salvar no Firestore:", err));
      }
      return next;
    });
  };

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast(`Bem-vindo(a), ${user.displayName || user.email}!`);
      }
    } catch (err) {
      showToast("Falha ao realizar login com o Google.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      showToast("Desconectado da conta Google.");
    } catch (err) {
      showToast("Falha ao fazer logout.");
    }
  };

  const handleManualSync = async () => {
    if (currentUser) {
      try {
        await saveUserDataToFirestore(currentUser.uid, appData);
        setLastSyncTime(new Date().toISOString());
        showToast("Sincronização com o Firebase concluída!");
      } catch (err) {
        showToast("Erro ao sincronizar com a nuvem.");
      }
    }
  };

  // Handlers for Trabalhos
  const handleSaveTrabalho = (t: Trabalho) => {
    updateAppData((prev) => {
      const exists = prev.trabalhos.some((x) => x.id === t.id);
      const newTrabalhos = exists
        ? prev.trabalhos.map((x) => (x.id === t.id ? t : x))
        : [...prev.trabalhos, t];
      return { ...prev, trabalhos: newTrabalhos };
    });
    showToast("Trabalho salvo com sucesso!");
  };

  const handleDeleteTrabalho = (id: number) => {
    updateAppData((prev) => ({
      ...prev,
      trabalhos: prev.trabalhos.filter((x) => x.id !== id),
    }));
    showToast("Trabalho excluído.");
  };

  // Handlers for Provas
  const handleSaveProva = (p: Prova) => {
    updateAppData((prev) => {
      const exists = prev.provas.some((x) => x.id === p.id);
      const newProvas = exists
        ? prev.provas.map((x) => (x.id === p.id ? p : x))
        : [...prev.provas, p];
      return { ...prev, provas: newProvas };
    });
    showToast("Prova salva com sucesso!");
  };

  const handleDeleteProva = (id: number) => {
    updateAppData((prev) => ({
      ...prev,
      provas: prev.provas.filter((x) => x.id !== id),
    }));
    showToast("Prova excluída.");
  };

  // Handlers for Disciplinas
  const handleSaveDisciplina = (d: Disciplina) => {
    updateAppData((prev) => {
      const exists = prev.disciplinas.some((x) => x.id === d.id);
      const newDisciplinas = exists
        ? prev.disciplinas.map((x) => (x.id === d.id ? d : x))
        : [...prev.disciplinas, d];
      return { ...prev, disciplinas: newDisciplinas };
    });
    showToast("Disciplina salva com sucesso!");
  };

  const handleDeleteDisciplina = (id: number) => {
    updateAppData((prev) => ({
      ...prev,
      disciplinas: prev.disciplinas.filter((x) => x.id !== id),
      aulas: prev.aulas.filter((a) => a.disciplinaId !== id),
    }));
    showToast("Disciplina excluída.");
  };

  // Handlers for Aulas
  const handleSaveAula = (a: Aula) => {
    updateAppData((prev) => {
      const exists = prev.aulas.some((x) => x.id === a.id);
      const newAulas = exists
        ? prev.aulas.map((x) => (x.id === a.id ? a : x))
        : [...prev.aulas, a];
      return { ...prev, aulas: newAulas };
    });
    showToast("Aula salva com sucesso!");
  };

  const handleDeleteAula = (id: number) => {
    updateAppData((prev) => ({
      ...prev,
      aulas: prev.aulas.filter((x) => x.id !== id),
    }));
    showToast("Aula excluída.");
  };

  // Handlers for Ementas
  const handleSaveEmenta = (e: Ementa) => {
    updateAppData((prev) => {
      const exists = prev.ementas.some((x) => x.id === e.id);
      const newEmentas = exists
        ? prev.ementas.map((x) => (x.id === e.id ? e : x))
        : [...prev.ementas, e];
      return { ...prev, ementas: newEmentas };
    });
    showToast("Ementa salva com sucesso!");
  };

  const handleDeleteEmenta = (id: number) => {
    updateAppData((prev) => ({
      ...prev,
      ementas: prev.ementas.filter((x) => x.id !== id),
    }));
    showToast("Ementa excluída.");
  };

  // Handlers for Horarios
  const handleSaveHorario = (h: HorarioAula) => {
    updateAppData((prev) => {
      const exists = prev.horariosAulas.some((x) => x.id === h.id);
      const newHorarios = exists
        ? prev.horariosAulas.map((x) => (x.id === h.id ? h : x))
        : [...prev.horariosAulas, h];
      return { ...prev, horariosAulas: newHorarios };
    });
    showToast("Horário adicionado à grade!");
  };

  const handleDeleteHorario = (id: string) => {
    updateAppData((prev) => ({
      ...prev,
      horariosAulas: prev.horariosAulas.filter((x) => x.id !== id),
    }));
    showToast("Horário removido.");
  };

  const handleUpdateArquivos = (arquivos: any) => {
    updateAppData((prev) => ({ ...prev, arquivos }));
    showToast("Arquivos de mídia atualizados!");
  };

  const handleRestoreData = (newFullData: AppData) => {
    setAppData(newFullData);
    saveAppData(newFullData);
    showToast("Dados restaurados com sucesso!");
  };

  const openQuickAddModal = (
    type: "trabalho" | "prova" | "disciplina" | "aula" | "ementa" | "quickSheet" = "quickSheet",
    payload?: any
  ) => {
    setQuickAddModal({ isOpen: true, type, payload });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-slideUp border border-slate-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenAITutor={() => setIsAITutorOpen(true)}
        onOpenPomodoro={() => setIsPomodoroOpen(!isPomodoroOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenQuickAdd={() => openQuickAddModal("quickSheet")}
          onOpenAITutor={() => setIsAITutorOpen(true)}
          onOpenPomodoro={() => setIsPomodoroOpen(!isPomodoroOpen)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />

        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          {/* Floating Pomodoro Widget if toggled */}
          {isPomodoroOpen && (
            <div className="mb-6 animate-fadeIn">
              <PomodoroTimer onClose={() => setIsPomodoroOpen(false)} />
            </div>
          )}

          {currentTab === "geral" && (
            <GeralSection
              appData={appData}
              onSelectTab={setCurrentTab}
              onOpenQuickAdd={() => openQuickAddModal("quickSheet")}
              onOpenAITutor={() => setIsAITutorOpen(true)}
              onEditTrabalho={(t) => openQuickAddModal("trabalho", t)}
              onEditProva={(p) => openQuickAddModal("prova", p)}
            />
          )}

          {currentTab === "trabalhos" && (
            <TrabalhosSection
              appData={appData}
              searchQuery={searchQuery}
              onSaveTrabalho={handleSaveTrabalho}
              onDeleteTrabalho={handleDeleteTrabalho}
              onOpenModal={(type, payload) => openQuickAddModal(type, payload)}
            />
          )}

          {currentTab === "provas" && (
            <ProvasSection
              appData={appData}
              searchQuery={searchQuery}
              onSaveProva={handleSaveProva}
              onDeleteProva={handleDeleteProva}
              onOpenModal={(type, payload) => openQuickAddModal(type, payload)}
            />
          )}

          {currentTab === "aulas" && (
            <AulasSection
              appData={appData}
              onSaveDisciplina={handleSaveDisciplina}
              onDeleteDisciplina={handleDeleteDisciplina}
              onSaveAula={handleSaveAula}
              onDeleteAula={handleDeleteAula}
              onOpenModal={(type, payload) => openQuickAddModal(type, payload)}
            />
          )}

          {currentTab === "horarios" && (
            <HorariosSection
              appData={appData}
              onSaveHorario={handleSaveHorario}
              onDeleteHorario={handleDeleteHorario}
              onUpdateArquivos={handleUpdateArquivos}
            />
          )}

          {currentTab === "calendario" && (
            <CalendarioSection
              appData={appData}
              onUpdateArquivos={handleUpdateArquivos}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === "ementa" && (
            <EmentasSection
              appData={appData}
              onSaveEmenta={handleSaveEmenta}
              onDeleteEmenta={handleDeleteEmenta}
              onOpenModal={(type) => openQuickAddModal(type)}
            />
          )}

          {currentTab === "config" && (
            <ConfigSection
              appData={appData}
              onRestoreData={handleRestoreData}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              currentUser={currentUser}
              onLogin={handleLogin}
              onLogout={handleLogout}
              onManualSync={handleManualSync}
              lastSyncTime={lastSyncTime}
            />
          )}
        </main>
      </div>

      {/* Mobile Scrollable Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddModal.isOpen}
        onClose={() => setQuickAddModal({ isOpen: false, type: null })}
        modalType={quickAddModal.type}
        payload={quickAddModal.payload}
        appData={appData}
        onSaveTrabalho={handleSaveTrabalho}
        onSaveProva={handleSaveProva}
        onSaveDisciplina={handleSaveDisciplina}
        onSaveAula={handleSaveAula}
        onSaveEmenta={handleSaveEmenta}
      />

      {/* AI Tutor Chatbot Modal */}
      <AITutorModal
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
        appData={appData}
      />
    </div>
  );
}
