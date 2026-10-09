"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis, type YAxisTickContentProps } from "recharts";
import { formatoHoras, formatoNumero } from "@/lib/formato";
import type { ResumenProyecto } from "@/types/api";
import { COLORES_GRAFICO, ESTILO_TOOLTIP } from "./colores-grafico";
import { etiquetaEnLineas } from "./utilidades";

interface Props {
  datos: ResumenProyecto["horas"]["porTipo"];
}

const ALTO_FILA = 44;
const ALTO_LINEA = 14;

/** Tick del eje de categorías: nombre del tipo de hora en hasta 2 líneas, alineado a la derecha. */
function TickTipoHora({ x, y, payload }: YAxisTickContentProps) {
  const lineas = etiquetaEnLineas(String(payload.value ?? ""));
  const desplazamiento = -((lineas.length - 1) * ALTO_LINEA) / 2;
  return (
    <text x={Number(x) - 6} y={Number(y)} textAnchor="end" fontSize={12} fill={COLORES_GRAFICO.texto}>
      {lineas.map((linea, i) => (
        <tspan key={`${i}-${linea}`} x={Number(x) - 6} dy={i === 0 ? desplazamiento + 4 : ALTO_LINEA}>
          {linea}
        </tspan>
      ))}
    </text>
  );
}

/** Barras horizontales: los nombres de los tipos de hora son largos y así se leen bien en móvil. */
export function GraficoHorasTipo({ datos }: Props) {
  const filas = datos.filter((d) => d.horas > 0);
  return (
    <BarChart
      responsive
      layout="vertical"
      data={filas}
      style={{ width: "100%", height: filas.length * ALTO_FILA + 32 }}
      margin={{ top: 4, right: 56, bottom: 4, left: 0 }}
      accessibilityLayer
    >
      <CartesianGrid horizontal={false} stroke={COLORES_GRAFICO.rejilla} />
      <XAxis
        type="number"
        tickFormatter={(v: number) => formatoNumero(v)}
        tick={{ fontSize: 12, fill: COLORES_GRAFICO.textoEje }}
        stroke={COLORES_GRAFICO.eje}
        allowDecimals={false}
      />
      <YAxis
        type="category"
        dataKey="nombre"
        width={150}
        tick={TickTipoHora}
        stroke={COLORES_GRAFICO.eje}
        tickLine={false}
        interval={0}
      />
      <Tooltip
        cursor={{ fill: COLORES_GRAFICO.cursor }}
        contentStyle={ESTILO_TOOLTIP}
        formatter={(valor) => [formatoHoras(Number(valor)), "Horas"]}
      />
      <Bar dataKey="horas" name="Horas" fill={COLORES_GRAFICO.serie1} radius={[0, 4, 4, 0]} maxBarSize={20}>
        <LabelList
          dataKey="horas"
          position="right"
          formatter={(valor) => formatoHoras(Number(valor))}
          style={{ fontSize: 12, fill: COLORES_GRAFICO.texto }}
        />
      </Bar>
    </BarChart>
  );
}
