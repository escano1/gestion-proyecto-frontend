import { formatoFecha } from "@/lib/formato";
import type { AgrupacionHoras, CodigoTipoHora, ReporteHoras } from "@/types/api";
import type { CeldaCsv } from "./csv";
import { ORDEN_TIPOS_HORA } from "./tipos-hora";

export const AGRUPACIONES: Record<AgrupacionHoras, string> = {
  trabajador: "Trabajador",
  proyecto: "Proyecto",
  tipo: "Tipo de hora",
  fecha: "Fecha",
};

type FilaReporte = ReporteHoras["filas"][number];

/** Tipos de hora con algún valor en el reporte, en el orden del catálogo. */
export function tiposPresentes(filas: FilaReporte[]): CodigoTipoHora[] {
  return ORDEN_TIPOS_HORA.filter((codigo) => filas.some((f) => (f.porTipo[codigo] ?? 0) !== 0));
}

/** Suma de horas por tipo para la fila de totales. */
export function totalesPorTipo(filas: FilaReporte[], codigos: CodigoTipoHora[]): Record<CodigoTipoHora, number> {
  const totales = {} as Record<CodigoTipoHora, number>;
  for (const codigo of codigos) {
    totales[codigo] = redondear(filas.reduce((suma, f) => suma + (f.porTipo[codigo] ?? 0), 0));
  }
  return totales;
}

const redondear = (valor: number) => Math.round(valor * 100) / 100;

/** Etiqueta visible de una fila: las fechas ISO se muestran como dd/mm/aaaa. */
export function etiquetaFila(etiqueta: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(etiqueta) ? formatoFecha(etiqueta) : etiqueta;
}

/** Encabezados y filas del CSV del reporte de horas (incluye la fila de totales). */
export function tablaCsvHoras(
  reporte: ReporteHoras,
  nombreTipo: (codigo: CodigoTipoHora) => string = (codigo) => codigo,
): { encabezados: string[]; filas: CeldaCsv[][] } {
  const codigos = tiposPresentes(reporte.filas);
  const totalTipo = totalesPorTipo(reporte.filas, codigos);
  const encabezados = [
    AGRUPACIONES[reporte.agrupacion],
    ...codigos.map((codigo) => {
      const nombre = nombreTipo(codigo);
      return nombre === codigo ? codigo : `${codigo} - ${nombre}`;
    }),
    "Horas",
    "Horas extra",
    "Costo (COP)",
  ];
  const filas: CeldaCsv[][] = reporte.filas.map((f) => [
    etiquetaFila(f.etiqueta),
    ...codigos.map((codigo) => f.porTipo[codigo] ?? 0),
    f.horas,
    f.horasExtra,
    f.costo,
  ]);
  filas.push([
    "Total",
    ...codigos.map((codigo) => totalTipo[codigo]),
    reporte.totales.horas,
    reporte.totales.horasExtra,
    reporte.totales.costo,
  ]);
  return { encabezados, filas };
}
