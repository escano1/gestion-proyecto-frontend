const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const formatoPesos = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? "—" : pesos.format(valor);

export const formatoNumero = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? "—" : numero.format(valor);

export const formatoHoras = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? "—" : `${numero.format(valor)} h`;

/** Fracción a porcentaje: 0.35 → "35 %". */
export const formatoPorcentaje = (fraccion: number) => `${numero.format(fraccion * 100)} %`;

/** Porcentaje ya expresado en 0–100: 42.5 → "42,5 %". */
export const formatoAvance = (valor: number) => `${numero.format(valor)} %`;

/** "2026-10-08" → "08/10/2026" (sin conversión de zona horaria). */
export function formatoFecha(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const [a, m, d] = fecha.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

export function formatoFechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

export const nombreMes = (mes: number) => MESES[mes - 1] ?? String(mes);

/** "Semana 05/10/2026 – 11/10/2026" (la nómina se liquida por semana, de lunes a domingo). */
export function nombrePeriodo(p: { fechaInicio: string; fechaFin: string }) {
  return `Semana ${formatoFecha(p.fechaInicio)} – ${formatoFecha(p.fechaFin)}`;
}

export function formatoTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
