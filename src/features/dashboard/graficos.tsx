"use client";

import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { formatoHoras, formatoPesos } from "@/lib/formato";
import {
  aNumero,
  COLOR_ACENTO,
  COLOR_MARCA,
  COLOR_REJILLA,
  COLOR_TEXTO_EJE,
  datoDeTooltip,
  GROSOR_BARRA,
  Leyenda,
  MarcoGrafico,
  pesosCompactos,
  PROPS_EJE,
  PROPS_TOOLTIP,
  RADIO_HORIZONTAL,
  RADIO_VERTICAL,
} from "@/features/reportes-ui/graficos";
import { CODIGOS_EXTRA } from "@/features/reportes-ui/tipos-hora";
import type { Dashboard } from "@/types/api";

interface FilaTipo {
  codigo: string;
  nombre: string;
  jornada: number | null;
  extra: number | null;
}

/** Columnas de horas del mes por tipo; las horas extra van en color de acento. */
export function GraficoHorasPorTipo({ datos }: { datos: Dashboard["mes"]["porTipo"] }) {
  const filas: FilaTipo[] = datos.map((t) => {
    const esExtra = CODIGOS_EXTRA.has(t.codigo);
    return { codigo: t.codigo, nombre: t.nombre, jornada: esExtra ? null : t.horas, extra: esExtra ? t.horas : null };
  });
  const descripcion = `Horas del mes por tipo de hora: ${datos
    .map((t) => `${t.nombre} ${formatoHoras(t.horas)}`)
    .join(", ")}.`;

  return (
    <div className="space-y-3 p-4">
      <Leyenda
        items={[
          { color: COLOR_MARCA, etiqueta: "Jornada y recargos" },
          { color: COLOR_ACENTO, etiqueta: "Horas extra" },
        ]}
      />
      <MarcoGrafico alto={260} descripcion={descripcion}>
        <BarChart
          data={filas}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          title="Horas del mes por tipo de hora"
          desc={descripcion}
        >
          <CartesianGrid vertical={false} stroke={COLOR_REJILLA} />
          <XAxis dataKey="codigo" {...PROPS_EJE} />
          <YAxis {...PROPS_EJE} width={44} />
          <Tooltip
            {...PROPS_TOOLTIP}
            labelFormatter={(etiqueta, carga) => datoDeTooltip<FilaTipo>(carga)?.nombre ?? etiqueta}
            formatter={(valor) => formatoHoras(aNumero(valor))}
          />
          <Bar
            dataKey="jornada"
            name="Jornada y recargos"
            stackId="horas"
            fill={COLOR_MARCA}
            radius={RADIO_VERTICAL}
            maxBarSize={GROSOR_BARRA}
          />
          <Bar
            dataKey="extra"
            name="Horas extra"
            stackId="horas"
            fill={COLOR_ACENTO}
            radius={RADIO_VERTICAL}
            maxBarSize={GROSOR_BARRA}
          />
        </BarChart>
      </MarcoGrafico>
    </div>
  );
}

type FilaCosto = Dashboard["costoPorProyecto"][number];

/** Barras horizontales del costo de mano de obra del mes por proyecto (top 8). */
export function GraficoCostoPorProyecto({ datos }: { datos: Dashboard["costoPorProyecto"] }) {
  const descripcion = `Costo de mano de obra del mes por proyecto: ${datos
    .map((p) => `${p.codigo} ${formatoPesos(p.costo)}`)
    .join(", ")}.`;

  return (
    <div className="p-4">
      <MarcoGrafico alto={Math.max(160, datos.length * 40 + 32)} descripcion={descripcion}>
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 4, right: 64, bottom: 0, left: 0 }}
          title="Costo de mano de obra del mes por proyecto"
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
          <Bar dataKey="costo" name="Costo" fill={COLOR_MARCA} radius={RADIO_HORIZONTAL} maxBarSize={GROSOR_BARRA}>
            <LabelList
              dataKey="costo"
              position="right"
              fill={COLOR_TEXTO_EJE}
              fontSize={12}
              formatter={(v) => (typeof v === "number" ? pesosCompactos(v) : v)}
            />
          </Bar>
        </BarChart>
      </MarcoGrafico>
    </div>
  );
}
