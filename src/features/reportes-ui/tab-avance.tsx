"use client";

import { useState } from "react";
import Link from "next/link";
import { useAvanceProyectos } from "@/features/reportes/api";
import { mensajeError } from "@/lib/errores";
import { formatoFecha, formatoNumero } from "@/lib/formato";
import { ESTADOS } from "@/lib/etiquetas";
import { cn } from "@/lib/cn";
import { Card, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Field, Select } from "@/components/ui/form-controls";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { EstadoProyecto } from "@/types/api";
import { BarrasAvance } from "./barra-avance";
import { BarraFiltros } from "./filtros";

const ESTADOS_PROYECTO = Object.entries(ESTADOS.proyecto) as [EstadoProyecto, [string, unknown]][];

/** Diferencia real − planeado en puntos porcentuales. */
function Desviacion({ valor }: { valor: number }) {
  const redondeado = Math.round(valor * 10) / 10;
  return (
    <span className={cn("tabular-nums", redondeado < 0 ? "text-red-700" : "text-slate-700")}>
      {redondeado > 0 ? "+" : ""}
      {formatoNumero(redondeado)} pp
    </span>
  );
}

export function AvanceProyectosTab() {
  const [estado, setEstado] = useState<EstadoProyecto>("ACTIVO");
  const consulta = useAvanceProyectos(estado);

  return (
    <Card>
      <BarraFiltros>
        <Field label="Estado del proyecto" className="w-full sm:w-48">
          {(id) => (
            <Select id={id} value={estado} onChange={(e) => setEstado(e.target.value as EstadoProyecto)}>
              {ESTADOS_PROYECTO.map(([valor, [etiqueta]]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <p className="pb-2 text-xs text-slate-500 sm:ml-auto sm:max-w-sm">
          Avance ponderado por el peso de los hitos; el planeado se calcula con sus fechas previstas.
        </p>
      </BarraFiltros>

      {consulta.isPending ? (
        <Spinner />
      ) : consulta.isError ? (
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EmptyState titulo="Sin proyectos en este estado" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Proyecto</Th>
              <Th>Cliente</Th>
              <Th>Fin planeado</Th>
              <Th className="min-w-64">Avance</Th>
              <Th alinear="derecha">Desviación</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <TBody>
            {consulta.data.map(({ proyecto: p, avance }) => (
              <Tr key={p.id}>
                <Td>
                  <Link href={`/proyectos/${p.id}`} className="hover:underline">
                    <span className="font-medium text-marca-700">{p.codigo}</span>
                    <span className="block text-xs text-slate-500">{p.nombre}</span>
                  </Link>
                </Td>
                <Td>{p.cliente}</Td>
                <Td className="whitespace-nowrap">{formatoFecha(p.fechaFinPlaneada)}</Td>
                <Td>
                  <BarrasAvance real={avance.avanceReal} planeado={avance.avancePlaneado} />
                </Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {avance.estado === "SIN_HITOS" ? "—" : <Desviacion valor={avance.avanceReal - avance.avancePlaneado} />}
                </Td>
                <Td>
                  <EstadoBadge dominio="avance" estado={avance.estado} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
