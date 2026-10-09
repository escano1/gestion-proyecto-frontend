import { formatoHoras, formatoPesos, formatoPorcentaje } from "@/lib/formato";
import type { CodigoParametro, ParametroLegal, ParametrosVigentes, UnidadParametro } from "@/types/api";

export const CODIGOS_PARAMETRO = [
  "SMMLV",
  "AUXILIO_TRANSPORTE",
  "UVT",
  "JORNADA_MAXIMA_SEMANAL",
  "RECARGO_NOCTURNO",
  "RECARGO_EXTRA_DIURNA",
  "RECARGO_EXTRA_NOCTURNA",
  "RECARGO_DOMINICAL_FESTIVO",
  "APORTE_SALUD_EMPLEADO",
  "APORTE_PENSION_EMPLEADO",
  "LIMITE_HORAS_EXTRA_DIA",
  "LIMITE_HORAS_EXTRA_SEMANA",
] as const satisfies readonly CodigoParametro[];

/** Valor legible según la unidad: PESOS → $, FRACCION → %, HORAS → h. */
export function formatoValorParametro(valor: number, unidad: UnidadParametro): string {
  if (unidad === "PESOS") return formatoPesos(valor);
  if (unidad === "FRACCION") return formatoPorcentaje(valor);
  return formatoHoras(valor);
}

/** El usuario escribe porcentajes (90) y el API espera fracciones (0.9). */
export function aValorApi(valor: number, unidad: UnidadParametro): number {
  return unidad === "FRACCION" ? Math.round(valor * 10_000) / 1_000_000 : valor;
}

export const ETIQUETA_UNIDAD: Record<UnidadParametro, string> = {
  PESOS: "COP",
  FRACCION: "%",
  HORAS: "horas",
};

type ClaveVigente = keyof ParametrosVigentes["valores"];

/** Agrupación de los valores vigentes para mostrarlos en tarjetas. */
export const GRUPOS_VIGENTES: {
  titulo: string;
  items: { clave: ClaveVigente; etiqueta: string; unidad: UnidadParametro }[];
}[] = [
  {
    titulo: "Salario y auxilio",
    items: [
      { clave: "smmlv", etiqueta: "Salario mínimo (SMMLV)", unidad: "PESOS" },
      { clave: "auxilioTransporte", etiqueta: "Auxilio de transporte", unidad: "PESOS" },
    ],
  },
  {
    titulo: "Tributarios",
    items: [{ clave: "uvt", etiqueta: "Unidad de valor tributario (UVT)", unidad: "PESOS" }],
  },
  {
    titulo: "Jornada y límites",
    items: [
      { clave: "jornadaMaximaSemanal", etiqueta: "Jornada máxima semanal", unidad: "HORAS" },
      { clave: "limiteHorasExtraDia", etiqueta: "Límite de horas extra por día", unidad: "HORAS" },
      { clave: "limiteHorasExtraSemana", etiqueta: "Límite de horas extra por semana", unidad: "HORAS" },
    ],
  },
  {
    titulo: "Recargos",
    items: [
      { clave: "recargoNocturno", etiqueta: "Nocturno", unidad: "FRACCION" },
      { clave: "recargoExtraDiurna", etiqueta: "Hora extra diurna", unidad: "FRACCION" },
      { clave: "recargoExtraNocturna", etiqueta: "Hora extra nocturna", unidad: "FRACCION" },
      { clave: "recargoDominicalFestivo", etiqueta: "Dominical y festivo", unidad: "FRACCION" },
    ],
  },
  {
    titulo: "Aportes del empleado",
    items: [
      { clave: "aporteSaludEmpleado", etiqueta: "Salud", unidad: "FRACCION" },
      { clave: "aportePensionEmpleado", etiqueta: "Pensión", unidad: "FRACCION" },
    ],
  },
];

export interface GrupoParametro {
  codigo: CodigoParametro;
  nombre: string;
  unidad: UnidadParametro;
  /** Vigencias ordenadas de la más reciente a la más antigua. */
  vigencias: ParametroLegal[];
  /** Id de la vigencia aplicable en la fecha de referencia (null si todas son futuras). */
  idVigente: number | null;
}

/** Agrupa el historial por código (orden del catálogo) y marca la vigencia aplicable en `fecha`. */
export function agruparPorCodigo(lista: ParametroLegal[], fecha: string): GrupoParametro[] {
  const grupos = new Map<CodigoParametro, ParametroLegal[]>();
  for (const p of lista) grupos.set(p.codigo, [...(grupos.get(p.codigo) ?? []), p]);

  const orden = (codigo: CodigoParametro) => {
    const i = CODIGOS_PARAMETRO.indexOf(codigo);
    return i === -1 ? CODIGOS_PARAMETRO.length : i;
  };

  return [...grupos.entries()]
    .sort(([a], [b]) => orden(a) - orden(b))
    .map(([codigo, vigencias]) => {
      const ordenadas = [...vigencias].sort((a, b) => b.vigenteDesde.localeCompare(a.vigenteDesde));
      return {
        codigo,
        nombre: ordenadas[0].nombre,
        unidad: ordenadas[0].unidad,
        vigencias: ordenadas,
        idVigente: ordenadas.find((v) => v.vigenteDesde <= fecha)?.id ?? null,
      };
    });
}
