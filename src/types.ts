export interface Disciplina {
  id: number;
  nome: string;
  codigo?: string;
  professor?: string;
  sala?: string;
  cor?: string;
}

export interface Aula {
  id: number;
  disciplinaId: number;
  titulo: string;
  conteudo: string;
  data?: string;
}

export interface Trabalho {
  id: number;
  titulo: string;
  dataEntrega: string;
  descricao: string;
  concluido: boolean;
  disciplinaId?: number;
  peso?: number;
  nota?: number;
}

export interface Prova {
  id: number;
  titulo: string;
  data: string;
  descricao: string;
  concluido: boolean;
  disciplinaId?: number;
  peso?: number;
  nota?: number;
}

export interface Ementa {
  id: number;
  titulo: string;
  nomeArquivo: string;
  tipo: string;
  idbKey: string;
  aberto?: boolean;
  disciplinaId?: number;
}

export interface HorarioAula {
  id: string;
  disciplinaId: number;
  diaSemana: number; // 1 = Segunda, 2 = Terça, ..., 6 = Sábado
  horaInicio: string; // "08:00"
  horaFim: string; // "09:40"
  sala?: string;
}

export interface AulaReposicao {
  id: number;
  disciplinaId: number;
  data: string; // YYYY-MM-DD
  horario?: string; // e.g. "14:00 - 16:00"
  sala?: string;
  motivo?: string;
  concluida: boolean;
}

export interface EventoCalendario {
  id: number;
  titulo: string;
  data: string; // YYYY-MM-DD
  horario?: string; // e.g. "15:00"
  descricao?: string;
  categoria?: "evento" | "academico" | "pessoal" | "outro";
  disciplinaId?: number;
  concluido?: boolean;
}

export interface ArquivosState {
  horarios: { idbKey: string; nome: string; atualizadoEm: string } | null;
  calendario: { idbKey: string; nome: string; atualizadoEm: string } | null;
}

export interface AppData {
  disciplinas: Disciplina[];
  aulas: Aula[];
  trabalhos: Trabalho[];
  provas: Prova[];
  ementas: Ementa[];
  horariosAulas: HorarioAula[];
  reposicoes: AulaReposicao[];
  eventos: EventoCalendario[];
  arquivos: ArquivosState;
}

export type FiltroTipo = "ativos" | "hoje" | "7d" | "atrasados" | "concluidos" | "todos";

export type TabSection =
  | "geral"
  | "trabalhos"
  | "provas"
  | "aulas"
  | "horarios"
  | "calendario"
  | "reposicoes"
  | "ementa"
  | "config";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
