export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(iso: string): Date {
  if (!iso) return new Date();
  return new Date(`${iso}T00:00:00`);
}

export function diffDays(aISO: string, bISO: string): number {
  const a = parseLocalDate(aISO);
  const b = parseLocalDate(bISO);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Retorna os limites exatos da semana civil (Início: Domingo, Fim: Sábado)
 * considerando o fuso horário local.
 */
export function getWeekBounds(refDateStr?: string): { startISO: string; endISO: string } {
  const ref = refDateStr ? parseLocalDate(refDateStr) : parseLocalDate(todayISO());
  ref.setHours(0, 0, 0, 0);
  const dayOfWeek = ref.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  // Domingo da semana
  const start = new Date(ref);
  start.setDate(ref.getDate() - dayOfWeek);

  // Sábado da semana
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return {
    startISO: toISO(start),
    endISO: toISO(end),
  };
}

/**
 * Verifica se uma data ISO pertence à semana civil atual (Domingo a Sábado).
 */
export function isThisWeek(dateStr: string): boolean {
  if (!dateStr) return false;
  const { startISO, endISO } = getWeekBounds();
  return dateStr >= startISO && dateStr <= endISO;
}

/**
 * Alias mantido para compatibilidade, utilizando a semana de Domingo a Sábado
 */
export function isWithinNext7Days(dateStr: string): boolean {
  return isThisWeek(dateStr);
}

export function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = todayISO();
  return diffDays(today, dateStr) < 0;
}

export function fmtBR(iso: string): string {
  if (!iso) return "-";
  const d = parseLocalDate(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function getDueStatus(iso: string): { label: string; type: "today" | "late" | "due" | "normal"; days: number } {
  const today = todayISO();
  const d = diffDays(today, iso);

  if (d === 0) return { label: "HOJE", type: "today", days: 0 };
  if (d < 0) return { label: `ATRASADO (${Math.abs(d)}d)`, type: "late", days: d };
  if (d === 1) return { label: "AMANHÃ", type: "due", days: 1 };
  if (isThisWeek(iso)) return { label: `ESTA SEMANA (${d}d)`, type: "due", days: d };
  if (d <= 7) return { label: `EM ${d} DIAS`, type: "normal", days: d };
  return { label: fmtBR(iso), type: "normal", days: d };
}

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const DIAS_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

