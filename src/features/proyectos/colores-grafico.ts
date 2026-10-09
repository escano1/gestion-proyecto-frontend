import type { CSSProperties } from "react";

/** Paleta de los gráficos del módulo (serie 1 = azul de marca, serie 2 = naranja; texto siempre en tinta neutra). */
export const COLORES_GRAFICO = {
  serie1: "#2563eb",
  serie2: "#eb6834",
  texto: "#334155",
  textoEje: "#64748b",
  eje: "#cbd5e1",
  rejilla: "#e2e8f0",
  cursor: "#f1f5f9",
} as const;

export const ESTILO_TOOLTIP: CSSProperties = {
  borderRadius: 6,
  borderColor: "#e2e8f0",
  fontSize: 12,
  boxShadow: "0 1px 3px rgb(15 23 42 / 0.1)",
};
