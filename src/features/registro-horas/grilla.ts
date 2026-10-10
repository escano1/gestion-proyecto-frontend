// Lógica pura de la grilla semanal de captura de horas (sin React ni llamadas al API).
import { inicioSemana, sumarDias } from "@/lib/fechas";
import type {
  Asignacion,
  CodigoTipoHora,
  EntradaRegistroHoras,
  RegistroHoras,
  RespuestaLoteHoras,
  TipoHora,
} from "@/types/api";

/** Texto digitado por celda, indexado por `claveCelda`. Una celda ausente equivale a 0 h. */
export type Celdas = Record<string, string>;

export interface Par {
  trabajadorId: number;
  fecha: string;
}

export const HORAS_MAXIMAS_DIA = 24;

/** Tipos visibles al abrir la grilla (los demás se activan con las casillas). */
export const CODIGOS_VISIBLES_POR_DEFECTO: CodigoTipoHora[] = ["ORD", "NOC", "HED", "HEN", "DOM"];

const DIAS_LARGOS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

/** Nombre completo del día según su posición en la semana (0 = lunes). */
export const nombreDiaLargo = (indice: number) => DIAS_LARGOS[indice] ?? "";

export const claveCelda = (trabajadorId: number, fecha: string, tipoHoraId: number) =>
  `${trabajadorId}|${fecha}|${tipoHoraId}`;

const clavePar = (trabajadorId: number, fecha: string) => `${trabajadorId}|${fecha}`;

export function separarClave(clave: string): Par & { tipoHoraId: number } {
  const [trabajadorId, fecha, tipoHoraId] = clave.split("|");
  return { trabajadorId: Number(trabajadorId), fecha, tipoHoraId: Number(tipoHoraId) };
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/** Horas de una celda: vacío → 0; admite coma decimal; `null` si no es un número. */
export function leerHoras(texto: string | undefined): number | null {
  const limpio = (texto ?? "").trim().replace(",", ".");
  if (limpio === "") return 0;
  const valor = Number(limpio);
  return Number.isFinite(valor) ? valor : null;
}

/** Regla del API para el lote: 0 ≤ horas ≤ 24 con máximo 2 decimales. */
export function horasValidas(texto: string | undefined): boolean {
  const valor = leerHoras(texto);
  return (
    valor !== null &&
    valor >= 0 &&
    valor <= HORAS_MAXIMAS_DIA &&
    Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-6
  );
}

/** Estado inicial de la grilla a partir de los registros del API. */
export function celdasDesdeRegistros(registros: RegistroHoras[]): Celdas {
  const celdas: Celdas = {};
  for (const registro of registros) {
    for (const detalle of registro.detalles) {
      if (detalle.horas > 0) {
        celdas[claveCelda(registro.trabajador.id, registro.fecha, detalle.tipoHoraId)] = String(detalle.horas);
      }
    }
  }
  return celdas;
}

/** Superpone lo digitado sobre lo guardado. */
export const combinarCeldas = (base: Celdas, ediciones: Celdas): Celdas => ({ ...base, ...ediciones });

/** Claves cuyo texto no cumple las reglas de horas. */
export function celdasInvalidas(celdas: Celdas): string[] {
  return Object.keys(celdas).filter((clave) => !horasValidas(celdas[clave]));
}

/** Pares (trabajador, fecha) con al menos una celda distinta de lo guardado, ordenados. */
export function paresModificados(base: Celdas, actual: Celdas): Par[] {
  const pares = new Map<string, Par>();
  for (const clave of new Set([...Object.keys(base), ...Object.keys(actual)])) {
    const antes = leerHoras(base[clave]);
    const ahora = leerHoras(actual[clave]);
    if (antes === ahora) continue;
    const { trabajadorId, fecha } = separarClave(clave);
    pares.set(clavePar(trabajadorId, fecha), { trabajadorId, fecha });
  }
  return [...pares.values()].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.trabajadorId - b.trabajadorId);
}

/**
 * Lote para `PUT /registro-horas/lote`: un ítem por par modificado con TODOS los tipos de esa fecha
 * (el API reemplaza el conjunto de detalles), omitiendo los que quedan en 0.
 * Si todos quedan en 0 se envía `detalles: []` y el API elimina el registro.
 */
export function armarLote(base: Celdas, actual: Celdas, proyectoId: number): EntradaRegistroHoras[] {
  const detallesPorPar = new Map<string, { tipoHoraId: number; horas: number }[]>();
  for (const [clave, texto] of Object.entries(actual)) {
    const horas = leerHoras(texto);
    if (horas === null || horas <= 0) continue;
    const { trabajadorId, fecha, tipoHoraId } = separarClave(clave);
    const llave = clavePar(trabajadorId, fecha);
    const detalles = detallesPorPar.get(llave) ?? [];
    detalles.push({ tipoHoraId, horas: redondear(horas) });
    detallesPorPar.set(llave, detalles);
  }
  return paresModificados(base, actual).map(({ trabajadorId, fecha }) => ({
    trabajadorId,
    proyectoId,
    fecha,
    detalles: (detallesPorPar.get(clavePar(trabajadorId, fecha)) ?? []).sort((a, b) => a.tipoHoraId - b.tipoHoraId),
  }));
}

/**
 * Tras guardar, quita las ediciones enviadas que no se tocaron mientras se guardaba
 * (las digitadas durante el guardado se conservan).
 */
export function descartarGuardadas(ediciones: Celdas, enviadas: Celdas): Celdas {
  return Object.fromEntries(Object.entries(ediciones).filter(([clave, texto]) => enviadas[clave] !== texto));
}

