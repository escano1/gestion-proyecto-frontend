"use client";

import { useState } from "react";
import { ChevronsRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEliminarMaterial, useGuardarMaterial, useMateriales } from "@/features/operacion/api";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { ESTADOS } from "@/lib/etiquetas";
import { hoy } from "@/lib/fechas";
import { formatoFecha, formatoNumero } from "@/lib/formato";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Select } from "@/components/ui/form-controls";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { EstadoMaterial, Material } from "@/types/api";
import { MaterialForm } from "./material-form";
import { materialVencido, siguienteEstadoMaterial } from "./utilidades";

const ACCION_SIGUIENTE: Record<EstadoMaterial, string> = {
  PENDIENTE: "Marcar solicitado",
  SOLICITADO: "Marcar entregado",
  ENTREGADO: "Marcar instalado",
  INSTALADO: "",
};

export function PestanaMateriales({ proyectoId }: { proyectoId: number }) {
  const rol = useSesion((s) => s.usuario?.rol);
  const [estado, setEstado] = useState<EstadoMaterial | "">("");
  const consulta = useMateriales(proyectoId, estado || undefined);
  const guardar = useGuardarMaterial(proyectoId);
  const eliminar = useEliminarMaterial(proyectoId);
  const [edicion, setEdicion] = useState<{ material?: Material } | null>(null);
  const [porEliminar, setPorEliminar] = useState<Material | null>(null);

  const editable = puedeEscribir(rol, "operacionProyecto");
  const fechaHoy = hoy();
  const vencidos = consulta.data?.filter((m) => materialVencido(m, fechaHoy)).length ?? 0;

  const avanzar = (m: Material) => {
    const siguiente = siguienteEstadoMaterial(m.estado);
    if (!siguiente) return;
    // Entrega rápida = entrega completa; las entregas parciales se registran editando el material.
    const entregaCompleta = siguiente === "ENTREGADO" && m.cantidadEntregada === 0;
    guardar.mutate(
      {
        id: m.id,
        datos: { estado: siguiente, ...(entregaCompleta && { cantidadEntregada: m.cantidadSolicitada }) },
      },
      {
        onSuccess: () => toast.success(`${m.nombre}: ${ESTADOS.material[siguiente][0].toLowerCase()}`),
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  };

  const confirmarEliminar = () => {
    if (!porEliminar) return;
    eliminar.mutate(porEliminar.id, {
      onSuccess: () => toast.success("Material eliminado"),
      onError: (e) => toast.error(mensajeError(e)),
      onSettled: () => setPorEliminar(null),
    });
  };

  return (
    <Card>
      <CardHeader
        titulo="Materiales"
        descripcion={vencidos > 0 ? `${vencidos} con fecha requerida vencida` : "Solicitudes y entregas de material"}
        acciones={
          <>
            <Select
              className="w-40"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoMaterial | "")}
              aria-label="Filtrar materiales por estado"
            >
              <option value="">Todos</option>
              {(Object.keys(ESTADOS.material) as EstadoMaterial[]).map((e) => (
                <option key={e} value={e}>
                  {ESTADOS.material[e][0]}
                </option>
              ))}
            </Select>
            {editable && (
              <Button tamano="sm" className="h-9" onClick={() => setEdicion({})}>
                <Plus className="size-4" /> Nuevo material
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
        <EmptyState titulo="Sin materiales" descripcion={estado ? "No hay materiales en este estado." : undefined} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Material</Th>
              <Th alinear="derecha">Entregado / solicitado</Th>
              <Th>Requerido</Th>
              <Th>Solicitud</Th>
              <Th>Entrega</Th>
              <Th>Estado</Th>
              {editable && (
                <Th alinear="derecha">
                  <span className="sr-only">Acciones</span>
                </Th>
              )}
            </tr>
          </thead>
          <TBody>
            {consulta.data.map((m) => {
              const vencido = materialVencido(m, fechaHoy);
              const siguiente = siguienteEstadoMaterial(m.estado);
              return (
                <Tr key={m.id} className={cn(vencido && "bg-red-50/60 hover:bg-red-50")}>
                  <Td className="min-w-48">
                    <p className="font-medium text-slate-900">{m.nombre}</p>
                    {m.descripcion && <p className="text-xs text-slate-500">{m.descripcion}</p>}
                    {m.observaciones && <p className="text-xs text-slate-500 italic">{m.observaciones}</p>}
                  </Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoNumero(m.cantidadEntregada)} / {formatoNumero(m.cantidadSolicitada)}{" "}
                    <span className="text-xs text-slate-500">{m.unidadMedida}</span>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatoFecha(m.fechaRequerida)}
                    {vencido && (
                      <Badge tono="rojo" className="ml-2">
                        Vencido
                      </Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {formatoFecha(m.fechaSolicitud)}
                    <p className="text-xs text-slate-500">{m.solicitadoPor.nombre}</p>
                  </Td>
                  <Td className="whitespace-nowrap">{formatoFecha(m.fechaEntrega)}</Td>
                  <Td>
                    <EstadoBadge dominio="material" estado={m.estado} />
                  </Td>
                  {editable && (
                    <Td>
                      <div className="flex justify-end gap-1">
                        {siguiente && (
                          <Button
                            variante="secundario"
                            tamano="sm"
                            onClick={() => avanzar(m)}
                            disabled={guardar.isPending}
                            aria-label={`${ACCION_SIGUIENTE[m.estado]}: ${m.nombre}`}
                            title={ACCION_SIGUIENTE[m.estado]}
                          >
                            <ChevronsRight className="size-4" aria-hidden /> {ESTADOS.material[siguiente][0]}
                          </Button>
                        )}
                        <Button
                          variante="fantasma"
                          tamano="sm"
                          onClick={() => setEdicion({ material: m })}
                          aria-label={`Editar ${m.nombre}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variante="fantasma"
                          tamano="sm"
                          onClick={() => setPorEliminar(m)}
                          aria-label={`Eliminar ${m.nombre}`}
                        >
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      </div>
                    </Td>
                  )}
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}

      {edicion && <MaterialForm proyectoId={proyectoId} material={edicion.material} onCerrar={() => setEdicion(null)} />}

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="Eliminar material"
        mensaje={
          <>
            ¿Eliminar <strong>{porEliminar?.nombre}</strong> del proyecto? Esta acción no se puede deshacer.
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
