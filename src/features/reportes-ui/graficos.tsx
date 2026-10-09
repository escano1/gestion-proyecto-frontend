"use client";

import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/cn";

// Paleta y estilos comunes de los gráficos (Recharts) del dashboard y los reportes.
export const COLOR_MARCA = "#1d4ed8"; // marca-700
export const COLOR_ACENTO = "#f59e0b"; // acento-500
export const COLOR_REJILLA = "#e2e8f0"; // slate-200
export const COLOR_TEXTO_EJE = "#64748b"; // slate-500
export const COLOR_CURSOR = "#f1f5f9"; // slate-100

/** Grosor máximo de barra (px) y radio del extremo de datos. */
export const GROSOR_BARRA = 24;
export const RADIO_VERTICAL: [number, number, number, number] = [4, 4, 0, 0];
export const RADIO_HORIZONTAL: [number, number, number, number] = [0, 4, 4, 0];

/** Propiedades compartidas de los ejes: texto discreto, sin líneas de eje ni marcas. */
export const PROPS_EJE = {
  tick: { fill: COLOR_TEXTO_EJE, fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const;

export const PROPS_TOOLTIP = {
  cursor: { fill: COLOR_CURSOR },
  contentStyle: {
    borderRadius: 8,
    borderColor: COLOR_REJILLA,
    fontSize: 12,
    boxShadow: "0 1px 3px rgb(15 23 42 / 0.08)",
  },
  labelStyle: { color: "#0f172a", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "#334155", padding: 0 },
} as const;

const compacto = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

/** Montos abreviados para ejes: 1.250.000 → "$ 1,3 M". */
export const pesosCompactos = (valor: number) => `$ ${compacto.format(valor)}`;

/** Convierte el valor que entrega el tooltip de Recharts a número (NaN si no aplica). */
export const aNumero = (valor: unknown): number => (typeof valor === "number" ? valor : Number(valor));

/** Fila de datos asociada al elemento señalado en el tooltip. */
export const datoDeTooltip = <T,>(carga: ReadonlyArray<{ payload?: unknown }>): T | undefined =>
  carga[0]?.payload as T | undefined;

interface MarcoGraficoProps {
  /** Alto en píxeles del área del gráfico. */
  alto: number;
  /** Resumen textual del gráfico para lectores de pantalla. */
  descripcion: string;
  className?: string;
  children: ReactElement;
}

/** Contenedor responsivo con descripción accesible. */
export function MarcoGrafico({ alto, descripcion, className, children }: MarcoGraficoProps) {
  return (
    <figure className={cn("w-full", className)}>
      <div style={{ height: alto }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">{descripcion}</figcaption>
    </figure>
  );
}

/** Leyenda en HTML (texto en tinta neutra; el color lo lleva la muestra). */
export function Leyenda({ items }: { items: { color: string; etiqueta: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map(({ color, etiqueta }) => (
        <li key={etiqueta} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
          {etiqueta}
        </li>
      ))}
    </ul>
  );
}
