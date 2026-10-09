"use client";

import Link from "next/link";
import { usePendientes } from "@/features/reportes/api";
import { mensajeError } from "@/lib/errores";
import { formatoFecha, formatoNumero } from "@/lib/formato";
import { Badge, Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { ProyectoRef } from "@/types/api";

function EnlaceProyecto({ proyecto }: { proyecto: ProyectoRef }) {
  return (
    <Link href={`/proyectos/${proyecto.id}`} className="hover:underline" title={proyecto.nombre}>
      <span className="font-medium text-marca-700">{proyecto.codigo}</span>
      <span className="block max-w-48 truncate text-xs text-slate-500">{proyecto.nombre}</span>
    </Link>
  );
}

/** Los vencidos primero, conservando el orden del API. */
const vencidosPrimero = <T,>(lista: T[], vencido: (item: T) => boolean) =>
  [...lista].sort((a, b) => Number(vencido(b)) - Number(vencido(a)));

const resumen = (total: number, vencidos: number, singular: string, plural: string) =>
  `${total} ${total === 1 ? singular : plural}${vencidos ? ` · ${vencidos} vencido${vencidos === 1 ? "" : "s"}` : ""}`;

export function PendientesTab() {
  const consulta = usePendientes();

  if (consulta.isPending) return <Spinner />;
  if (consulta.isError) {
    return (
      <Card>
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      </Card>
    );
  }

  const materiales = vencidosPrimero(consulta.data.materiales, (m) => m.vencido);
  const herramientas = vencidosPrimero(consulta.data.herramientas, (h) => h.vencida);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          titulo="Materiales pendientes"
          descripcion={resumen(materiales.length, materiales.filter((m) => m.vencido).length, "material pendiente o solicitado", "materiales pendientes o solicitados")}
        />
        {materiales.length === 0 ? (
          <EmptyState titulo="Sin materiales pendientes" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Material</Th>
                <Th>Proyecto</Th>
                <Th alinear="derecha">Cantidad</Th>
                <Th>Estado</Th>
                <Th>Requerido para</Th>
                <Th>Solicitado por</Th>
              </tr>
            </thead>
            <TBody>
              {materiales.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <span className="font-medium text-slate-900">{m.nombre}</span>
                    {m.descripcion && <span className="block text-xs text-slate-500">{m.descripcion}</span>}
                  </Td>
                  <Td>
                    <EnlaceProyecto proyecto={m.proyecto} />
                  </Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoNumero(m.cantidadSolicitada)} {m.unidadMedida}
                  </Td>
                  <Td>
                    <EstadoBadge dominio="material" estado={m.estado} />
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatoFecha(m.fechaRequerida)}
                    {m.vencido && (
                      <Badge tono="rojo" className="ml-2">
                        Vencido
                      </Badge>
                    )}
                  </Td>
                  <Td>{m.solicitadoPor.nombre}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          titulo="Herramientas asignadas"
          descripcion={resumen(herramientas.length, herramientas.filter((h) => h.vencida).length, "herramienta con devolución prevista", "herramientas con devolución prevista")}
        />
        {herramientas.length === 0 ? (
          <EmptyState titulo="Sin herramientas por devolver" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Herramienta</Th>
                <Th>Proyecto</Th>
                <Th alinear="derecha">Cantidad</Th>
                <Th>Responsable</Th>
                <Th>Asignada</Th>
                <Th>Devolución prevista</Th>
              </tr>
            </thead>
            <TBody>
              {herramientas.map((h) => (
                <Tr key={h.id}>
                  <Td>
                    <span className="font-medium text-slate-900">{h.nombre}</span>
                    {h.codigo && <span className="block text-xs text-slate-500">{h.codigo}</span>}
                  </Td>
                  <Td>
                    <EnlaceProyecto proyecto={h.proyecto} />
                  </Td>
                  <Td alinear="derecha">{formatoNumero(h.cantidad)}</Td>
                  <Td>{h.responsable?.nombre ?? "—"}</Td>
                  <Td className="whitespace-nowrap">{formatoFecha(h.fechaAsignacion)}</Td>
                  <Td className="whitespace-nowrap">
                    {formatoFecha(h.fechaDevolucionPrevista)}
                    {h.vencida && (
                      <Badge tono="rojo" className="ml-2">
                        Vencida
                      </Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
