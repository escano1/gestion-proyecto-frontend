"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useEliminarHerramienta, useGuardarHerramienta, useHerramientas } from "@/features/operacion/api";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { ESTADOS } from "@/lib/etiquetas";
import { formatoFecha, formatoNumero } from "@/lib/formato";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Select } from "@/components/ui/form-controls";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { EstadoHerramienta, Herramienta } from "@/types/api";
import { HerramientaForm } from "./herramienta-form";

export function PestanaHerramientas({ proyectoId }: { proyectoId: number }) {
  const rol = useSesion((s) => s.usuario?.rol);
  const [estado, setEstado] = useState<EstadoHerramienta | "">("");
  const consulta = useHerramientas(proyectoId, estado || undefined);
  const guardar = useGuardarHerramienta(proyectoId);
  const eliminar = useEliminarHerramienta(proyectoId);
  const [edicion, setEdicion] = useState<{ herramienta?: Herramienta } | null>(null);
  const [porEliminar, setPorEliminar] = useState<Herramienta | null>(null);

  const editable = puedeEscribir(rol, "operacionProyecto");
  const vencidas = consulta.data?.filter((h) => h.vencida).length ?? 0;

  const marcarDevuelta = (h: Herramienta) => {
    // Sin fecha de devolución, el API registra hoy.
    guardar.mutate(
      { id: h.id, datos: { estado: "DEVUELTA" } },
      {
        onSuccess: () => toast.success(`${h.nombre}: devuelta`),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  };

  const confirmarEliminar = () => {
    if (!porEliminar) return;
    eliminar.mutate(porEliminar.id, {
      onSuccess: () => toast.success("Herramienta eliminada"),
      onError: (e) => toast.error(mensajeError(e)),
      onSettled: () => setPorEliminar(null),
    });
  };

  return (
    <Card>
      <CardHeader
        titulo="Herramientas y equipos"
        descripcion={vencidas > 0 ? `${vencidas} con devolución vencida` : "Préstamos de herramienta al personal de obra"}
        acciones={
          <>
            <Select
              className="w-40"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoHerramienta | "")}
              aria-label="Filtrar herramientas por estado"
            >
              <option value="">Todas</option>
              {(Object.keys(ESTADOS.herramienta) as EstadoHerramienta[]).map((e) => (
                <option key={e} value={e}>
                  {ESTADOS.herramienta[e][0]}
                </option>
              ))}
            </Select>
            {editable && (
              <Button tamano="sm" className="h-9" onClick={() => setEdicion({})}>
                <Plus className="size-4" /> Asignar herramienta
              </Button>
            )}
          </>
        }
      />

      {consulta.isPending ? (
        <Spinner />
      ) : consulta.isError ? (
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EmptyState titulo="Sin herramientas" descripcion={estado ? "No hay herramientas en este estado." : undefined} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Herramienta</Th>
              <Th alinear="derecha">Cant.</Th>
              <Th>Responsable</Th>
              <Th>Asignada</Th>
              <Th>Devolución prevista</Th>
              <Th>Devuelta</Th>
              <Th>Estado</Th>
              {editable && (
                <Th alinear="derecha">
                  <span className="sr-only">Acciones</span>
                </Th>
              )}
            </tr>
          </thead>
          <TBody>
            {consulta.data.map((h) => (
              <Tr key={h.id} className={cn(h.vencida && "bg-red-50/60 hover:bg-red-50")}>
                <Td className="min-w-44">
                  <p className="font-medium text-slate-900">{h.nombre}</p>
                  {h.codigo && <p className="text-xs text-slate-500">{h.codigo}</p>}
                  {h.observaciones && <p className="text-xs text-slate-500 italic">{h.observaciones}</p>}
                </Td>
                <Td alinear="derecha">{formatoNumero(h.cantidad)}</Td>
                <Td>{h.responsable?.nombre ?? <span className="text-slate-400">Sin responsable</span>}</Td>
                <Td className="whitespace-nowrap">{formatoFecha(h.fechaAsignacion)}</Td>
                <Td className="whitespace-nowrap">
                  {formatoFecha(h.fechaDevolucionPrevista)}
                  {h.vencida && (
                    <Badge tono="rojo" className="ml-2">
                      Vencida
                    </Badge>
                  )}
                </Td>
                <Td className="whitespace-nowrap">{formatoFecha(h.fechaDevolucion)}</Td>
                <Td>
                  <EstadoBadge dominio="herramienta" estado={h.estado} />
                </Td>
                {editable && (
                  <Td>
                    <div className="flex justify-end gap-1">
                      {h.estado === "ASIGNADA" && (
                        <Button
                          variante="secundario"
                          tamano="sm"
                          onClick={() => marcarDevuelta(h)}
                          disabled={guardar.isPending}
                          aria-label={`Marcar devuelta: ${h.nombre}`}
                        >
                          <Undo2 className="size-4" aria-hidden /> Devuelta
                        </Button>
                      )}
                      <Button
                        variante="fantasma"
                        tamano="sm"
                        onClick={() => setEdicion({ herramienta: h })}
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

      {edicion && (
        <HerramientaForm proyectoId={proyectoId} herramienta={edicion.herramienta} onCerrar={() => setEdicion(null)} />
      )}

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="Eliminar herramienta"
        mensaje={
          <>
            ¿Eliminar <strong>{porEliminar?.nombre}</strong> del proyecto? Si fue devuelta o extraviada, considere
            conservarla para el historial.
          </>
        }
        textoConfirmar="Eliminar"
        peligroso
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </Card>
  );
}
