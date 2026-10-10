"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { useLiquidaciones } from "@/features/nomina/api";
import { NuevaLiquidacionModal } from "@/features/liquidacion/nueva-liquidacion-modal";
import { SinPermisoNomina } from "@/features/liquidacion/sin-permiso";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir, puedeVerNomina } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { hoy } from "@/lib/fechas";
import { formatoPesos, nombrePeriodo } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Select } from "@/components/ui/form-controls";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";

const ANIOS_VISIBLES = 6;

export default function PaginaNomina() {
  const rol = useSesion((s) => s.usuario?.rol);
  if (!puedeVerNomina(rol)) return <SinPermisoNomina />;
  return <ListadoLiquidaciones puedeCrear={puedeEscribir(rol, "nomina")} />;
}

function ListadoLiquidaciones({ puedeCrear }: { puedeCrear: boolean }) {
  const anioActual = Number(hoy().slice(0, 4));
  const [anio, setAnio] = useState<number | "">(anioActual);
  const [creando, setCreando] = useState(false);
  const consulta = useLiquidaciones(anio === "" ? undefined : anio);
  const anios = Array.from({ length: ANIOS_VISIBLES }, (_, i) => anioActual - i);

  const totales = consulta.data?.reduce(
    (t, l) => ({
      devengado: t.devengado + l.totalDevengado,
      deducciones: t.deducciones + l.totalDeducciones,
      neto: t.neto + l.totalNeto,
    }),
    { devengado: 0, deducciones: 0, neto: 0 },
  );

  return (
    <>
      <PageHeader
        titulo="Nómina"
        descripcion="Liquidaciones semanales (lunes a domingo)"
        acciones={
          puedeCrear && (
            <Button onClick={() => setCreando(true)}>
              <Plus className="size-4" /> Nueva liquidación
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
          <Select
            className="w-44"
            value={anio}
            onChange={(e) => setAnio(e.target.value === "" ? "" : Number(e.target.value))}
            aria-label="Filtrar por año"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
            <option value="">Todos los años</option>
          </Select>
        </div>

        {consulta.isPending ? (
          <Spinner />
        ) : consulta.isError ? (
          <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
        ) : consulta.data.length === 0 ? (
          <EmptyState
            titulo="No hay liquidaciones"
            descripcion={anio === "" ? "Aún no se ha liquidado ningún periodo." : `No hay liquidaciones en ${anio}.`}
            accion={
              puedeCrear && (
                <Button variante="secundario" onClick={() => setCreando(true)}>
                  <Plus className="size-4" /> Nueva liquidación
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Periodo</Th>
                <Th>Estado</Th>
                <Th alinear="derecha">Trabajadores</Th>
                <Th alinear="derecha">Devengado</Th>
                <Th alinear="derecha">Deducciones</Th>
                <Th alinear="derecha">Neto</Th>
              </tr>
            </thead>
            <TBody>
              {consulta.data.map((l) => (
                <Tr key={l.id}>
                  <Td className="whitespace-nowrap">
                    <Link href={`/nomina/${l.id}`} className="font-medium text-marca-700 hover:underline">
                      {nombrePeriodo(l)}
                    </Link>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <EstadoBadge dominio="liquidacion" estado={l.estado} />
                      {l.requiereRecalculo && (
                        <Badge tono="amarillo">
                          <RefreshCw className="mr-1 size-3" aria-hidden /> Requiere recálculo
                        </Badge>
                      )}
                    </div>
                  </Td>
                  <Td alinear="derecha">{l.numeroTrabajadores}</Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(l.totalDevengado)}
                  </Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(l.totalDeducciones)}
                  </Td>
                  <Td alinear="derecha" className="font-medium whitespace-nowrap text-slate-900">
                    {formatoPesos(l.totalNeto)}
                  </Td>
                </Tr>
              ))}
            </TBody>
            {totales && consulta.data.length > 1 && (
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <Th scope="row" colSpan={4} className="normal-case">
                    Total {anio === "" ? "general" : anio}
                  </Th>
                  <Td alinear="derecha" className="font-semibold whitespace-nowrap">
                    {formatoPesos(totales.devengado)}
                  </Td>
                  <Td alinear="derecha" className="font-semibold whitespace-nowrap">
                    {formatoPesos(totales.deducciones)}
                  </Td>
                  <Td alinear="derecha" className="font-semibold whitespace-nowrap text-slate-900">
                    {formatoPesos(totales.neto)}
                  </Td>
                </tr>
              </tfoot>
            )}
          </Table>
        )}
      </Card>

      {puedeCrear && <NuevaLiquidacionModal abierto={creando} onCerrar={() => setCreando(false)} />}
    </>
  );
}
