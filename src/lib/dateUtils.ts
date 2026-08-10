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

export function isWithinNext7Days(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = todayISO();
  const d = diffDays(today, dateStr);
  return d >= 0 && d <= 7;
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
  if (d <= 7) return { label: `EM ${d} DIA(S)`, type: "due", days: d };
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
