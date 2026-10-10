/** Utilidades sobre fechas "YYYY-MM-DD" sin zona horaria (igual que el backend). */

export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

function aUtc(fecha: string): Date {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

export function sumarDias(fecha: string, dias: number): string {
  const f = aUtc(fecha);
  f.setUTCDate(f.getUTCDate() + dias);
  return f.toISOString().slice(0, 10);
}

/** Días reales entre dos fechas, contando ambos extremos. */
export function diferenciaDias(desde: string, hasta: string): number {
  return Math.round((aUtc(hasta).getTime() - aUtc(desde).getTime()) / 86_400_000) + 1;
}

/** Lunes de la semana que contiene la fecha. */
export function inicioSemana(fecha: string): string {
  const dia = (aUtc(fecha).getUTCDay() + 6) % 7;
  return sumarDias(fecha, -dia);
}

export function diasSemana(lunes: string): string[] {
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

const NOMBRES_DIA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function nombreDiaCorto(fecha: string): string {
  return NOMBRES_DIA[(aUtc(fecha).getUTCDay() + 6) % 7];
}

export function primerDiaMes(fecha: string): string {
  return `${fecha.slice(0, 7)}-01`;
}

export function ultimoDiaMes(fecha: string): string {
  const [a, m] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}
