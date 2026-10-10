"use client";

import Link from "next/link";
import { Clock, PackageSearch, Wallet } from "lucide-react";
import { useResumenProyecto } from "@/features/reportes/api";
import { mensajeError } from "@/lib/errores";
import { formatoAvance, formatoHoras, formatoPesos } from "@/lib/formato";
import { Card, CardHeader, EmptyState, ErrorState, Spinner, StatCard } from "@/components/ui/display";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import { BarraProgreso } from "./barra-progreso";
import { GraficoHorasTipo } from "./grafico-horas-tipo";
import { porcentajeEjecucion } from "./utilidades";

export function PestanaResumen({ proyectoId }: { proyectoId: number }) {
  const consulta = useResumenProyecto(proyectoId);

  if (consulta.isPending) return <Spinner />;
  if (consulta.isError) {
    return (
      <Card>
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      </Card>
    );
  }

  const { proyecto, horas, costoManoObra, costoPorTrabajador, costoMateriales } = consulta.data;
  const ejecucion = porcentajeEjecucion(costoManoObra, proyecto.presupuesto);
  const sobrecosto = ejecucion !== null && ejecucion > 100;
  const hayHoras = horas.porTipo.some((t) => t.horas > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          titulo="Horas registradas"
          valor={formatoHoras(horas.total)}
          detalle={`${formatoHoras(horas.horasExtra)} extra`}
          icono={<Clock className="size-5" aria-hidden />}
        />
        <StatCard
          titulo="Costo de mano de obra"
          valor={formatoPesos(costoManoObra)}
          tono={sobrecosto ? "alerta" : "normal"}
          icono={<Wallet className="size-5" aria-hidden />}
          detalle={
            ejecucion === null ? (
              "Sin presupuesto definido"
            ) : (
              <span className="block space-y-1.5">
                <span className="block">
                  {formatoAvance(ejecucion)} de {formatoPesos(proyecto.presupuesto)}
                </span>
                <BarraProgreso valor={ejecucion} etiqueta="Ejecución del presupuesto" tono={sobrecosto ? "rojo" : "marca"} />
              </span>
            )
          }
        />
        <StatCard
          titulo="Costo de materiales"
          valor={formatoPesos(costoMateriales)}
          icono={<PackageSearch className="size-5" aria-hidden />}
          detalle="Precio × cantidad de cada material"
        />
      </div>
      <p className="-mt-3 text-xs text-slate-500">
        El costo de mano de obra es directo (horas × valor hora × recargo), sin carga prestacional ni aportes del
        empleador; se calcula con el salario actual de cada trabajador.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader titulo="Horas por tipo" descripcion="Acumulado de toda la vida del proyecto" />
          <div className="p-4">
            {hayHoras ? (
              <GraficoHorasTipo datos={horas.porTipo} />
            ) : (
              <EmptyState titulo="Sin horas registradas" descripcion="Aún no hay horas cargadas a este proyecto." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Costo por trabajador" descripcion="Ordenado de mayor a menor costo" />
          {costoPorTrabajador.length === 0 ? (
            <EmptyState titulo="Sin costos" descripcion="Los costos aparecen al registrar horas." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Trabajador</Th>
                  <Th alinear="derecha">Horas</Th>
                  <Th alinear="derecha">Costo</Th>
                  <Th alinear="derecha">% del total</Th>
                </tr>
              </thead>
              <TBody>
                {costoPorTrabajador.map((fila) => (
                  <Tr key={fila.trabajadorId}>
                    <Td>
                      <Link href={`/trabajadores/${fila.trabajadorId}`} className="text-marca-700 hover:underline">
                        {fila.nombre}
                      </Link>
                    </Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {formatoHoras(fila.horas)}
                    </Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {formatoPesos(fila.costo)}
                    </Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {costoManoObra > 0 ? formatoAvance(Math.round((fila.costo / costoManoObra) * 1000) / 10) : "—"}
                    </Td>
                  </Tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <Td>Total</Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoHoras(horas.total)}
                  </Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(costoManoObra)}
                  </Td>
                  <Td />
                </tr>
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
