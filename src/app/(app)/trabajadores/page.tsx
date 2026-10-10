"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEliminarTrabajador, useTrabajadores } from "@/features/personal/api";
import { TrabajadorForm } from "@/features/personal/trabajador-form";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { formatoPesos } from "@/lib/formato";
import { mensajeError } from "@/lib/errores";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { Input, Select } from "@/components/ui/form-controls";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { EstadoTrabajador, Trabajador } from "@/types/api";

export default function PaginaTrabajadores() {
  const rol = useSesion((s) => s.usuario?.rol);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoTrabajador | "">("ACTIVO");
  const q = useDeferredValue(busqueda.trim());
  const consulta = useTrabajadores({ q: q || undefined, estado: estado || undefined });
  const [edicion, setEdicion] = useState<{ abierto: boolean; trabajador?: Trabajador }>({ abierto: false });
  const [porEliminar, setPorEliminar] = useState<Trabajador | null>(null);
  const eliminar = useEliminarTrabajador();

  const editable = puedeEscribir(rol, "trabajadores");

  const confirmarEliminar = () => {
    if (!porEliminar) return;
    eliminar.mutate(porEliminar.id, {
      onSuccess: () => {
        toast.success("Trabajador eliminado");
        setPorEliminar(null);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  };

  return (
    <>
      <PageHeader
        titulo="Trabajadores"
        descripcion="Personal, condiciones salariales y vinculación"
        acciones={
          editable && (
            <Button onClick={() => setEdicion({ abierto: true })}>
              <Plus className="size-4" /> Nuevo trabajador
            </Button>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-slate-200 p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-slate-400" aria-hidden />
            <Input
              placeholder="Buscar por nombre o documento"
              className="pl-8"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar trabajador"
            />
          </div>
          <Select
            className="w-40"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoTrabajador | "")}
            aria-label="Filtrar por estado"
          >
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="">Todos</option>
          </Select>
        </div>

        {consulta.isPending ? (
          <Spinner />
        ) : consulta.isError ? (
          <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
        ) : consulta.data.length === 0 ? (
          <EmptyState titulo="No hay trabajadores" descripcion="Ajuste los filtros o registre un trabajador nuevo." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Documento</Th>
                <Th>Cargo</Th>
                <Th alinear="derecha">Salario</Th>
                <Th>Estado</Th>
                {editable && <Th className="w-20" />}
              </tr>
            </thead>
            <TBody>
              {consulta.data.map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <Link href={`/trabajadores/${t.id}`} className="font-medium text-marca-700 hover:underline">
                      {t.nombre}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {t.tipoDocumento} {t.numeroDocumento}
                  </Td>
                  <Td>{t.cargo}</Td>
                  <Td alinear="derecha" className="whitespace-nowrap">
                    {formatoPesos(t.salarioBase)}
                    {t.tipoSalario === "POR_HORA" && <span className="text-xs text-slate-500"> /h</span>}
                  </Td>
                  <Td>
                    <EstadoBadge dominio="trabajador" estado={t.estado} />
                  </Td>
                  {editable && (
                    <Td>
                      <Button
                        variante="fantasma"
                        tamano="sm"
                        onClick={() => setEdicion({ abierto: true, trabajador: t })}
                        aria-label={`Editar ${t.nombre}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variante="fantasma"
                        tamano="sm"
                        onClick={() => setPorEliminar(t)}
                        aria-label={`Eliminar ${t.nombre}`}
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

      <TrabajadorForm
        abierto={edicion.abierto}
        trabajador={edicion.trabajador}
        onCerrar={() => setEdicion({ abierto: false })}
      />

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="Eliminar trabajador"
        mensaje={
          <>
            ¿Eliminar a <strong>{porEliminar?.nombre}</strong>? Esta acción no se puede deshacer: también se
            eliminarán sus horas registradas, asignaciones y desprendibles de nómina.
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
