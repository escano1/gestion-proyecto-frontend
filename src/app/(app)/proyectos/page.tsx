"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEliminarProyecto, useProyectos } from "@/features/personal/api";
import { ProyectoForm } from "@/features/proyectos/proyecto-form";
import { filtrarProyectos } from "@/features/proyectos/utilidades";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { formatoFecha, formatoPesos } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Input, Select } from "@/components/ui/form-controls";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { EstadoProyecto, Proyecto } from "@/types/api";

export default function PaginaProyectos() {
  const router = useRouter();
  const rol = useSesion((s) => s.usuario?.rol);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoProyecto | "">("ACTIVO");
  const termino = useDeferredValue(busqueda);
  const consulta = useProyectos({ estado: estado || undefined });
  const [edicion, setEdicion] = useState<{ proyecto?: Proyecto } | null>(null);
  const [porEliminar, setPorEliminar] = useState<Proyecto | null>(null);
  const eliminar = useEliminarProyecto();

  const editable = puedeEscribir(rol, "proyectos");
  const proyectos = consulta.data ? filtrarProyectos(consulta.data, termino) : [];

  const confirmarEliminar = () => {
    if (!porEliminar) return;
    eliminar.mutate(porEliminar.id, {
      onSuccess: () => {
        toast.success("Proyecto eliminado");
        setPorEliminar(null);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  };

  return (
    <>
      <PageHeader
        titulo="Proyectos"
        descripcion="Obras y contratos de ingeniería eléctrica"
        acciones={
          editable && (
            <Button onClick={() => setEdicion({})}>
              <Plus className="size-4" /> Nuevo proyecto
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-400" aria-hidden />
            <Input
              type="search"
              placeholder="Buscar por código, nombre o cliente"
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar proyecto"
            />
          </div>
          <Select
            className="w-40"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoProyecto | "")}
            aria-label="Filtrar por estado"
          >
            <option value="ACTIVO">Activos</option>
            <option value="SUSPENDIDO">Suspendidos</option>
            <option value="FINALIZADO">Finalizados</option>
            <option value="">Todos</option>
          </Select>
        </div>

        {consulta.isPending ? (
          <Spinner />
        ) : consulta.isError ? (
          <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
        ) : consulta.data.length === 0 ? (
          <EmptyState
            titulo="No hay proyectos"
            descripcion={editable ? "Cambie el filtro de estado o registre un proyecto nuevo." : "Cambie el filtro de estado."}
          />
        ) : proyectos.length === 0 ? (
          <EmptyState titulo="Sin coincidencias" descripcion={`Ningún proyecto coincide con “${busqueda.trim()}”.`} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Nombre</Th>
                <Th>Cliente</Th>
                <Th>Ubicación</Th>
                <Th>Inicio</Th>
                <Th>Fin planeado</Th>
                <Th>Estado</Th>
                <Th alinear="derecha">Presupuesto</Th>
                {editable && <Th className="w-20" />}
              </tr>
            </thead>
            <TBody>
              {proyectos.map((p) => (
                <Tr key={p.id}>
                  <Td className="whitespace-nowrap">{p.codigo}</Td>
                  <Td className="min-w-48">
                    <Link href={`/proyectos/${p.id}`} className="font-medium text-marca-700 hover:underline">
                      {p.nombre}
                    </Link>
                  </Td>
                  <Td>{p.cliente}</Td>
                  <Td>{p.ubicacion}</Td>
                  <Td className="whitespace-nowrap">{formatoFecha(p.fechaInicio)}</Td>
                  <Td className="whitespace-nowrap">{formatoFecha(p.fechaFinPlaneada)}</Td>
                  <Td>
                    <EstadoBadge dominio="proyecto" estado={p.estado} />
                  </Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(p.presupuesto)}
                  </Td>
                  {editable && (
                    <Td>
                      <Button
                        variante="fantasma"
                        tamano="sm"
                        onClick={() => setEdicion({ proyecto: p })}
                        aria-label={`Editar ${p.codigo}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variante="fantasma"
                        tamano="sm"
                        onClick={() => setPorEliminar(p)}
                        aria-label={`Eliminar ${p.codigo}`}
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </Td>
                  )}
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {edicion && (
        <ProyectoForm
          proyecto={edicion.proyecto}
          onCerrar={() => setEdicion(null)}
          onGuardado={(guardado) => {
            if (!edicion.proyecto) router.push(`/proyectos/${guardado.id}`);
          }}
        />
      )}

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="Eliminar proyecto"
        mensaje={
          <>
            ¿Eliminar <strong>{porEliminar?.codigo} · {porEliminar?.nombre}</strong>? Esta acción no se puede
            deshacer: también se eliminarán sus horas registradas, asignaciones y materiales.
          </>
        }
        textoConfirmar="Eliminar"
        peligroso
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </>
  );
}
