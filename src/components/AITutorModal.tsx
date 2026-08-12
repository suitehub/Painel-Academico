import React, { useState } from "react";
import { Sparkles, Send, Bot, User, Loader2, X, Lightbulb, Check, PlusCircle, Calendar, BookOpen, FileCheck } from "lucide-react";
import { AppData } from "../types";

export interface ExtractedItems {
  trabalhos?: {
    titulo: string;
    dataEntrega: string;
    descricao?: string;
    disciplinaNome?: string;
    disciplinaId?: number | null;
    peso?: number;
  }[];
  provas?: {
    titulo: string;
    data: string;
    descricao?: string;
    disciplinaNome?: string;
    disciplinaId?: number | null;
    peso?: number;
  }[];
  disciplinas?: {
    nome: string;
    codigo?: string;
    professor?: string;
    sala?: string;
    cor?: string;
  }[];
  aulas?: {
    titulo: string;
    disciplinaNome?: string;
    disciplinaId?: number | null;
    conteudo?: string;
    data?: string;
  }[];
}

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onBatchAddItems?: (items: ExtractedItems) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  extractedItems?: ExtractedItems;
  applied?: boolean;
}

export const AITutorModal: React.FC<AITutorModalProps> = ({
  isOpen,
  onClose,
  appData,
  onBatchAddItems,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Olá! Sou seu **Tutor Acadêmico IA**.\n\nVocê pode me mandar uma lista de trabalhos, provas ou matérias que eu **identifico e adiciono tudo automaticamente** no seu painel!\n\n*Exemplo:* \"Tenho um trabalho de Cálculo dia 25/08 sobre limites, uma prova de Física dia 30/08 e a disciplina de Algoritmos com o prof. Carlos.\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    "Adicionar: Trabalho de Cálculo para 25/08 e Prova de Física para 30/08",
    "Como devo me organizar para as provas desta semana?",
    "Crie uma rotina diária de estudos eficiente",
    "Qual a melhor técnica para revisar anotações de aulas?",
  ];

  const handleSend = async (promptText?: string) => {
    const query = promptText || input.trim();
    if (!query || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    if (!promptText) setInput("");
    setLoading(true);

    try {
      const context = {
        totalDisciplinas: appData.disciplinas.length,
        disciplinas: appData.disciplinas.map((d) => ({ id: d.id, nome: d.nome })),
        trabalhosPendentes: appData.trabalhos
          .filter((t) => !t.concluido)
          .map((t) => ({ titulo: t.titulo, entrega: t.dataEntrega })),
        provasProximas: appData.provas
          .filter((p) => !p.concluido)
          .map((p) => ({ titulo: p.titulo, data: p.data })),
      };

      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, context: JSON.stringify(context) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na requisição da IA.");

      const extracted = data.extractedItems as ExtractedItems;
      const hasExtracted =
        extracted &&
        ((extracted.trabalhos && extracted.trabalhos.length > 0) ||
          (extracted.provas && extracted.provas.length > 0) ||
          (extracted.disciplinas && extracted.disciplinas.length > 0) ||
          (extracted.aulas && extracted.aulas.length > 0));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text,
          extractedItems: hasExtracted ? extracted : undefined,
          applied: false,
        },
      ]);
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

  const handleApplyItems = (msgIndex: number, items: ExtractedItems) => {
    if (!onBatchAddItems) return;
    onBatchAddItems(items);
    setMessages((prev) =>
      prev.map((m, idx) => (idx === msgIndex ? { ...m, applied: true } : m))
    );
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro automático & Orientação inteligente de estudos
              </p>
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
          {messages.map((msg, index) => {
            const hasItems =
              msg.extractedItems &&
              ((msg.extractedItems.trabalhos && msg.extractedItems.trabalhos.length > 0) ||
                (msg.extractedItems.provas && msg.extractedItems.provas.length > 0) ||
                (msg.extractedItems.disciplinas && msg.extractedItems.disciplinas.length > 0) ||
                (msg.extractedItems.aulas && msg.extractedItems.aulas.length > 0));

            return (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-3">
                  <div
                    className={`rounded-2xl p-3.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-br-none shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-none"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {/* Extracted Items Card */}
                  {msg.role === "assistant" && hasItems && msg.extractedItems && (
                    <div className="bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
                        <span className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          Itens Identificados para Cadastro
                        </span>
                        {msg.applied && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Adicionado
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200">
                        {msg.extractedItems.trabalhos?.map((t, idx) => (
                          <div key={`t-${idx}`} className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded font-bold text-[10px]">Trabalho</span>
                            <span className="font-bold truncate">{t.titulo}</span>
                            <span className="text-slate-400 text-[10px] ml-auto font-mono shrink-0">Entrega: {t.dataEntrega}</span>
                          </div>
                        ))}

                        {msg.extractedItems.provas?.map((p, idx) => (
                          <div key={`p-${idx}`} className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded font-bold text-[10px]">Prova</span>
                            <span className="font-bold truncate">{p.titulo}</span>
                            <span className="text-slate-400 text-[10px] ml-auto font-mono shrink-0">Data: {p.data}</span>
                          </div>
                        ))}

                        {msg.extractedItems.disciplinas?.map((d, idx) => (
                          <div key={`d-${idx}`} className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded font-bold text-[10px]">Disciplina</span>
                            <span className="font-bold truncate">{d.nome}</span>
                          </div>
                        ))}

                        {msg.extractedItems.aulas?.map((a, idx) => (
                          <div key={`a-${idx}`} className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded font-bold text-[10px]">Anotação</span>
                            <span className="font-bold truncate">{a.titulo}</span>
                          </div>
                        ))}
                      </div>

                      {!msg.applied ? (
                        <button
                          onClick={() => handleApplyItems(index, msg.extractedItems!)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                        >
                          <PlusCircle className="w-4 h-4" /> Adicionar Automaticamente ao Painel
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" /> Itens salvos no painel!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3 text-slate-500 text-sm py-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              </div>
              <span className="animate-pulse">Analisando e extraindo suas tarefas...</span>
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
            placeholder="Ex: Tenho trabalho de Cálculo para 25/08 e prova de Física dia 30/08..."
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
