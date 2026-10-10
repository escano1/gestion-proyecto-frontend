// Lógica pura del módulo de proyectos (sin React): filtros y ejecución del presupuesto.
import type { Proyecto } from "@/types/api";

// --- Búsqueda ---
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Búsqueda local por código, nombre o cliente (sin distinguir mayúsculas ni tildes). */
export function filtrarProyectos<T extends Pick<Proyecto, "codigo" | "nombre" | "cliente">>(
  proyectos: T[],
  texto: string,
): T[] {
  const termino = normalizar(texto.trim());
  if (!termino) return proyectos;
  return proyectos.filter((p) =>
    [p.codigo, p.nombre, p.cliente ?? ""].some((campo) => normalizar(campo).includes(termino)),
  );
}

// --- Gráficos ---
/**
 * Etiqueta de eje para un tipo de hora: quita el prefijo "Hora " y, si supera `max` caracteres,
 * la parte en 2 líneas lo más parejas posible, cortando en un espacio o después de "/"
 * ("Hora extra dominical/festiva nocturna" → ["Extra dominical/", "festiva nocturna"]).
 */
export function etiquetaEnLineas(nombre: string, max = 22): string[] {
  const limpio = nombre.trim().replace(/^hora\s+/i, "");
  const texto = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  if (texto.length <= max) return [texto];

  let mejor: [string, string] | null = null;
  for (let i = 1; i < texto.length; i++) {
    const corte = texto[i - 1] === "/" || texto[i] === " ";
    if (!corte) continue;
    const linea1 = texto.slice(0, i).trimEnd();
    const linea2 = texto.slice(i).trimStart();
    if (!linea1 || !linea2) continue;
    if (!mejor || Math.max(linea1.length, linea2.length) < Math.max(mejor[0].length, mejor[1].length)) {
      mejor = [linea1, linea2];
    }
  }
  return mejor ?? [texto]; // una sola palabra muy larga: no se parte
}

// --- Números ---
/** Máximo 2 decimales (regla del API para cantidades, pesos y montos). */
export const tieneMaxDosDecimales = (valor: number) => Math.abs(Math.round(valor * 100) - valor * 100) < 1e-6;

const redondear2 = (valor: number) => Math.round(valor * 100) / 100;

/** Porcentaje del presupuesto consumido por la mano de obra (null si no hay presupuesto). */
export function porcentajeEjecucion(costo: number, presupuesto: number | null): number | null {
  if (presupuesto === null || presupuesto <= 0) return null;
  return redondear2((costo / presupuesto) * 100);
}

