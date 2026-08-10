import React, { useState } from "react";
import { Sparkles, Send, Bot, User, Loader2, X, Lightbulb, BookOpen, Clock } from "lucide-react";
import { AppData } from "../types";

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AITutorModal: React.FC<AITutorModalProps> = ({ isOpen, onClose, appData }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou seu **Tutor Acadêmico IA**. Como posso te ajudar hoje? Posso montar um cronograma de estudos, explicar conteúdos complexos, resumir suas matérias ou dar dicas para suas próximas provas e trabalhos!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    "Como devo me organizar para as provas desta semana?",
    "Crie uma rotina diária de estudos eficiente",
    "Qual a melhor técnica para revisar anotações de aulas?",
    "Como priorizar meus trabalhos pendentes?",
  ];

  const handleSend = async (promptText?: string) => {
    const query = promptText || input.trim();
    if (!query || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    if (!promptText) setInput("");
    setLoading(true);

    try {
      // Build lightweight context from appData
      const context = {
        totalDisciplinas: appData.disciplinas.length,
        disciplinas: appData.disciplinas.map((d) => d.nome),
        trabalhosPendentes: appData.trabalhos.filter((t) => !t.concluido).map((t) => ({ titulo: t.titulo, entrega: t.dataEntrega })),
        provasProximas: appData.provas.filter((p) => !p.concluido).map((p) => ({ titulo: p.titulo, data: p.data })),
      };

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, context: JSON.stringify(context) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na requisição da IA.");

      setMessages((prev) => [...prev, { role: "assistant", content: data.text }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Desculpe, não consegui obter resposta no momento. (${err.message || "Verifique se a chave de API do Gemini está configurada."})`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] max-h-[680px] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5 text-slate-900 dark:text-white">
                Tutor Acadêmico IA <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Orientação inteligente de estudos em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2 text-xs scrollbar-none">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
          <span className="font-medium text-slate-500 shrink-0">Sugestões:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="shrink-0 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-full text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-none shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-slate-500 text-sm py-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              </div>
              <span className="animate-pulse">Analisando e gerando resposta do tutor...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua dúvida acadêmica ou peça ajuda com o plano de estudos..."
            disabled={loading}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-900 dark:text-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
