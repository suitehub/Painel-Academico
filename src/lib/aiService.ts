/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

export const GEMINI_KEY_STORAGE_KEY = "gemini_api_key";

export function getStoredGeminiKey(): string {
  return (
    localStorage.getItem(GEMINI_KEY_STORAGE_KEY) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ""
  );
}

export function setStoredGeminiKey(key: string) {
  if (key && key.trim()) {
    localStorage.setItem(GEMINI_KEY_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
  }
}

function getClientGenAI() {
  const apiKey = getStoredGeminiKey();
  if (!apiKey) {
    throw new Error(
      "O servidor backend de IA não está ativo nesta hospedagem estática (como o GitHub Pages). " +
      "Para ativar o Tutor IA aqui, acesse as Configurações do aplicativo e insira sua Chave de API do Gemini."
    );
  }
  return new GoogleGenAI({ apiKey });
}

async function tryServerPost(url: string, body: any) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") || "";
    // If static hosting returned HTML (404/405/index.html), treat as NO_BACKEND
    if (!contentType.includes("application/json")) {
      return { success: false, noBackend: true };
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Erro no servidor de IA.");
    }
    return { success: true, data };
  } catch (err: any) {
    if (
      err.name === "SyntaxError" ||
      err.name === "TypeError" ||
      err.message?.includes("Unexpected token") ||
      err.message === "NO_BACKEND"
    ) {
      return { success: false, noBackend: true };
    }
    throw err;
  }
}

// 1. Assistant Endpoint
export async function callAIAssistant(prompt: string, context: string) {
  const serverRes = await tryServerPost("/api/ai/assistant", { prompt, context });
  if (serverRes.success) {
    return serverRes.data;
  }

  // Fallback to client-side GoogleGenAI
  const ai = getClientGenAI();
  const todayStr = new Date().toISOString().split("T")[0];
  const systemInstruction = `Você é o Tutor Acadêmico IA do Painel Acadêmico.
Seu objetivo é orientar estudantes e extrair de forma precisa trabalhos, provas, disciplinas ou anotações mencionados na mensagem.
A data de hoje é: ${todayStr}.

Contexto acadêmico atual do aluno (disciplinas e tarefas):
${context || "Nenhum contexto fornecido."}

INSTRUÇÕES DE EXTRAÇÃO AUTOMÁTICA:
Sempre que a mensagem do aluno contiver dados de trabalhos, provas, disciplinas ou anotações de aula:
1. Escreva uma resposta explicativa em Markdown no campo "text".
2. Preencha o objeto "extractedItems" com arrays estruturados para cada item identificado.
3. Se a disciplina mencionada coincidir com uma das disciplinas do contexto, inclua o "disciplinaId" correspondente. Se for uma matéria nova, inclua o nome em "disciplinaNome".
4. Resolva datas relativas (ex: "próxima segunda", "amanhã", "dia 20") para o formato YYYY-MM-DD com base na data de hoje (${todayStr}).

Retorne estritamente um JSON com o seguinte formato:
{
  "text": "Sua resposta motivadora em Markdown...",
  "extractedItems": {
    "trabalhos": [
      {
        "titulo": "string",
        "dataEntrega": "YYYY-MM-DD",
        "descricao": "string",
        "disciplinaNome": "string",
        "disciplinaId": number | null,
        "peso": number
      }
    ],
    "provas": [
      {
        "titulo": "string",
        "data": "YYYY-MM-DD",
        "descricao": "string",
        "disciplinaNome": "string",
        "disciplinaId": number | null,
        "peso": number
      }
    ],
    "disciplinas": [
      {
        "nome": "string",
        "codigo": "string",
        "professor": "string",
        "sala": "string",
        "cor": "string"
      }
    ],
    "aulas": [
      {
        "titulo": "string",
        "disciplinaNome": "string",
        "disciplinaId": number | null,
        "conteudo": "string",
        "data": "YYYY-MM-DD"
      }
    ]
  }
}

Se nenhuma tarefa for mencionada para cadastro, retorne os arrays de "extractedItems" vazios.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  const parsed = JSON.parse(response.text || "{}");
  return {
    text: parsed.text || "Processado com sucesso.",
    extractedItems: parsed.extractedItems || { trabalhos: [], provas: [], disciplinas: [], aulas: [] },
  };
}

// 2. Summarize Notes Endpoint
export async function callSummarizeNotes(title: string, notes: string, disciplina: string) {
  const serverRes = await tryServerPost("/api/ai/summarize-notes", { title, notes, disciplina });
  if (serverRes.success) {
    return serverRes.data;
  }

  const ai = getClientGenAI();
  const systemInstruction =
    "Você é um assistente acadêmico especializado em síntese de notas de aula. Crie um resumo altamente didático com: 1. Principais Conceitos (Bullet points), 2. Definições Importantes, 3. Fórmulas / Termos Chave (se aplicável), 4. Pergunta de Revisão para fixação.";

  const promptStr = `Anotações da aula: "${title || "Aula"}" na disciplina "${disciplina || "Geral"}":\n\n${notes}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: promptStr,
    config: {
      systemInstruction,
      temperature: 0.4,
    },
  });

  return { summary: response.text };
}

// 3. Generate Quiz Endpoint
export async function callGenerateQuiz(topic: string, description: string, count = 3) {
  const serverRes = await tryServerPost("/api/ai/generate-quiz", { topic, description, count });
  if (serverRes.success) {
    return serverRes.data;
  }

  const ai = getClientGenAI();
  const systemInstruction =
    "Você é um professor universitário criando simulados e questões de revisão para provas. Retorne um array JSON com objetos contendo: question (string), options (array de 4 strings), correctIndex (number 0-3) e explanation (string).";

  const promptStr = `Gere ${count} questões de múltipla escolha para a prova/matéria sobre o tópico: "${topic}". Descrição/conteúdo extra: "${description || "Geral"}".`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: promptStr,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  });

  const questions = JSON.parse(response.text || "[]");
  return { questions };
}

// 4. Study Plan Endpoint
export async function callStudyPlan(items: any[]) {
  const serverRes = await tryServerPost("/api/ai/study-plan", { items });
  if (serverRes.success) {
    return serverRes.data;
  }

  const ai = getClientGenAI();
  const systemInstruction =
    "Você é um psicopedagogo e especialista em produtividade acadêmica. Crie um plano semanal de estudos priorizando prazos mais urgentes e matérias com maior peso. Forneça sugestões de blocos de estudo diários e técnicas de memorização recomendadas.";

  const promptStr = `Monte um plano de estudo estratégico com base nas seguintes atividades pendentes do aluno:\n${JSON.stringify(items, null, 2)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: promptStr,
    config: {
      systemInstruction,
      temperature: 0.6,
    },
  });

  return { plan: response.text };
}
