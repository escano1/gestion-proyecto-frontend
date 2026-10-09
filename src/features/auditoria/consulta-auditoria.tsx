"use client";

import { Fragment, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useAuditoria, type FiltroAuditoria } from "@/features/catalogos/api";
import { mensajeError } from "@/lib/errores";
import { formatoFechaHora } from "@/lib/formato";
import { opciones } from "@/lib/etiquetas";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner, type Tono } from "@/components/ui/display";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { Pagination } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { AccionAuditoria } from "@/types/api";
import { DetalleCambios } from "./detalle-cambios";
import { ACCIONES_AUDITORIA, ENTIDADES_AUDITADAS } from "./etiquetas";

const LIMITE = 25;
const COLUMNAS = 6;

interface Filtros {
  entidad: string;
  accion: AccionAuditoria | "";
  desde: string;
  hasta: string;
}

const SIN_FILTROS: Filtros = { entidad: "", accion: "", desde: "", hasta: "" };

const ETIQUETAS_ACCION = Object.fromEntries(
  Object.entries(ACCIONES_AUDITORIA).map(([accion, [etiqueta]]) => [accion, etiqueta]),
) as Record<AccionAuditoria, string>;

/** Bitácora de auditoría con filtros y detalle de cambios (solo ADMIN). */
export function ConsultaAuditoria() {
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  const [pagina, setPagina] = useState(1);
  const [expandidos, setExpandidos] = useState<ReadonlySet<number>>(new Set());

  const consulta = useAuditoria({
    entidad: filtros.entidad || undefined,
    accion: filtros.accion || undefined,
    desde: filtros.desde || undefined,
    hasta: filtros.hasta || undefined,
    pagina,
    limite: LIMITE,
  } satisfies FiltroAuditoria);

  const cambiarFiltro = (cambio: Partial<Filtros>) => {
    setFiltros((f) => ({ ...f, ...cambio }));
    setPagina(1);
  };

  const alternar = (id: number) =>
    setExpandidos((actuales) => {
      const siguientes = new Set(actuales);
      if (!siguientes.delete(id)) siguientes.add(id);
      return siguientes;
    });

  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <>
      <PageHeader titulo="Auditoría" descripcion="Quién cambió qué y cuándo en las operaciones críticas" />

      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-3">
          <Field label="Entidad" className="w-full sm:w-52">
            {(id) => (
              <Select id={id} value={filtros.entidad} onChange={(e) => cambiarFiltro({ entidad: e.target.value })}>
                <option value="">Todas</option>
                {opciones(ENTIDADES_AUDITADAS).map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Acción" className="w-full sm:w-40">
            {(id) => (
              <Select
                id={id}
                value={filtros.accion}
                onChange={(e) => cambiarFiltro({ accion: e.target.value as AccionAuditoria | "" })}
              >
                <option value="">Todas</option>
                {opciones(ETIQUETAS_ACCION).map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Desde" className="w-full sm:w-40">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={filtros.desde}
                max={filtros.hasta || undefined}
                onChange={(e) => cambiarFiltro({ desde: e.target.value })}
              />
            )}
          </Field>
          <Field label="Hasta" className="w-full sm:w-40">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={filtros.hasta}
                min={filtros.desde || undefined}
                onChange={(e) => cambiarFiltro({ hasta: e.target.value })}
              />
            )}
          </Field>
          {hayFiltros && (
            <Button variante="fantasma" onClick={() => cambiarFiltro(SIN_FILTROS)}>
              <X className="size-4" aria-hidden /> Limpiar filtros
            </Button>
          )}
        </div>

        {consulta.isPending ? (
          <Spinner />
        ) : consulta.isError ? (
          <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
        ) : consulta.data.datos.length === 0 ? (
          <EmptyState titulo="Sin registros de auditoría" descripcion={hayFiltros ? "Ajuste los filtros." : undefined} />
        ) : (
          <>
            <div className={cn("transition-opacity", consulta.isPlaceholderData && "opacity-60")} aria-busy={consulta.isFetching}>
              <Table>
                <thead>
                  <tr>
                    <Th className="w-10">
                      <span className="sr-only">Detalle</span>
                    </Th>
                    <Th>Fecha</Th>
                    <Th>Usuario</Th>
                    <Th>Entidad</Th>
                    <Th>Acción</Th>
                    <Th>Descripción</Th>
                  </tr>
                </thead>
                <TBody>
                  {consulta.data.datos.map((r) => {
                    const abierto = expandidos.has(r.id);
                    const [etiquetaAccion, tono]: [string, Tono] = ACCIONES_AUDITORIA[r.accion] ?? [r.accion, "gris"];
                    const idDetalle = `auditoria-${r.id}`;
                    return (
                      <Fragment key={r.id}>
                        <Tr className={cn(abierto && "bg-slate-50")}>
                          <Td className="py-1.5">
                            <Button
                              variante="fantasma"
                              tamano="sm"
                              onClick={() => alternar(r.id)}
                              aria-expanded={abierto}
                              aria-controls={abierto ? idDetalle : undefined}
                              aria-label={`${abierto ? "Ocultar" : "Ver"} cambios del registro ${r.id}`}
                            >
                              <ChevronRight className={cn("size-4 transition-transform", abierto && "rotate-90")} />
                            </Button>
                          </Td>
                          <Td className="whitespace-nowrap">{formatoFechaHora(r.fecha)}</Td>
                          <Td className="whitespace-nowrap">
                            {r.usuarioEmail ?? (r.usuarioId ? `Usuario #${r.usuarioId}` : "Sistema")}
                          </Td>
                          <Td className="whitespace-nowrap">
                            {ENTIDADES_AUDITADAS[r.entidad] ?? r.entidad}{" "}
                            <span className="text-slate-500">#{r.entidadId}</span>
                          </Td>
                          <Td>
                            <Badge tono={tono}>{etiquetaAccion}</Badge>
                          </Td>
                          <Td className="min-w-56 text-slate-600">{r.descripcion ?? "—"}</Td>
                        </Tr>
                        {abierto && (
                          <tr id={idDetalle} className="bg-slate-50">
                            <td colSpan={COLUMNAS} className="px-3 pt-1 pb-4 sm:pl-12">
                              <DetalleCambios anteriores={r.datosAnteriores} nuevos={r.datosNuevos} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </TBody>
              </Table>
            </div>
            <Pagination
              pagina={consulta.data.pagina}
              limite={consulta.data.limite}
              total={consulta.data.total}
              onCambiar={setPagina}
            />
          </>
        )}
      </Card>
    </>
  );
}
