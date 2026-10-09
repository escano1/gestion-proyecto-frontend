"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAsignaciones, useEliminarAsignacion } from "@/features/personal/api";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { formatoFecha } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { Asignacion } from "@/types/api";
import { AsignacionForm } from "./asignacion-form";

/** Vigentes primero; luego por nombre del trabajador y la más reciente. */
const ordenar = (lista: Asignacion[]) =>
  [...lista].sort(
    (a, b) =>
      Number(b.vigente) - Number(a.vigente) ||
      a.trabajador.nombre.localeCompare(b.trabajador.nombre, "es") ||
      b.fechaInicio.localeCompare(a.fechaInicio),
  );

export function PestanaEquipo({ proyectoId }: { proyectoId: number }) {
  const rol = useSesion((s) => s.usuario?.rol);
  const consulta = useAsignaciones({ proyectoId });
  const eliminar = useEliminarAsignacion();
  const [edicion, setEdicion] = useState<{ asignacion?: Asignacion } | null>(null);
  const [porEliminar, setPorEliminar] = useState<Asignacion | null>(null);

  const editable = puedeEscribir(rol, "asignaciones");
  const vigentes = consulta.data?.filter((a) => a.vigente).length ?? 0;

  const confirmarEliminar = () => {
    if (!porEliminar) return;
    eliminar.mutate(porEliminar.id, {
      onSuccess: () => {
        toast.success("Asignación eliminada");
        setPorEliminar(null);
      },
      // 409 si el trabajador ya tiene horas registradas en el proyecto dentro del rango.
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
        descripcion={consulta.data ? `${vigentes} vigente${vigentes === 1 ? "" : "s"} de ${consulta.data.length} asignaciones` : undefined}
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
              <Th>Desde</Th>
              <Th>Hasta</Th>
              <Th>Estado</Th>
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
                <Td className="whitespace-nowrap">{formatoFecha(a.fechaInicio)}</Td>
                <Td className="whitespace-nowrap">{a.fechaFin ? formatoFecha(a.fechaFin) : "Indefinida"}</Td>
                <Td>{a.vigente ? <Badge tono="verde">Vigente</Badge> : <Badge>No vigente</Badge>}</Td>
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
              ¿Eliminar la asignación de <strong>{porEliminar.trabajador.nombre}</strong> (
              {formatoFecha(porEliminar.fechaInicio)} – {porEliminar.fechaFin ? formatoFecha(porEliminar.fechaFin) : "indefinida"}
              )? No es posible si ya tiene horas registradas en ese rango; en ese caso, edite la fecha de fin.
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
