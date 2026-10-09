"use client";

import { useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAvanceProyecto, useEliminarHito, useHitos } from "@/features/operacion/api";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { formatoAvance, formatoFecha } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { Hito } from "@/types/api";
import { BarraProgreso } from "./barra-progreso";
import { CurvaS } from "./curva-s";
import { HitoForm } from "./hito-form";
import { pesosCompletos, sumaPesos } from "./utilidades";

function TarjetaAvance({ proyectoId }: { proyectoId: number }) {
  const avance = useAvanceProyecto(proyectoId);

  if (avance.isPending) return <Spinner />;
  if (avance.isError) {
    return (
      <Card>
        <ErrorState mensaje={mensajeError(avance.error)} reintentar={() => avance.refetch()} />
      </Card>
    );
  }

  const { avanceReal, avancePlaneado, estado, curva } = avance.data;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader titulo="Avance del proyecto" acciones={<EstadoBadge dominio="avance" estado={estado} />} />
        <div className="space-y-5 p-4">
          <BarraProgreso valor={avanceReal} etiqueta="Avance real" conTexto />
          <BarraProgreso valor={avancePlaneado} etiqueta="Avance planeado a hoy" tono="naranja" conTexto />
          <p className="text-xs text-slate-500">
            Ponderado por el peso de cada hito. El planeado es lo que debería estar cumplido a la fecha según las fechas
            planeadas.
          </p>
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader titulo="Curva S" descripcion="Avance acumulado planeado vs real" />
        <div className="p-4">
          {curva.length === 0 ? (
            <EmptyState titulo="Sin datos para la curva" descripcion="Registre hitos con fechas y pesos para trazarla." />
          ) : (
            <CurvaS datos={curva} />
          )}
        </div>
      </Card>
    </div>
  );
}

export function PestanaAvance({ proyectoId }: { proyectoId: number }) {
  const rol = useSesion((s) => s.usuario?.rol);
  const hitos = useHitos(proyectoId);
  const eliminar = useEliminarHito(proyectoId);
  const [edicion, setEdicion] = useState<{ hito?: Hito } | null>(null);
  const [porEliminar, setPorEliminar] = useState<Hito | null>(null);

  const editable = puedeEscribir(rol, "operacionProyecto");
  const lista = hitos.data ?? [];
  const suma = sumaPesos(lista);
  const ordenSugerido = lista.reduce((max, h) => Math.max(max, h.orden), 0) + 1;

  const confirmarEliminar = () => {
    if (!porEliminar) return;
    eliminar.mutate(porEliminar.id, {
      onSuccess: () => toast.success("Hito eliminado"),
      onError: (e) => toast.error(mensajeError(e)),
      onSettled: () => setPorEliminar(null),
    });
  };

  return (
    <div className="space-y-6">
      <TarjetaAvance proyectoId={proyectoId} />

      <Card>
        <CardHeader
          titulo="Hitos"
          descripcion={lista.length > 0 ? `Suma de pesos: ${formatoAvance(suma)}` : undefined}
          acciones={
            editable && (
              <Button tamano="sm" onClick={() => setEdicion({})}>
                <Plus className="size-4" /> Nuevo hito
              </Button>
            )
          }
        />

        {lista.length > 0 && !pesosCompletos(suma) && (
          <div className="mx-4 my-3 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200" role="status">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Los pesos suman {formatoAvance(suma)} y deberían sumar 100 % para que el avance sea representativo.
              {suma < 100 ? ` Faltan ${formatoAvance(Math.round((100 - suma) * 100) / 100)}.` : " Reduzca algunos pesos."}
            </p>
          </div>
        )}

        {hitos.isPending ? (
          <Spinner />
        ) : hitos.isError ? (
          <ErrorState mensaje={mensajeError(hitos.error)} reintentar={() => hitos.refetch()} />
        ) : lista.length === 0 ? (
          <EmptyState
            titulo="Sin hitos"
            descripcion="Defina los hitos del proyecto con su peso (que sumen 100 %) para medir el avance."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th alinear="centro">#</Th>
                <Th>Hito</Th>
                <Th>Planeada</Th>
                <Th>Real</Th>
                <Th alinear="derecha">Peso</Th>
                <Th className="min-w-36">Avance</Th>
                <Th>Estado</Th>
                {editable && (
                  <Th alinear="derecha">
                    <span className="sr-only">Acciones</span>
                  </Th>
                )}
              </tr>
            </thead>
            <TBody>
              {lista.map((h) => (
                <Tr key={h.id}>
                  <Td alinear="centro" className="text-slate-500 tabular-nums">
                    {h.orden}
                  </Td>
                  <Td className="min-w-48">
                    <p className="font-medium text-slate-900">{h.nombre}</p>
                    {h.descripcion && <p className="text-xs text-slate-500">{h.descripcion}</p>}
                  </Td>
                  <Td className="whitespace-nowrap">{formatoFecha(h.fechaPlaneada)}</Td>
                  <Td className="whitespace-nowrap">{formatoFecha(h.fechaReal)}</Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoAvance(h.peso)}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <BarraProgreso
                        valor={h.porcentajeAvance}
                        etiqueta={`Avance de ${h.nombre}`}
                        tono={h.porcentajeAvance >= 100 ? "verde" : "marca"}
                        className="flex-1"
                      />
                      <span className="w-12 text-right text-xs text-slate-600 tabular-nums">
                        {formatoAvance(h.porcentajeAvance)}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <EstadoBadge dominio="hito" estado={h.estado} />
                  </Td>
                  {editable && (
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button
                          variante="fantasma"
                          tamano="sm"
                          onClick={() => setEdicion({ hito: h })}
                          aria-label={`Editar ${h.nombre}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variante="fantasma"
                          tamano="sm"
                          onClick={() => setPorEliminar(h)}
                          aria-label={`Eliminar ${h.nombre}`}
                        >
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {edicion && (
        <HitoForm
          proyectoId={proyectoId}
          hito={edicion.hito}
          pesoOtros={suma - (edicion.hito?.peso ?? 0)}
          ordenSugerido={ordenSugerido}
          onCerrar={() => setEdicion(null)}
        />
      )}

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="Eliminar hito"
        mensaje={
          <>
            ¿Eliminar el hito <strong>{porEliminar?.nombre}</strong>? El avance del proyecto se recalculará; ajuste
            los pesos restantes para que sumen 100 %.
          </>
        }
        textoConfirmar="Eliminar"
        peligroso
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </div>
  );
}
