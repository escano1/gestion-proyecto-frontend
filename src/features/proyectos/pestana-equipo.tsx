"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAsignaciones, useEliminarAsignacion } from "@/features/personal/api";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { Asignacion } from "@/types/api";
import { AsignacionForm } from "./asignacion-form";

const ordenar = (lista: Asignacion[]) =>
  [...lista].sort((a, b) => a.trabajador.nombre.localeCompare(b.trabajador.nombre, "es"));

export function PestanaEquipo({ proyectoId }: { proyectoId: number }) {
  const rol = useSesion((s) => s.usuario?.rol);
  const consulta = useAsignaciones({ proyectoId });
  const eliminar = useEliminarAsignacion();
  const [edicion, setEdicion] = useState<{ asignacion?: Asignacion } | null>(null);
  const [porEliminar, setPorEliminar] = useState<Asignacion | null>(null);

  const editable = puedeEscribir(rol, "asignaciones");

  const confirmarEliminar = () => {
    if (!porEliminar) return;
    eliminar.mutate(porEliminar.id, {
      onSuccess: () => {
        toast.success("Asignación eliminada");
        setPorEliminar(null);
      },
      // 409 si el trabajador ya tiene horas registradas en el proyecto.
      onError: (e) => {
        toast.error(mensajeError(e));
        setPorEliminar(null);
      },
    });
  };

  return (
    <Card>
      <CardHeader
        titulo="Equipo del proyecto"
        descripcion={consulta.data ? `${consulta.data.length} trabajador${consulta.data.length === 1 ? "" : "es"} asignado${consulta.data.length === 1 ? "" : "s"}` : undefined}
        acciones={
          editable && (
            <Button tamano="sm" onClick={() => setEdicion({})}>
              <UserPlus className="size-4" /> Asignar trabajador
            </Button>
          )
        }
      />

      {consulta.isPending ? (
        <Spinner />
      ) : consulta.isError ? (
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EmptyState
          titulo="Sin trabajadores asignados"
          descripcion="Asigne trabajadores para que puedan registrar horas en este proyecto."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Trabajador</Th>
              <Th>Rol en el proyecto</Th>
              {editable && <Th className="w-20" />}
            </tr>
          </thead>
          <TBody>
            {ordenar(consulta.data).map((a) => (
              <Tr key={a.id}>
                <Td className="min-w-48">
                  <Link href={`/trabajadores/${a.trabajador.id}`} className="font-medium text-marca-700 hover:underline">
                    {a.trabajador.nombre}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {a.trabajador.cargo} · {a.trabajador.numeroDocumento}
                  </p>
                </Td>
                <Td>{a.rolEnProyecto ?? "—"}</Td>
                {editable && (
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button
                        variante="fantasma"
                        tamano="sm"
                        onClick={() => setEdicion({ asignacion: a })}
                        aria-label={`Editar asignación de ${a.trabajador.nombre}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variante="fantasma"
                        tamano="sm"
                        onClick={() => setPorEliminar(a)}
                        aria-label={`Eliminar asignación de ${a.trabajador.nombre}`}
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
        <AsignacionForm proyectoId={proyectoId} asignacion={edicion.asignacion} onCerrar={() => setEdicion(null)} />
      )}

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="Eliminar asignación"
        mensaje={
          porEliminar && (
            <>
              ¿Quitar a <strong>{porEliminar.trabajador.nombre}</strong> del proyecto? No es posible si ya tiene
              horas registradas en él.
            </>
          )
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
