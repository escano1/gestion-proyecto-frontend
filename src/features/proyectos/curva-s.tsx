"use client";

import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { formatoAvance, formatoFecha } from "@/lib/formato";
import type { AvanceProyecto } from "@/types/api";
import { COLORES_GRAFICO, ESTILO_TOOLTIP } from "./colores-grafico";

/** "2026-10-08" → "08/10/26" para el eje X. */
const fechaCorta = (fecha: string) => formatoFecha(fecha).replace(/\/(\d{2})(\d{2})$/, "/$2");

/** Curva S: avance acumulado planeado (punteado) vs real (continuo), 0–100 %. */
export function CurvaS({ datos }: { datos: AvanceProyecto["curva"] }) {
  const conPuntos = datos.length <= 24;
  return (
    <LineChart
      responsive
      data={datos}
      style={{ width: "100%", height: 300 }}
      margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
      accessibilityLayer
    >
      <CartesianGrid vertical={false} stroke={COLORES_GRAFICO.rejilla} />
      <XAxis
        dataKey="fecha"
        tickFormatter={fechaCorta}
        tick={{ fontSize: 12, fill: COLORES_GRAFICO.textoEje }}
        stroke={COLORES_GRAFICO.eje}
        minTickGap={24}
      />
      <YAxis
        domain={[0, 100]}
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v: number) => `${v} %`}
        tick={{ fontSize: 12, fill: COLORES_GRAFICO.textoEje }}
        stroke={COLORES_GRAFICO.eje}
        width={48}
      />
      <Tooltip
        contentStyle={ESTILO_TOOLTIP}
        labelFormatter={(fecha) => formatoFecha(String(fecha))}
        formatter={(valor, nombre) => [formatoAvance(Number(valor)), nombre]}
      />
      <Legend verticalAlign="top" align="right" height={32} iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
      <Line
        type="monotone"
        dataKey="planeado"
        name="Planeado"
        stroke={COLORES_GRAFICO.serie2}
        strokeWidth={2}
        strokeDasharray="6 4"
        dot={conPuntos ? { r: 3, strokeWidth: 0, fill: COLORES_GRAFICO.serie2 } : false}
        activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
      />
      <Line
        type="monotone"
        dataKey="real"
        name="Real"
        stroke={COLORES_GRAFICO.serie1}
        strokeWidth={2}
        dot={conPuntos ? { r: 4, strokeWidth: 2, stroke: "#fff", fill: COLORES_GRAFICO.serie1 } : false}
        activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
      />
    </LineChart>
  );
}
