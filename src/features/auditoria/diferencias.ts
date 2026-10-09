// Comparación de `datosAnteriores` y `datosNuevos` de un registro de auditoría.

export type TipoCambio = "agregado" | "eliminado" | "modificado" | "igual";

export interface DiferenciaCampo {
  campo: string;
  anterior: unknown;
  nuevo: unknown;
  tipo: TipoCambio;
}

type Datos = Record<string, unknown> | null | undefined;

const NUMERICO = /^-?\d+(\.\d+)?$/;

const esNumerico = (v: unknown): v is number | string =>
  (typeof v === "number" && Number.isFinite(v)) || (typeof v === "string" && NUMERICO.test(v.trim()));

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Igualdad profunda tolerante a la serialización: 1500000 y "1500000.00" (decimales de PostgreSQL)
 * se consideran iguales.
 */
export function valoresIguales(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (esNumerico(a) && esNumerico(b)) return Number(a) === Number(b);
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => valoresIguales(v, b[i]));
  }
  if (esObjeto(a) && esObjeto(b)) {
    const claves = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...claves].every((k) => valoresIguales(a[k], b[k]));
  }
  return false;
}

/**
 * Compara por clave los datos anteriores y nuevos.
 * - Sin datos anteriores (creación): todos los campos son "agregado".
 * - Sin datos nuevos (eliminación): todos los campos son "eliminado".
 * - Con ambos: "modificado" si difieren, "igual" si no. Un campo ausente en los datos nuevos se asume
 *   sin cambios (las actualizaciones pueden registrar solo lo enviado); uno ausente en los anteriores
 *   es "agregado".
 * El orden es el de las claves anteriores seguido de las claves nuevas.
 */
export function compararDatos(anteriores: Datos, nuevos: Datos): DiferenciaCampo[] {
  const antes = anteriores ?? {};
  const despues = nuevos ?? {};
  const campos = [...new Set([...Object.keys(antes), ...Object.keys(despues)])];

  return campos.map((campo) => {
    const enAntes = Object.hasOwn(antes, campo);
    const enDespues = Object.hasOwn(despues, campo);
    const anterior = antes[campo];
    const nuevo = despues[campo];

    let tipo: TipoCambio;
    if (!anteriores) tipo = "agregado";
    else if (!nuevos) tipo = "eliminado";
    else if (!enAntes) tipo = "agregado";
    else if (!enDespues) tipo = "igual";
    else tipo = valoresIguales(anterior, nuevo) ? "igual" : "modificado";

    return { campo, anterior, nuevo, tipo };
  });
}

/** Representación legible de un valor auditado. */
export function textoValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "string") return valor;
  if (typeof valor === "number" || typeof valor === "bigint") return String(valor);
  return JSON.stringify(valor);
}
