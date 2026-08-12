import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

function sanitizeErrorMessage(error: any): string {
  const msg = error?.message || String(error || "Erro interno no servidor.");
  return msg
    .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "[CHAVE_OCULTA]")
    .replace(/key=[A-Za-z0-9_-]+/gi, "key=[CHAVE_OCULTA]")
    .replace(/bearer\s+[A-Za-z0-9_.-]+/gi, "bearer [TOKEN_OCULTO]");
}

// Server-side Gemini AI setup
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chave GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// AI Assistant endpoint
app.post("/api/ai/assistant", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "O prompt é obrigatório." });
    }

    const ai = getGenAI();
    const todayStr = new Date().toISOString().split("T")[0];
    const systemInstruction = `Você é o Tutor Acadêmico IA do Painel Acadêmico.
Seu objetivo é orientar estudantes e extrair de forma precisa trabalhos, provas, disciplinas ou anotações mencionados na mensagem.
A data de hoje é: ${todayStr}.

Contexto acadêmico atual do aluno (disciplinas e tarefas):
${context || "Nenhum contexto fornecido."}

INSTRUÇÕES DE EXTRAÇÃO AUTOMÁTICA:
Sempre que a mensagem do aluno contiver dados de trabalhos, provas, disciplinas ou anotações de aula (ex: "Trabalho de Cálculo para dia 25/08 sobre derivadas", "Prova de Física 2 dia 30/08", "Tenho aula de Algoritmos com prof. Carlos"):
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
    ],
    "reposicoes": [
      {
        "disciplinaNome": "string",
        "disciplinaId": number | null,
        "data": "YYYY-MM-DD",
        "horario": "string",
        "sala": "string",
        "motivo": "string"
      }
    ],
    "eventos": [
      {
        "titulo": "string",
        "data": "YYYY-MM-DD",
        "horario": "string",
        "descricao": "string",
        "categoria": "evento" | "academico" | "pessoal" | "outro"
      }
    ]
  }
}

Se nenhuma tarefa for mencionada para cadastro, retorne os arrays de "extractedItems" vazios.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });
    } catch (apiErr: any) {
      if (apiErr?.status === 429 || apiErr?.message?.includes("429") || apiErr?.message?.includes("Quota exceeded") || apiErr?.message?.includes("RESOURCE_EXHAUSTED")) {
        // Wait 3 seconds and retry once
        await new Promise((res) => setTimeout(res, 3000));
        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        });
      } else {
        throw apiErr;
      }
    }

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      text: parsed.text || "Processado com sucesso.",
      extractedItems: parsed.extractedItems || { trabalhos: [], provas: [], disciplinas: [], aulas: [], reposicoes: [], eventos: [] },
    });
  } catch (error: any) {
    console.error("Erro no assistente IA:", error);
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota exceeded") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({ error: "O limite temporário de requisições do Gemini foi atingido (cota gratuita). Por favor, aguarde de 10 a 15 segundos e tente novamente!" });
    }
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
});

// AI Summarize Notes endpoint
app.post("/api/ai/summarize-notes", async (req, res) => {
  try {
    const { title, notes, disciplina } = req.body;
    if (!notes) {
      return res.status(400).json({ error: "As anotações são obrigatórias." });
    }

    const ai = getGenAI();
    const systemInstruction = "Você é um assistente acadêmico especializado em síntese de notas de aula. Crie um resumo altamente didático com: 1. Principais Conceitos (Bullet points), 2. Definições Importantes, 3. Fórmulas / Termos Chave (se aplicável), 4. Pergunta de Revisão para fixação.";

    const prompt = `Anotações da aula: "${title || "Aula"}" na disciplina "${disciplina || "Geral"}":\n\n${notes}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Erro ao resumir anotações:", error);
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
});

// AI Generate Quiz endpoint
app.post("/api/ai/generate-quiz", async (req, res) => {
  try {
    const { topic, description, count = 3 } = req.body;
    const ai = getGenAI();

    const systemInstruction = "Você é um professor universitário criando simulados e questões de revisão para provas. Retorne um array JSON com objetos contendo: question (string), options (array de 4 strings), correctIndex (number 0-3) e explanation (string).";

    const prompt = `Gere ${count} questões de múltipla escolha para a prova/matéria sobre o tópico: "${topic}". Descrição/conteúdo extra: "${description || "Geral"}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const jsonText = response.text || "[]";
    const questions = JSON.parse(jsonText);
    return res.json({ questions });
  } catch (error: any) {
    console.error("Erro ao gerar quiz:", error);
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
});

// AI Study Plan endpoint
app.post("/api/ai/study-plan", async (req, res) => {
  try {
    const { items } = req.body; // List of upcoming exams / assignments
    const ai = getGenAI();

    const systemInstruction = "Você é um psicopedagogo e especialista em produtividade acadêmica. Crie um plano semanal de estudos priorizando prazos mais urgentes e matérias com maior peso. Forneça sugestões de blocos de estudo diários e técnicas de memorização recomendadas.";

    const prompt = `Monte um plano de estudo estratégico com base nas seguintes atividades pendentes do aluno:\n${JSON.stringify(items, null, 2)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    return res.json({ plan: response.text });
  } catch (error: any) {
    console.error("Erro ao gerar plano de estudos:", error);
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
