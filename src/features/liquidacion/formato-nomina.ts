// Presentación de periodos y parámetros legales de la nómina.
import { formatoFecha, formatoHoras, formatoNumero, formatoPesos, formatoPorcentaje, nombrePeriodo } from "@/lib/formato";
import type { TipoPeriodo } from "@/types/api";

export const rangoFechas = (inicio: string, fin: string) => `${formatoFecha(inicio)} – ${formatoFecha(fin)}`;

/**
 * Nombre del periodo a partir de sus fechas (el desprendible no trae año, mes ni quincena):
 * la quincena 1 inicia el día 1 y la 2 el día 16.
 */
export function periodoDesdeFechas(tipoPeriodo: TipoPeriodo, fechaInicio: string): string {
  const [anio, mes, dia] = fechaInicio.split("-").map(Number);
  return nombrePeriodo({ tipoPeriodo, anio, mes, quincena: tipoPeriodo === "QUINCENAL" ? (dia <= 15 ? 1 : 2) : null });
}

type Formato = (valor: number) => string;

const GRUPOS = ["Valores base", "Recargos", "Aportes del trabajador", "Límites de horas", "Otros"] as const;
type Grupo = (typeof GRUPOS)[number];

/** Claves de `Desprendible.parametros` (mismas que `ParametrosVigentes.valores`). */
const DEFINICIONES: Record<string, { etiqueta: string; grupo: Grupo; formato: Formato }> = {
  smmlv: { etiqueta: "Salario mínimo (SMMLV)", grupo: "Valores base", formato: formatoPesos },
  auxilioTransporte: { etiqueta: "Auxilio de transporte", grupo: "Valores base", formato: formatoPesos },
  uvt: { etiqueta: "UVT", grupo: "Valores base", formato: formatoPesos },
  jornadaMaximaSemanal: { etiqueta: "Jornada máxima semanal", grupo: "Valores base", formato: formatoHoras },
  recargoNocturno: { etiqueta: "Nocturno", grupo: "Recargos", formato: formatoPorcentaje },
  recargoExtraDiurna: { etiqueta: "Hora extra diurna", grupo: "Recargos", formato: formatoPorcentaje },
  recargoExtraNocturna: { etiqueta: "Hora extra nocturna", grupo: "Recargos", formato: formatoPorcentaje },
  recargoDominicalFestivo: { etiqueta: "Dominical y festivo", grupo: "Recargos", formato: formatoPorcentaje },
  aporteSaludEmpleado: { etiqueta: "Salud", grupo: "Aportes del trabajador", formato: formatoPorcentaje },
  aportePensionEmpleado: { etiqueta: "Pensión", grupo: "Aportes del trabajador", formato: formatoPorcentaje },
  limiteHorasExtraDia: { etiqueta: "Horas extra por día", grupo: "Límites de horas", formato: formatoHoras },
  limiteHorasExtraSemana: { etiqueta: "Horas extra por semana", grupo: "Límites de horas", formato: formatoHoras },
};

const ORDEN = Object.keys(DEFINICIONES);

export interface GrupoParametros {
  grupo: Grupo;
  items: { clave: string; etiqueta: string; valor: string }[];
}

/** Agrupa y formatea los parámetros legales aplicados; las claves desconocidas van a "Otros". */
export function agruparParametros(parametros: Record<string, number>): GrupoParametros[] {
  const posicion = (clave: string) => (ORDEN.includes(clave) ? ORDEN.indexOf(clave) : ORDEN.length);
  const claves = Object.keys(parametros).sort((a, b) => posicion(a) - posicion(b) || a.localeCompare(b));
  return GRUPOS.map((grupo) => ({
    grupo,
    items: claves
      .filter((clave) => (DEFINICIONES[clave]?.grupo ?? "Otros") === grupo)
      .map((clave) => {
        const definicion = DEFINICIONES[clave];
        return {
          clave,
          etiqueta: definicion?.etiqueta ?? clave,
          valor: (definicion?.formato ?? formatoNumero)(parametros[clave]),
        };
      }),
  })).filter((g) => g.items.length > 0);
}
