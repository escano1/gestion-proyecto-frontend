"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEliminarRegistroHoras, useRegistrosHoras } from "@/features/horas/api";
import { useProyectos, useTrabajadores } from "@/features/personal/api";
import { EditarRegistroModal } from "@/features/registro-horas/editar-registro-modal";
import { EnlaceBoton } from "@/features/registro-horas/enlace-boton";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { hoy, sumarDias } from "@/lib/fechas";
import { formatoFecha, formatoFechaHora, formatoHoras, formatoNumero } from "@/lib/formato";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Alertas, Card, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import { Pagination } from "@/components/ui/tabs";
import type { RegistroHoras } from "@/types/api";

const LIMITE = 25;

interface Filtros {
  desde: string;
  hasta: string;
  trabajadorId: string;
  proyectoId: string;
}

const filtrosIniciales = (): Filtros => ({ desde: sumarDias(hoy(), -30), hasta: hoy(), trabajadorId: "", proyectoId: "" });

export default function PaginaHistorialHoras() {
  const rol = useSesion((s) => s.usuario?.rol);
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<RegistroHoras | null>(null);
  const [eliminando, setEliminando] = useState<RegistroHoras | null>(null);
  const [alertas, setAlertas] = useState<string[]>([]);

  const consulta = useRegistrosHoras({
    desde: filtros.desde || undefined,
    hasta: filtros.hasta || undefined,
    trabajadorId: Number(filtros.trabajadorId) || undefined,
    proyectoId: Number(filtros.proyectoId) || undefined,
    pagina,
    limite: LIMITE,
  });
  const trabajadores = useTrabajadores();
  const proyectos = useProyectos();
  const eliminar = useEliminarRegistroHoras();
  const editable = puedeEscribir(rol, "horas");

  const cambiarFiltro = (campo: keyof Filtros, valor: string) => {
    setFiltros((previos) => ({ ...previos, [campo]: valor }));
    setPagina(1);
  };

  const confirmarEliminacion = () => {
    if (!eliminando) return;
    const ultimoDeLaPagina = consulta.data?.datos.length === 1 && pagina > 1;
    eliminar.mutate(eliminando.id, {
      onSuccess: () => {
        toast.success("Registro eliminado");
        setEliminando(null);
        if (ultimoDeLaPagina) setPagina((p) => p - 1);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  };

  return (
    <>
      <PageHeader
        titulo="Historial de horas"
        descripcion="Consulta, corrección y eliminación de registros"
        acciones={
          <EnlaceBoton href="/registro-horas">
            <CalendarDays className="size-4" /> Captura semanal
          </EnlaceBoton>
        }
      />

      <div className="space-y-4">
        <Alertas titulo="Alertas del último cambio (no bloquean)" mensajes={alertas} />

        <Card>
          <div className="grid grid-cols-1 gap-3 border-b border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
            <Field label="Desde">
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={filtros.desde}
                  max={filtros.hasta || undefined}
                  onChange={(e) => cambiarFiltro("desde", e.target.value)}
                />
              )}
            </Field>
            <Field label="Hasta">
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={filtros.hasta}
                  min={filtros.desde || undefined}
                  onChange={(e) => cambiarFiltro("hasta", e.target.value)}
                />
              )}
            </Field>
            <Field label="Trabajador">
              {(id) => (
                <Select id={id} value={filtros.trabajadorId} onChange={(e) => cambiarFiltro("trabajadorId", e.target.value)}>
                  <option value="">Todos</option>
                  {trabajadores.data?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Proyecto">
              {(id) => (
                <Select id={id} value={filtros.proyectoId} onChange={(e) => cambiarFiltro("proyectoId", e.target.value)}>
                  <option value="">Todos</option>
                  {proyectos.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} · {p.nombre}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Button
              variante="fantasma"
              onClick={() => {
                setFiltros({ desde: "", hasta: "", trabajadorId: "", proyectoId: "" });
                setPagina(1);
              }}
            >
              Quitar filtros
            </Button>
          </div>

          {consulta.isPending ? (
            <Spinner />
          ) : consulta.isError ? (
            <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
          ) : consulta.data.datos.length === 0 ? (
            <EmptyState titulo="No hay registros de horas" descripcion="Ajuste los filtros o registre horas en la captura semanal." />
          ) : (
            <div className={cn("transition-opacity", consulta.isPlaceholderData && "opacity-60")} aria-busy={consulta.isFetching}>
              <Table>
                <thead>
                  <tr>
                    <Th>Fecha</Th>
                    <Th>Trabajador</Th>
                    <Th>Proyecto</Th>
                    <Th>Detalle</Th>
                    <Th alinear="derecha">Total</Th>
                    <Th>Registrado por</Th>
                    {editable && (
                      <Th className="w-20">
                        <span className="sr-only">Acciones</span>
                      </Th>
                    )}
                  </tr>
                </thead>
                <TBody>
                  {consulta.data.datos.map((r) => (
                    <Tr key={r.id}>
                      <Td className="whitespace-nowrap">{formatoFecha(r.fecha)}</Td>
                      <Td>
                        <Link href={`/trabajadores/${r.trabajador.id}`} className="font-medium text-marca-700 hover:underline">
                          {r.trabajador.nombre}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap" title={r.proyecto.nombre}>
                        {r.proyecto.codigo}
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {r.detalles.map((d) => (
                            <span
                              key={d.tipoHoraId}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-xs whitespace-nowrap text-slate-700"
                              title={d.nombre}
                            >
                              {d.codigo} {formatoNumero(d.horas)}
                            </span>
                          ))}
                        </div>
                        {r.observacion && (
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500" title={r.observacion}>
                            {r.observacion}
                          </p>
                        )}
                      </Td>
                      <Td alinear="derecha" className="whitespace-nowrap">
                        {formatoHoras(r.totalHoras)}
                      </Td>
                      <Td className="text-xs whitespace-nowrap">
                        <span className="text-slate-700">{r.creadoPor.nombre}</span>
                        <span className="block text-slate-500">{formatoFechaHora(r.creadoEn)}</span>
                        {r.actualizadoPor && (
                          <span className="block text-slate-500">
                            Editado por {r.actualizadoPor.nombre} · {formatoFechaHora(r.actualizadoEn)}
                          </span>
                        )}
                      </Td>
                      {editable && (
                        <Td className="whitespace-nowrap">
                          <Button
                            variante="fantasma"
                            tamano="sm"
                            onClick={() => setEditando(r)}
                            aria-label={`Editar registro de ${r.trabajador.nombre} del ${formatoFecha(r.fecha)}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variante="fantasma"
                            tamano="sm"
                            onClick={() => setEliminando(r)}
                            aria-label={`Eliminar registro de ${r.trabajador.nombre} del ${formatoFecha(r.fecha)}`}
                          >
                            <Trash2 className="size-4 text-red-600" />
                          </Button>
                        </Td>
                      )}
                    </Tr>
                  ))}
                </TBody>
              </Table>
              <Pagination pagina={pagina} limite={LIMITE} total={consulta.data.total} onCambiar={setPagina} />
            </div>
          )}
        </Card>
      </div>

      <EditarRegistroModal
        key={editando?.id ?? "cerrado"}
        registro={editando}
        onCerrar={() => setEditando(null)}
        onGuardado={(nuevasAlertas) => {
          setAlertas(nuevasAlertas);
          setEditando(null);
        }}
      />

      <ConfirmDialog
        abierto={eliminando !== null}
        titulo="Eliminar registro de horas"
        mensaje={
          eliminando && (
            <>
              Se eliminará el registro de <strong>{eliminando.trabajador.nombre}</strong> del{" "}
              {formatoFecha(eliminando.fecha)} en {eliminando.proyecto.codigo} ({formatoHoras(eliminando.totalHoras)}).
              No es posible si el periodo ya fue liquidado y cerrado.
            </>
          )
        }
        textoConfirmar="Eliminar"
        peligroso
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setEliminando(null)}
      />
    </>
  );
}
