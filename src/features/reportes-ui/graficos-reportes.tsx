"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { formatoHoras, formatoPesos } from "@/lib/formato";
import type { ReporteCostosProyectos, ReporteHoras } from "@/types/api";
import {
  aNumero,
  COLOR_ACENTO,
  COLOR_MARCA,
  COLOR_REJILLA,
  datoDeTooltip,
  GROSOR_BARRA,
  Leyenda,
  MarcoGrafico,
  pesosCompactos,
  PROPS_EJE,
  PROPS_TOOLTIP,
  RADIO_HORIZONTAL,
  RADIO_VERTICAL,
} from "./graficos";
import { AGRUPACIONES, etiquetaFila } from "./reporte-horas";

/** Máximo de categorías en gráficos de barras horizontales; el detalle completo queda en la tabla. */
export const MAX_BARRAS = 15;

interface FilaHoras {
  etiqueta: string;
  jornada: number;
  extra: number;
}

/** Horas por fila del reporte, separando jornada (incluye recargos) y horas extra. */
export function GraficoReporteHoras({ reporte }: { reporte: ReporteHoras }) {
  const horizontal = reporte.agrupacion === "trabajador" || reporte.agrupacion === "proyecto";
  const base = horizontal ? [...reporte.filas].sort((a, b) => b.horas - a.horas).slice(0, MAX_BARRAS) : reporte.filas;
  const filas: FilaHoras[] = base.map((f) => ({
    etiqueta: etiquetaFila(f.etiqueta),
    jornada: Math.max(0, Math.round((f.horas - f.horasExtra) * 100) / 100),
    extra: f.horasExtra,
  }));
  const recortado = horizontal && reporte.filas.length > MAX_BARRAS;
  const titulo = `Horas por ${AGRUPACIONES[reporte.agrupacion].toLowerCase()}`;
  const descripcion = `${titulo}, del ${etiquetaFila(reporte.desde)} al ${etiquetaFila(reporte.hasta)}: ${filas
    .map((f) => `${f.etiqueta} ${formatoHoras(f.jornada + f.extra)}`)
    .join(", ")}.`;

  const barras = [
    <Bar
      key="jornada"
      dataKey="jornada"
      name="Jornada y recargos"
      stackId="horas"
      fill={COLOR_MARCA}
      maxBarSize={GROSOR_BARRA}
    />,
    <Bar
      key="extra"
      dataKey="extra"
      name="Horas extra"
      stackId="horas"
      fill={COLOR_ACENTO}
      radius={horizontal ? RADIO_HORIZONTAL : RADIO_VERTICAL}
      maxBarSize={GROSOR_BARRA}
    />,
  ];
  const tooltip = (
    <Tooltip
      {...PROPS_TOOLTIP}
      labelFormatter={(etiqueta, carga) => datoDeTooltip<FilaHoras>(carga)?.etiqueta ?? etiqueta}
      formatter={(valor) => formatoHoras(aNumero(valor))}
    />
  );

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Leyenda
          items={[
            { color: COLOR_MARCA, etiqueta: "Jornada y recargos" },
            { color: COLOR_ACENTO, etiqueta: "Horas extra" },
          ]}
        />
        {recortado && <p className="text-xs text-slate-500">Se muestran las {MAX_BARRAS} filas con más horas</p>}
      </div>
      {horizontal ? (
        <MarcoGrafico alto={Math.max(160, filas.length * 34 + 32)} descripcion={descripcion}>
          <BarChart data={filas} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} title={titulo} desc={descripcion}>
            <CartesianGrid horizontal={false} stroke={COLOR_REJILLA} />
            <XAxis type="number" {...PROPS_EJE} />
            <YAxis type="category" dataKey="etiqueta" width={140} {...PROPS_EJE} />
            {tooltip}
            {barras}
          </BarChart>
        </MarcoGrafico>
      ) : (
        <MarcoGrafico alto={280} descripcion={descripcion}>
          <BarChart data={filas} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} title={titulo} desc={descripcion}>
            <CartesianGrid vertical={false} stroke={COLOR_REJILLA} />
            <XAxis dataKey="etiqueta" {...PROPS_EJE} />
            <YAxis {...PROPS_EJE} width={44} />
            {tooltip}
            {barras}
          </BarChart>
        </MarcoGrafico>
      )}
    </div>
  );
}

type FilaCosto = ReporteCostosProyectos["filas"][number];

/** Presupuesto frente a costo de mano de obra por proyecto. */
export function GraficoCostosProyectos({ filas }: { filas: FilaCosto[] }) {
  const datos = [...filas].sort((a, b) => b.costo - a.costo).slice(0, MAX_BARRAS);
  const descripcion = `Presupuesto y costo de mano de obra por proyecto: ${datos
    .map((p) => `${p.codigo} costo ${formatoPesos(p.costo)}, presupuesto ${formatoPesos(p.presupuesto)}`)
    .join("; ")}.`;

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Leyenda
          items={[
            { color: COLOR_MARCA, etiqueta: "Costo de mano de obra" },
            { color: COLOR_ACENTO, etiqueta: "Presupuesto" },
          ]}
        />
        {filas.length > MAX_BARRAS && (
          <p className="text-xs text-slate-500">Se muestran los {MAX_BARRAS} proyectos de mayor costo</p>
        )}
      </div>
      <MarcoGrafico alto={Math.max(180, datos.length * 52 + 32)} descripcion={descripcion}>
        <BarChart
          data={datos}
          layout="vertical"
          barGap={2}
          margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
          title="Presupuesto frente a costo por proyecto"
          desc={descripcion}
        >
          <CartesianGrid horizontal={false} stroke={COLOR_REJILLA} />
          <XAxis type="number" tickFormatter={pesosCompactos} {...PROPS_EJE} />
          <YAxis type="category" dataKey="codigo" width={84} {...PROPS_EJE} />
          <Tooltip
            {...PROPS_TOOLTIP}
            labelFormatter={(etiqueta, carga) => {
              const fila = datoDeTooltip<FilaCosto>(carga);
              return fila ? `${fila.codigo} · ${fila.nombre}` : etiqueta;
            }}
            formatter={(valor) => formatoPesos(aNumero(valor))}
          />
          <Bar dataKey="costo" name="Costo" fill={COLOR_MARCA} radius={RADIO_HORIZONTAL} maxBarSize={16} />
          <Bar dataKey="presupuesto" name="Presupuesto" fill={COLOR_ACENTO} radius={RADIO_HORIZONTAL} maxBarSize={16} />
        </BarChart>
      </MarcoGrafico>
    </div>
  );
}
