"use client";

import Link from "next/link";
import { PackageSearch, Users, Wallet } from "lucide-react";
import { useResumenProyecto } from "@/features/reportes/api";
import { mensajeError } from "@/lib/errores";
import { formatoAvance, formatoPesos } from "@/lib/formato";
import { Card, CardHeader, EmptyState, ErrorState, Spinner, StatCard } from "@/components/ui/display";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import { porcentajeEjecucion } from "./utilidades";

/** Gastos del proyecto: mano de obra (horas costeadas) + materiales (precio × cantidad). */
export function PestanaGastos({ proyectoId }: { proyectoId: number }) {
  const consulta = useResumenProyecto(proyectoId);

  if (consulta.isPending) return <Spinner />;
  if (consulta.isError) {
    return (
      <Card>
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      </Card>
    );
  }

  const { proyecto, costoManoObra, costoPorTrabajador, costoMateriales, costoPorMaterial, gastoTotal } = consulta.data;
  const ejecucion = porcentajeEjecucion(gastoTotal, proyecto.presupuesto);
  const sobrecosto = ejecucion !== null && ejecucion > 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          titulo="Gasto total"
          valor={formatoPesos(gastoTotal)}
          tono={sobrecosto ? "alerta" : "normal"}
          icono={<Wallet className="size-5" aria-hidden />}
          detalle={
            ejecucion === null
              ? "Sin presupuesto definido"
              : `${formatoAvance(ejecucion)} de ${formatoPesos(proyecto.presupuesto)}`
          }
        />
        <StatCard
          titulo="Mano de obra"
          valor={formatoPesos(costoManoObra)}
          icono={<Users className="size-5" aria-hidden />}
          detalle="Horas registradas, costo directo"
        />
        <StatCard
          titulo="Materiales"
          valor={formatoPesos(costoMateriales)}
          icono={<PackageSearch className="size-5" aria-hidden />}
          detalle="Precio × cantidad de cada material"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader titulo="Mano de obra por trabajador" descripcion="Ordenado de mayor a menor costo" />
          {costoPorTrabajador.length === 0 ? (
            <EmptyState titulo="Sin costos" descripcion="Los costos aparecen al registrar horas." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Trabajador</Th>
                  <Th alinear="derecha">Costo</Th>
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
                      {formatoPesos(fila.costo)}
                    </Td>
                  </Tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <Td>Total</Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(costoManoObra)}
                  </Td>
                </tr>
              </TBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader titulo="Materiales" descripcion="Precio × cantidad de cada material" />
          {costoPorMaterial.length === 0 ? (
            <EmptyState
              titulo="Sin costos de material"
              descripcion="Agregue materiales en la pestaña Materiales."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Material</Th>
                  <Th alinear="derecha">Cantidad</Th>
                  <Th alinear="derecha">Costo</Th>
                </tr>
              </thead>
              <TBody>
                {costoPorMaterial.map((fila) => (
                  <Tr key={fila.materialId}>
                    <Td>{fila.nombre}</Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {fila.cantidad}
                    </Td>
                    <Td alinear="derecha" className="whitespace-nowrap">
                      {formatoPesos(fila.costo)}
                    </Td>
                  </Tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <Td>Total</Td>
                  <Td />
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(costoMateriales)}
                  </Td>
                </tr>
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
