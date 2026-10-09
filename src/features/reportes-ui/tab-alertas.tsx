"use client";

import Link from "next/link";
import { useAlertasHorasExtra, type RangoFechas } from "@/features/reportes/api";
import { mensajeError } from "@/lib/errores";
import { formatoFecha, formatoHoras } from "@/lib/formato";
import { sumarDias } from "@/lib/fechas";
import { cn } from "@/lib/cn";
import { Badge, Card, EmptyState, ErrorState, Spinner, type Tono } from "@/components/ui/display";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { AlertaHoras, TipoAlertaHoras } from "@/types/api";
import { BarraFiltros, FiltroRango } from "./filtros";

const TIPOS_ALERTA: Record<TipoAlertaHoras, [string, Tono]> = {
  EXTRA_DIA: ["Extra diaria", "amarillo"],
  EXTRA_SEMANA: ["Extra semanal", "amarillo"],
  JORNADA_SEMANA: ["Jornada semanal", "rojo"],
};

/** `periodo` es la fecha (alerta diaria) o el lunes de la semana. */
function textoPeriodo(a: AlertaHoras): string {
  return a.tipo === "EXTRA_DIA"
    ? formatoFecha(a.periodo)
    : `Semana ${formatoFecha(a.periodo)} – ${formatoFecha(sumarDias(a.periodo, 6))}`;
}

export function AlertasTab({ rango, onCambiarRango }: { rango: RangoFechas; onCambiarRango: (r: RangoFechas) => void }) {
  const consulta = useAlertasHorasExtra(rango);

  return (
    <Card>
      <BarraFiltros>
        <FiltroRango rango={rango} onCambiar={onCambiarRango} />
        <p className="pb-2 text-xs text-slate-500 sm:ml-auto sm:max-w-sm">
          Superan los límites legales de horas extra por día o semana, o la jornada máxima semanal sin horas extra
          clasificadas.
        </p>
      </BarraFiltros>

      {consulta.isPending ? (
        <Spinner />
      ) : consulta.isError ? (
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      ) : consulta.data.alertas.length === 0 ? (
        <EmptyState titulo="Sin alertas en el rango" descripcion="Ningún trabajador supera los límites de horas." />
      ) : (
        <div className={cn("transition-opacity", consulta.isPlaceholderData && "opacity-60")} aria-busy={consulta.isFetching}>
          <Table>
            <thead>
              <tr>
                <Th>Tipo</Th>
                <Th>Trabajador</Th>
                <Th>Periodo</Th>
                <Th alinear="derecha">Horas / límite</Th>
                <Th alinear="derecha">Exceso</Th>
                <Th className="hidden md:table-cell">Detalle</Th>
              </tr>
            </thead>
            <TBody>
              {consulta.data.alertas.map((a) => {
                const [etiqueta, tono] = TIPOS_ALERTA[a.tipo];
                return (
                  <Tr key={`${a.trabajadorId}-${a.tipo}-${a.periodo}`}>
                    <Td>
                      <Badge tono={tono}>{etiqueta}</Badge>
                    </Td>
                    <Td>
                      <Link href={`/trabajadores/${a.trabajadorId}`} className="font-medium text-marca-700 hover:underline">
                        {a.nombre}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap">{textoPeriodo(a)}</Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {formatoHoras(a.horas)} / {formatoHoras(a.limite)}
                    </Td>
                    <Td alinear="derecha" className="whitespace-nowrap font-medium text-red-700">
                      +{formatoHoras(Math.round((a.horas - a.limite) * 100) / 100)}
                    </Td>
                    <Td className="hidden text-xs text-slate-500 md:table-cell">{a.mensaje}</Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
