import { GoogleGenAI } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

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
    const systemInstruction = `Você é o Tutor Acadêmico IA do Painel Acadêmico. Seu objetivo é ajudar estudantes com resumos, planos de estudo, tiragem de dúvidas, cronogramas e estratégias de aprendizagem em português do Brasil. Responda de forma clara, estruturada e motivadora, utilizando formatação markdown quando apropriado. Contexto acadêmico atual do aluno: ${context || "Nenhum contexto fornecido."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro no assistente IA:", error);
    return res.status(500).json({ error: error.message || "Erro interno no servidor de IA." });
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
    return res.status(500).json({ error: error.message || "Erro ao processar resumo." });
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
    return res.status(500).json({ error: error.message || "Erro ao gerar simulado." });
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
    return res.status(500).json({ error: error.message || "Erro ao gerar plano." });
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
