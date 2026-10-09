"use client";

import { useState } from "react";
import Link from "next/link";
import { useReporteNominaPeriodos } from "@/features/reportes/api";
import { mensajeError } from "@/lib/errores";
import { formatoFecha, formatoNumero, formatoPesos, nombrePeriodo } from "@/lib/formato";
import { hoy } from "@/lib/fechas";
import { Badge, Card, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Field, Select } from "@/components/ui/form-controls";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import { BarraFiltros } from "./filtros";

const ANIOS_ATRAS = 5;

/** Liquidaciones de un año con sus totales. Solo para ADMIN y NOMINA (`habilitado`). */
export function NominaPeriodosTab({ habilitado }: { habilitado: boolean }) {
  const [anioActual] = useState(() => Number(hoy().slice(0, 4)));
  const [anio, setAnio] = useState(anioActual);
  const consulta = useReporteNominaPeriodos(anio, habilitado);
  const anios = Array.from({ length: ANIOS_ATRAS + 1 }, (_, i) => anioActual - i);

  return (
    <Card>
      <BarraFiltros>
        <Field label="Año" className="w-32">
          {(id) => (
            <Select id={id} value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </BarraFiltros>

      {consulta.isPending ? (
        <Spinner />
      ) : consulta.isError ? (
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      ) : consulta.data.filas.length === 0 ? (
        <EmptyState titulo={`Sin liquidaciones en ${anio}`} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Periodo</Th>
              <Th>Fechas</Th>
              <Th>Estado</Th>
              <Th alinear="derecha">Trabajadores</Th>
              <Th alinear="derecha">Devengado</Th>
              <Th alinear="derecha">Deducciones</Th>
              <Th alinear="derecha">Neto</Th>
            </tr>
          </thead>
          <TBody>
            {consulta.data.filas.map((l) => (
              <Tr key={l.id}>
                <Td className="whitespace-nowrap">
                  <Link href={`/nomina/${l.id}`} className="font-medium text-marca-700 hover:underline">
                    {nombrePeriodo(l)}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap">
                  {formatoFecha(l.fechaInicio)} – {formatoFecha(l.fechaFin)}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <EstadoBadge dominio="liquidacion" estado={l.estado} />
                    {l.requiereRecalculo && <Badge tono="amarillo">Requiere recálculo</Badge>}
                  </div>
                </Td>
                <Td alinear="derecha">{formatoNumero(l.numeroTrabajadores)}</Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(l.totalDevengado)}
                </Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(l.totalDeducciones)}
                </Td>
                <Td alinear="derecha" className="whitespace-nowrap font-medium text-slate-900">
                  {formatoPesos(l.totalNeto)}
                </Td>
              </Tr>
            ))}
          </TBody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
            <tr>
              <Td className="text-slate-900" colSpan={4}>
                Total {anio}
              </Td>
              <Td alinear="derecha" className="whitespace-nowrap">
                {formatoPesos(consulta.data.totales.devengado)}
              </Td>
              <Td alinear="derecha" className="whitespace-nowrap">
                {formatoPesos(consulta.data.totales.deducciones)}
              </Td>
              <Td alinear="derecha" className="whitespace-nowrap">
                {formatoPesos(consulta.data.totales.neto)}
              </Td>
            </tr>
          </tfoot>
        </Table>
      )}
    </Card>
  );
}
