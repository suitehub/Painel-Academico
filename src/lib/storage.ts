import { AppData } from "../types";
import { todayISO } from "./dateUtils";

const KEY = "academic_app_v2";

export function getInitialData(): AppData {
  const today = todayISO();
  const dateIn = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    disciplinas: [
      { id: 101, nome: "Cálculo I", codigo: "MAT101", professor: "Prof. Dr. Ricardo Santos", sala: "Bloco A - Lab 02", cor: "#3b82f6" },
      { id: 102, nome: "Estrutura de Dados", codigo: "CC201", professor: "Profa. Dra. Elena Silva", sala: "Bloco B - Sala 104", cor: "#10b981" },
      { id: 103, nome: "Metodologia da Pesquisa", codigo: "MET05", professor: "Prof. Msc. Carlos Lima", sala: "Auditório Principal", cor: "#f59e0b" },
      { id: 104, nome: "Sistemas Operacionais", codigo: "CC302", professor: "Prof. Dr. André Martins", sala: "Lab de Informática 3", cor: "#8b5cf6" },
    ],
    aulas: [
      {
        id: 201,
        disciplinaId: 101,
        titulo: "Limites e Continuidade de Funções",
        conteudo: "- Definição intuitiva e formal de limite (ε-δ).\n- Propriedades operatórias dos limites.\n- Limites laterais e limites no infinito.\n- Teorema do Confronto (Squeeze Theorem).",
        data: dateIn(-5),
      },
      {
        id: 202,
        disciplinaId: 101,
        titulo: "Derivadas e Regra da Cadeia",
        conteudo: "- Interpretação geométrica da derivada (reta tangente).\n- Regra do produto e do quociente.\n- Regra da Cadeia para funções compostas.",
        data: dateIn(-2),
      },
      {
        id: 203,
        disciplinaId: 102,
        titulo: "Árvores Binárias de Busca (BST)",
        conteudo: "- Propriedades da BST: subárvore esquerda < raiz < subárvore direita.\n- Algoritmos de busca, inserção e remoção.\n- Percursos em árvores: Pré-ordem, Em-ordem, Pós-ordem.",
        data: dateIn(-3),
      },
    ],
    trabalhos: [
      {
        id: 301,
        titulo: "Resumo Crítico de Artigo Científico",
        dataEntrega: today,
        descricao: "Elaborar síntese de 2 páginas sobre metodologia científica contemporânea no formato ABNT.",
        concluido: false,
        disciplinaId: 103,
        peso: 2.0,
        nota: 9.5,
      },
      {
        id: 302,
        titulo: "Implementação de Tabela Hash com Encadeamento",
        dataEntrega: dateIn(3),
        descricao: "Criar em C++ ou Java uma Tabela Hash tratando colisões via lista encadeada dinâmica. Incluir testes de estresse.",
        concluido: false,
        disciplinaId: 102,
        peso: 3.5,
      },
      {
        id: 303,
        titulo: "Lista de Exercícios de Derivadas Implícitas",
        dataEntrega: dateIn(6),
        descricao: "Resolver os exercícios 1 a 25 do Capítulo 3 do livro do Stewart.",
        concluido: false,
        disciplinaId: 101,
        peso: 1.5,
      },
    ],
    provas: [
      {
        id: 401,
        titulo: "P1 - Limites e Derivadas",
        data: dateIn(4),
        descricao: "Conteúdo: Limites, Continuidade, Regras de Derivação e Taxas Relacionadas.",
        concluido: false,
        disciplinaId: 101,
        peso: 4.0,
      },
      {
        id: 402,
        titulo: "P1 - Algoritmos e Estruturas de Dados",
        data: dateIn(12),
        descricao: "Listas, Pilhas, Filas, Árvores Binárias e Tabelas Hash.",
        concluido: false,
        disciplinaId: 102,
        peso: 5.0,
      },
    ],
    ementas: [],
    horariosAulas: [
      { id: "h1", disciplinaId: 101, diaSemana: 1, horaInicio: "07:15", horaFim: "08:00", sala: "Bloco A - Lab 02" },
      { id: "h2", disciplinaId: 101, diaSemana: 1, horaInicio: "08:00", horaFim: "08:45", sala: "Bloco A - Lab 02" },
      { id: "h3", disciplinaId: 102, diaSemana: 1, horaInicio: "09:40", horaFim: "10:25", sala: "Bloco B - Sala 104" },
      { id: "h4", disciplinaId: 104, diaSemana: 2, horaInicio: "08:00", horaFim: "08:45", sala: "Lab Info 3" },
      { id: "h5", disciplinaId: 103, diaSemana: 3, horaInicio: "10:25", horaFim: "11:10", sala: "Auditório" },
      { id: "h6", disciplinaId: 101, diaSemana: 4, horaInicio: "08:45", horaFim: "09:30", sala: "Bloco A - Lab 02" },
      { id: "h7", disciplinaId: 102, diaSemana: 5, horaInicio: "09:40", horaFim: "10:25", sala: "Bloco B - Sala 104" },
    ],
    arquivos: {
      horarios: null,
      calendario: null,
    },
  };
}

export function getEmptyData(): AppData {
  return {
    disciplinas: [],
    aulas: [],
    trabalhos: [],
    provas: [],
    ementas: [],
    horariosAulas: [],
    arquivos: {
      horarios: null,
      calendario: null,
    },
  };
}

export function clearAllData(): void {
  try {
    localStorage.removeItem(KEY);
  } catch (err) {
    console.error("Erro ao limpar localStorage:", err);
  }
}

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const empty = getEmptyData();
      saveAppData(empty);
      return empty;
    }
    const parsed = JSON.parse(raw);
    return {
      disciplinas: parsed.disciplinas || [],
      aulas: parsed.aulas || [],
      trabalhos: parsed.trabalhos || [],
      provas: parsed.provas || [],
      ementas: parsed.ementas || [],
      horariosAulas: parsed.horariosAulas || [],
      arquivos: parsed.arquivos || { horarios: null, calendario: null },
    };
  } catch (err) {
    console.error("Erro ao carregar localStorage:", err);
    return getEmptyData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Erro ao salvar localStorage:", err);
  }
}