/** Mensaje de confirmación del guardado por lotes. */
export function resumenLote({ creados, actualizados, eliminados }: RespuestaLoteHoras): string {
  const partes = (
    [
      [creados, "creado"],
      [actualizados, "actualizado"],
      [eliminados, "eliminado"],
    ] as const
  )
    .filter(([cantidad]) => cantidad > 0)
    .map(([cantidad, accion]) => `${cantidad} ${accion}${cantidad === 1 ? "" : "s"}`);
  return partes.length ? `Registros guardados: ${partes.join(", ")}` : "No había cambios por guardar";
}

export interface TotalesTrabajador {
  /** Por fecha: total del día y horas extra del día. */
  porDia: Record<string, { total: number; extra: number }>;
  /** Por tipo de hora: total de la semana. */
  porTipo: Record<number, number>;
  total: number;
  extra: number;
}

const totalesVacios = (): TotalesTrabajador => ({ porDia: {}, porTipo: {}, total: 0, extra: 0 });

/** Totales por trabajador (día, tipo y semana). Las celdas inválidas cuentan como 0. */
export function calcularTotales(celdas: Celdas, tiposExtra: ReadonlySet<number>): Map<number, TotalesTrabajador> {
  const totales = new Map<number, TotalesTrabajador>();
  for (const [clave, texto] of Object.entries(celdas)) {
    const horas = leerHoras(texto);
    if (horas === null || horas <= 0) continue;
    const { trabajadorId, fecha, tipoHoraId } = separarClave(clave);
    const t = totales.get(trabajadorId) ?? totalesVacios();
    const dia = t.porDia[fecha] ?? { total: 0, extra: 0 };
    const esExtra = tiposExtra.has(tipoHoraId);
    dia.total = redondear(dia.total + horas);
    if (esExtra) dia.extra = redondear(dia.extra + horas);
    t.porDia[fecha] = dia;
    t.porTipo[tipoHoraId] = redondear((t.porTipo[tipoHoraId] ?? 0) + horas);
    t.total = redondear(t.total + horas);
    if (esExtra) t.extra = redondear(t.extra + horas);
    totales.set(trabajadorId, t);
  }
  return totales;
}

/** Tipos con horas (> 0) por trabajador, considerando varias fuentes (guardado y digitado). */
export function tiposConDatos(...fuentes: Celdas[]): Map<number, Set<number>> {
  const resultado = new Map<number, Set<number>>();
  for (const celdas of fuentes) {
    for (const [clave, texto] of Object.entries(celdas)) {
      const horas = leerHoras(texto);
      if (horas === 0) continue;
      const { trabajadorId, tipoHoraId } = separarClave(clave);
      const tipos = resultado.get(trabajadorId) ?? new Set<number>();
      tipos.add(tipoHoraId);
      resultado.set(trabajadorId, tipos);
    }
  }
  return resultado;
}

/** Un día es editable si es de la semana en curso o anterior (sábado y domingo incluidos) y el trabajador está asignado. */
export const diaEditable = (fecha: string, asignado: boolean, hoy: string) =>
  fecha <= sumarDias(inicioSemana(hoy), 6) && asignado;

export interface FilaTrabajador {
  id: number;
  nombre: string;
  numeroDocumento: string;
  cargo: string | null;
  asignado: boolean;
}

/**
 * Trabajadores de la grilla: los asignados al proyecto más quienes tengan registros en la semana
 * sin estar asignados (se muestran en solo lectura). Orden alfabético.
 */
export function trabajadoresGrilla(asignaciones: Asignacion[], registros: RegistroHoras[]): FilaTrabajador[] {
  const filas = new Map<number, FilaTrabajador>();
  for (const a of asignaciones) {
    filas.set(a.trabajadorId, {
      id: a.trabajadorId,
      nombre: a.trabajador.nombre,
      numeroDocumento: a.trabajador.numeroDocumento,
      cargo: a.trabajador.cargo,
      asignado: true,
    });
  }
  for (const r of registros) {
    if (!filas.has(r.trabajador.id)) {
      filas.set(r.trabajador.id, {
        id: r.trabajador.id,
        nombre: r.trabajador.nombre,
        numeroDocumento: r.trabajador.numeroDocumento,
        cargo: null,
        asignado: false,
      });
    }
  }
  return [...filas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export type TipoGrilla = Pick<TipoHora, "id" | "codigo" | "nombre" | "esExtra" | "orden" | "activo">;

/**
 * Tipos de la grilla: los activos del catálogo más los inactivos (o desconocidos) que ya tengan
 * horas registradas, para no perderlos al reenviar el conjunto completo de detalles.
 */
export function tiposDeGrilla(catalogo: TipoHora[], registros: RegistroHoras[]): TipoGrilla[] {
  const tipos = new Map<number, TipoGrilla>();
  for (const t of catalogo) if (t.activo) tipos.set(t.id, t);
  for (const r of registros) {
    for (const d of r.detalles) {
      if (tipos.has(d.tipoHoraId)) continue;
      const delCatalogo = catalogo.find((t) => t.id === d.tipoHoraId);
      tipos.set(
        d.tipoHoraId,
        delCatalogo ?? {
          id: d.tipoHoraId,
          codigo: d.codigo,
          nombre: d.nombre,
          esExtra: d.codigo.startsWith("HE"),
          orden: 999,
          activo: false,
        },
      );
    }
  }
  return [...tipos.values()].sort((a, b) => a.orden - b.orden || a.id - b.id);
}
