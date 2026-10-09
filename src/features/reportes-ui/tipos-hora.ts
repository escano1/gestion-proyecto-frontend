import type { CodigoTipoHora } from "@/types/api";

/** Orden de presentación de los tipos de hora (igual al catálogo del API). */
export const ORDEN_TIPOS_HORA: readonly CodigoTipoHora[] = ["ORD", "NOC", "HED", "HEN", "DOM", "DOMN", "HEDD", "HEDN"];

/** Tipos que son trabajo suplementario (horas extra). */
export const CODIGOS_EXTRA: ReadonlySet<CodigoTipoHora> = new Set<CodigoTipoHora>(["HED", "HEN", "HEDD", "HEDN"]);
