import type { Rol } from "@/types/api";

/** Espejo de las reglas de roles del API (docs/API.md). ADMIN puede todo. */
const ESCRITURA: Record<string, Rol[]> = {
  trabajadores: ["NOMINA"],
  proyectos: ["GESTOR_PROYECTOS"],
  asignaciones: ["GESTOR_PROYECTOS"],
  horas: ["GESTOR_PROYECTOS", "NOMINA"],
  nomina: ["NOMINA"],
  parametros: ["NOMINA"],
  operacionProyecto: ["GESTOR_PROYECTOS"], // materiales
  usuarios: [],
  auditoria: [],
};

export type Recurso = keyof typeof ESCRITURA;

export function puedeEscribir(rol: Rol | undefined, recurso: Recurso): boolean {
  if (!rol) return false;
  return rol === "ADMIN" || ESCRITURA[recurso].includes(rol);
}

/** Recursos cuya lectura también está restringida. */
export function puedeVerNomina(rol: Rol | undefined): boolean {
  return rol === "ADMIN" || rol === "NOMINA";
}

export const esAdmin = (rol: Rol | undefined) => rol === "ADMIN";

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: "Administrador",
  GESTOR_PROYECTOS: "Gestor de proyectos",
  NOMINA: "Nómina",
  CONSULTA: "Consulta",
};
