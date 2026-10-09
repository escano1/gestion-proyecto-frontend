"use client";

import Link from "next/link";
import { useReporteCostosProyectos, type RangoFechas } from "@/features/reportes/api";
import { mensajeError } from "@/lib/errores";
import { formatoHoras, formatoPesos, formatoPorcentaje } from "@/lib/formato";
import { cn } from "@/lib/cn";
import { Badge, Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import { BarraFiltros, FiltroRango } from "./filtros";
import { GraficoCostosProyectos } from "./graficos-reportes";

/** Fracción del presupuesto ejecutada (null si el proyecto no tiene presupuesto). */
const ejecucion = (costo: number, presupuesto: number | null) =>
  presupuesto && presupuesto > 0 ? costo / presupuesto : null;

function Ejecucion({ fraccion }: { fraccion: number | null }) {
  if (fraccion === null) return <span className="text-slate-400">Sin presupuesto</span>;
  if (fraccion > 1) return <Badge tono="rojo">{formatoPorcentaje(fraccion)}</Badge>;
  return <span>{formatoPorcentaje(fraccion)}</span>;
}

export function CostosProyectosTab({ rango, onCambiarRango }: { rango: RangoFechas; onCambiarRango: (r: RangoFechas) => void }) {
  const consulta = useReporteCostosProyectos(rango);
  const filas = consulta.data?.filas ?? [];
  const totalHoras = filas.reduce((suma, f) => suma + f.horas, 0);
  const totalPresupuesto = filas.reduce((suma, f) => suma + (f.presupuesto ?? 0), 0);

  return (
    <div className="space-y-6">
      <Card>
        <BarraFiltros>
          <FiltroRango rango={rango} onCambiar={onCambiarRango} />
          <p className="pb-2 text-xs text-slate-500 sm:ml-auto sm:max-w-xs">
            Costo de mano de obra directo en el rango frente al presupuesto total de cada proyecto.
          </p>
        </BarraFiltros>

        {consulta.isPending ? (
          <Spinner />
        ) : consulta.isError ? (
          <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
        ) : filas.length === 0 ? (
          <EmptyState titulo="Sin costos en el rango" descripcion="No hay horas registradas en proyectos para estas fechas." />
        ) : (
          <div className={cn("transition-opacity", consulta.isPlaceholderData && "opacity-60")} aria-busy={consulta.isFetching}>
            <Table>
              <thead>
                <tr>
                  <Th>Proyecto</Th>
                  <Th>Estado</Th>
                  <Th alinear="derecha">Horas</Th>
                  <Th alinear="derecha">Presupuesto</Th>
                  <Th alinear="derecha">Costo</Th>
                  <Th alinear="derecha">Ejecución</Th>
                </tr>
              </thead>
              <TBody>
                {filas.map((f) => (
                  <Tr key={f.proyectoId}>
                    <Td>
                      <Link href={`/proyectos/${f.proyectoId}`} className="hover:underline">
                        <span className="font-medium text-marca-700">{f.codigo}</span>
                        <span className="block text-xs text-slate-500">{f.nombre}</span>
                      </Link>
                    </Td>
                    <Td>
                      <EstadoBadge dominio="proyecto" estado={f.estado} />
                    </Td>
                    <Td alinear="derecha">{formatoHoras(f.horas)}</Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {formatoPesos(f.presupuesto)}
                    </Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {formatoPesos(f.costo)}
                    </Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      <Ejecucion fraccion={ejecucion(f.costo, f.presupuesto)} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <tr>
                  <Td className="text-slate-900" colSpan={2}>
                    Total
                  </Td>
                  <Td alinear="derecha">{formatoHoras(Math.round(totalHoras * 100) / 100)}</Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(totalPresupuesto)}
                  </Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(consulta.data.total)}
                  </Td>
                  <Td />
                </tr>
              </tfoot>
            </Table>
          </div>
        )}
      </Card>

      {filas.length > 0 && (
        <Card>
          <CardHeader titulo="Presupuesto frente a costo" descripcion="Proyectos de mayor costo en el rango" />
          <GraficoCostosProyectos filas={filas} />
        </Card>
      )}
    </div>
  );
}
