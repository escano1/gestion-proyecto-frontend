import type { Tono } from "@/components/ui/display";
import type { AccionAuditoria } from "@/types/api";

/** Entidades auditadas por el API y su nombre visible. */
export const ENTIDADES_AUDITADAS: Record<string, string> = {
  Usuario: "Usuario",
  Trabajador: "Trabajador",
  Proyecto: "Proyecto",
  AsignacionProyecto: "Asignación a proyecto",
  ParametroLegal: "Parámetro legal",
  RegistroHoras: "Registro de horas",
  LiquidacionNomina: "Liquidación de nómina",
  MaterialProyecto: "Material de proyecto",
  HerramientaProyecto: "Herramienta de proyecto",
  HitoProyecto: "Hito de proyecto",
  BitacoraEntrada: "Entrada de bitácora",
};

export const ACCIONES_AUDITORIA: Record<AccionAuditoria, [string, Tono]> = {
  CREAR: ["Crear", "verde"],
  ACTUALIZAR: ["Actualizar", "azul"],
  ELIMINAR: ["Eliminar", "rojo"],
  CALCULAR: ["Calcular", "gris"],
  CERRAR: ["Cerrar", "amarillo"],
  REABRIR: ["Reabrir", "amarillo"],
};
