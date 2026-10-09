import type {
  EstadoAvance,
  EstadoHerramienta,
  EstadoHito,
  EstadoLiquidacion,
  EstadoMaterial,
  EstadoProyecto,
  EstadoTrabajador,
  TipoContrato,
  TipoDocumento,
  TipoJornada,
  TipoPeriodo,
  TipoSalario,
} from "@/types/api";
import type { Tono } from "@/components/ui/display";

export const TIPOS_DOCUMENTO: Record<TipoDocumento, string> = {
  CC: "Cédula de ciudadanía",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
  PPT: "Permiso por protección temporal",
  TI: "Tarjeta de identidad",
};

export const TIPOS_SALARIO: Record<TipoSalario, string> = {
  MENSUAL: "Mensual",
  POR_HORA: "Por hora",
};

export const TIPOS_CONTRATO: Record<TipoContrato, string> = {
  INDEFINIDO: "Término indefinido",
  FIJO: "Término fijo",
  OBRA_LABOR: "Obra o labor",
  APRENDIZAJE: "Aprendizaje",
};

export const TIPOS_JORNADA: Record<TipoJornada, string> = {
  COMPLETA: "Completa (máxima legal)",
  PARCIAL: "Parcial",
};

export const TIPOS_PERIODO: Record<TipoPeriodo, string> = {
  QUINCENAL: "Quincenal",
  MENSUAL: "Mensual",
};

/** Etiqueta y color de cada estado para usar con <Badge>. */
export const ESTADOS: {
  trabajador: Record<EstadoTrabajador, [string, Tono]>;
  proyecto: Record<EstadoProyecto, [string, Tono]>;
  liquidacion: Record<EstadoLiquidacion, [string, Tono]>;
  material: Record<EstadoMaterial, [string, Tono]>;
  herramienta: Record<EstadoHerramienta, [string, Tono]>;
  hito: Record<EstadoHito, [string, Tono]>;
  avance: Record<EstadoAvance, [string, Tono]>;
} = {
  trabajador: { ACTIVO: ["Activo", "verde"], INACTIVO: ["Inactivo", "gris"] },
  proyecto: { ACTIVO: ["Activo", "verde"], SUSPENDIDO: ["Suspendido", "amarillo"], FINALIZADO: ["Finalizado", "gris"] },
  liquidacion: { BORRADOR: ["Borrador", "amarillo"], CERRADA: ["Cerrada", "verde"] },
  material: {
    PENDIENTE: ["Pendiente", "gris"],
    SOLICITADO: ["Solicitado", "azul"],
    ENTREGADO: ["Entregado", "amarillo"],
    INSTALADO: ["Instalado", "verde"],
  },
  herramienta: { ASIGNADA: ["Asignada", "azul"], DEVUELTA: ["Devuelta", "verde"], EXTRAVIADA: ["Extraviada", "rojo"] },
  hito: { PENDIENTE: ["Pendiente", "gris"], EN_PROGRESO: ["En progreso", "azul"], COMPLETADO: ["Completado", "verde"] },
  avance: {
    EN_TIEMPO: ["En tiempo", "verde"],
    RETRASADO: ["Retrasado", "rojo"],
    ADELANTADO: ["Adelantado", "azul"],
    SIN_HITOS: ["Sin hitos", "gris"],
  },
};

export const opciones = <T extends string>(mapa: Record<T, string>) =>
  (Object.entries(mapa) as [T, string][]).map(([valor, etiqueta]) => ({ valor, etiqueta }));
