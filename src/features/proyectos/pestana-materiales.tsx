"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEliminarMaterial, useMateriales } from "@/features/operacion/api";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { formatoNumero, formatoPesos } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { Material } from "@/types/api";
import { MaterialForm } from "./material-form";

export function PestanaMateriales({ proyectoId }: { proyectoId: number }) {
  const rol = useSesion((s) => s.usuario?.rol);
  const consulta = useMateriales(proyectoId);
  const eliminar = useEliminarMaterial(proyectoId);
  const [edicion, setEdicion] = useState<{ material?: Material } | null>(null);
  const [porEliminar, setPorEliminar] = useState<Material | null>(null);

  const editable = puedeEscribir(rol, "operacionProyecto");
  const total = consulta.data?.reduce((suma, m) => suma + m.costo, 0) ?? 0;

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
        descripcion={consulta.data?.length ? `Costo total: ${formatoPesos(total)}` : "Cantidad y precio de cada material"}
        acciones={
          editable && (
            <Button tamano="sm" className="h-9" onClick={() => setEdicion({})}>
              <Plus className="size-4" /> Nuevo material
            </Button>
          )
        }
      />

      {consulta.isPending ? (
        <Spinner />
      ) : consulta.isError ? (
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EmptyState titulo="Sin materiales" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Material</Th>
              <Th alinear="derecha">Cantidad</Th>
              <Th alinear="derecha">Precio unitario</Th>
              <Th alinear="derecha">Costo</Th>
              {editable && (
                <Th alinear="derecha">
                  <span className="sr-only">Acciones</span>
                </Th>
              )}
            </tr>
          </thead>
          <TBody>
            {consulta.data.map((m) => (
              <Tr key={m.id}>
                <Td className="min-w-48 font-medium text-slate-900">{m.nombre}</Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoNumero(m.cantidadSolicitada)} <span className="text-xs text-slate-500">{m.unidadMedida}</span>
                </Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(m.precioUnitario)}
                </Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(m.costo)}
                </Td>
                {editable && (
                  <Td>
                    <div className="flex justify-end gap-1">
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
            ))}
            <tr className="bg-slate-50 font-semibold">
              <Td>Total</Td>
              <Td />
              <Td />
              <Td alinear="derecha" className="whitespace-nowrap">
                {formatoPesos(total)}
              </Td>
              {editable && <Td />}
            </tr>
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
