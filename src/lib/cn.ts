import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Los colores propios del tema (marca, acento) deben reconocerse como colores para resolver conflictos.
const fusionar = extendTailwindMerge({
  extend: { theme: { color: ["marca-50", "marca-100", "marca-500", "marca-600", "marca-700", "marca-800", "acento-400", "acento-500"] } },
});

/** Une clases y resuelve conflictos de Tailwind: la última gana (`w-full` + `w-40` → `w-40`). */
export const cn = (...clases: ClassValue[]) => fusionar(clsx(clases));
