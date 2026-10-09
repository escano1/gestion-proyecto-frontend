"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Lock,
  LockOpen,
  RefreshCw,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  descargarConsolidadoExcel,
  descargarConsolidadoPdf,
  useAccionLiquidacion,
  useEliminarLiquidacion,
  useLiquidacion,
} from "@/features/nomina/api";
import { rangoFechas } from "@/features/liquidacion/formato-nomina";
import { SinPermisoNomina } from "@/features/liquidacion/sin-permiso";
import { useDescarga } from "@/features/liquidacion/use-descarga";
import { useSesion } from "@/lib/auth-store";
import { esAdmin, puedeEscribir, puedeVerNomina } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { TIPOS_PERIODO } from "@/lib/etiquetas";
import { formatoFechaHora, formatoNumero, formatoPesos, nombrePeriodo } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Alertas, Badge, Card, CardHeader, EmptyState, ErrorState, PageHeader, Spinner, StatCard } from "@/components/ui/display";
import { EstadoBadge } from "@/components/ui/estado-badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { LiquidacionDetalle } from "@/types/api";

type Accion = "recalcular" | "cerrar" | "reabrir";
type Confirmacion = "cerrar" | "reabrir" | "eliminar";

const EXITO: Record<Accion, string> = {
  recalcular: "Liquidación recalculada",
  cerrar: "Liquidación cerrada",
  reabrir: "Liquidación reabierta",
};

export default function PaginaLiquidacion() {
  const rol = useSesion((s) => s.usuario?.rol);
  if (!puedeVerNomina(rol)) return <SinPermisoNomina />;
  return <DetalleLiquidacion />;
}

function DetalleLiquidacion() {
  const { id } = useParams<{ id: string }>();
  const liquidacionId = Number(id);
  const idValido = Number.isInteger(liquidacionId) && liquidacionId > 0;
  const router = useRouter();
  const rol = useSesion((s) => s.usuario?.rol);
  const consulta = useLiquidacion(idValido ? liquidacionId : undefined);
  const accion = useAccionLiquidacion();
  const eliminar = useEliminarLiquidacion();
  const { enCurso, descargar } = useDescarga<"excel" | "pdf">();
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  if (!idValido) return <ErrorState mensaje="Liquidación no encontrada" />;
  if (consulta.isPending) return <Spinner />;
  if (consulta.isError) return <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />;

  const l = consulta.data;
  const periodo = nombrePeriodo(l);
  const borrador = l.estado === "BORRADOR";
  const operable = puedeEscribir(rol, "nomina");
  const ocupado = accion.isPending || eliminar.isPending;
  const enProceso = (tipo: Accion) => accion.isPending && accion.variables?.accion === tipo;

  const ejecutar = (tipo: Accion) =>
    accion.mutate(
      { id: l.id, accion: tipo },
      {
        onSuccess: () => {
          toast.success(EXITO[tipo]);
          setConfirmacion(null);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );

  const confirmarEliminacion = () =>
    eliminar.mutate(l.id, {
      onSuccess: () => {
        toast.success("Liquidación eliminada");
        router.push("/nomina");
      },
      onError: (e) => toast.error(mensajeError(e)),
    });

  const alertas = l.nominas.flatMap((n) => n.alertas.map((a) => `${n.nombreTrabajador}: ${a}`));

  return (
    <>
      <Link href="/nomina" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> Nómina
      </Link>
      <PageHeader
        titulo={`Nómina · ${periodo}`}
        descripcion={`${TIPOS_PERIODO[l.tipoPeriodo]} · ${rangoFechas(l.fechaInicio, l.fechaFin)}`}
        acciones={
          <>
            <Button
              variante="secundario"
              onClick={() => descargar("excel", () => descargarConsolidadoExcel(l.id))}
              cargando={enCurso === "excel"}
              aria-label="Descargar consolidado en Excel"
            >
              {enCurso !== "excel" && <FileSpreadsheet className="size-4" />} Excel
            </Button>
            <Button
              variante="secundario"
              onClick={() => descargar("pdf", () => descargarConsolidadoPdf(l.id))}
              cargando={enCurso === "pdf"}
              aria-label="Descargar consolidado en PDF"
            >
              {enCurso !== "pdf" && <FileText className="size-4" />} PDF
            </Button>
            {borrador && operable && (
              <>
                <Button
                  variante="secundario"
                  onClick={() => ejecutar("recalcular")}
                  cargando={enProceso("recalcular")}
                  disabled={ocupado}
                >
                  {!enProceso("recalcular") && <RefreshCw className="size-4" />} Recalcular
                </Button>
                <Button
                  onClick={() => setConfirmacion("cerrar")}
                  disabled={ocupado || l.requiereRecalculo}
                  title={l.requiereRecalculo ? "Recalcule la liquidación antes de cerrarla" : undefined}
                >
                  <Lock className="size-4" /> Cerrar
                </Button>
                <Button variante="fantasma" onClick={() => setConfirmacion("eliminar")} disabled={ocupado}>
                  <Trash2 className="size-4 text-red-600" /> Eliminar
                </Button>
              </>
            )}
            {!borrador && esAdmin(rol) && (
              <Button variante="secundario" onClick={() => setConfirmacion("reabrir")} disabled={ocupado}>
                <LockOpen className="size-4" /> Reabrir
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-6">
        <div className="-mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <EstadoBadge dominio="liquidacion" estado={l.estado} />
          {l.requiereRecalculo && <Badge tono="amarillo">Requiere recálculo</Badge>}
          <span>Calculada: {formatoFechaHora(l.calculadaEn)}</span>
          {l.cerradaEn && <span>· Cerrada: {formatoFechaHora(l.cerradaEn)}</span>}
        </div>

        {borrador && l.requiereRecalculo && (
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-amber-50 p-3 ring-1 ring-amber-200" role="status">
            <AlertTriangle className="size-5 shrink-0 text-amber-600" aria-hidden />
            <p className="min-w-60 flex-1 text-sm text-amber-900">
              <strong>Requiere recálculo.</strong> Hubo cambios en horas, trabajadores o parámetros legales después del
              último cálculo: los valores mostrados pueden estar desactualizados y la liquidación no se puede cerrar
              hasta recalcularla.
            </p>
            {operable && (
              <Button tamano="sm" onClick={() => ejecutar("recalcular")} cargando={enProceso("recalcular")} disabled={ocupado}>
                Recalcular ahora
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard titulo="Trabajadores" valor={l.numeroTrabajadores} icono={<Users className="size-5" />} />
          <StatCard titulo="Total devengado" valor={formatoPesos(l.totalDevengado)} />
          <StatCard titulo="Total deducciones" valor={formatoPesos(l.totalDeducciones)} />
          <StatCard titulo="Neto a pagar" valor={formatoPesos(l.totalNeto)} icono={<Wallet className="size-5" />} />
        </div>

        <TablaNominas liquidacion={l} />

        <Alertas titulo="Alertas del cálculo" mensajes={alertas} />
      </div>

      <ConfirmDialog
        abierto={confirmacion === "cerrar"}
        titulo="Cerrar liquidación"
        mensaje={
          <>
            Al cerrar la liquidación de <strong>{periodo}</strong> quedará bloqueada la creación, edición y eliminación
            de horas entre {rangoFechas(l.fechaInicio, l.fechaFin)}, y la liquidación no podrá recalcularse ni
            eliminarse. Solo un administrador puede reabrirla.
          </>
        }
        textoConfirmar="Cerrar liquidación"
        cargando={enProceso("cerrar")}
        onConfirmar={() => ejecutar("cerrar")}
        onCancelar={() => setConfirmacion(null)}
      />
      <ConfirmDialog
        abierto={confirmacion === "reabrir"}
        titulo="Reabrir liquidación"
        mensaje={
          <>
            La liquidación de <strong>{periodo}</strong> volverá a borrador y se habilitará de nuevo la edición de horas
            del periodo. Si se recalcula, los comprobantes ya entregados podrían cambiar.
          </>
        }
        textoConfirmar="Reabrir"
        cargando={enProceso("reabrir")}
        onConfirmar={() => ejecutar("reabrir")}
        onCancelar={() => setConfirmacion(null)}
      />
      <ConfirmDialog
        abierto={confirmacion === "eliminar"}
        titulo="Eliminar liquidación"
        mensaje={
          <>
            Se eliminará la liquidación en borrador de <strong>{periodo}</strong> con sus {l.numeroTrabajadores}{" "}
            nómina{l.numeroTrabajadores === 1 ? "" : "s"}. Esta acción no se puede deshacer.
          </>
        }
        textoConfirmar="Eliminar"
        peligroso
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setConfirmacion(null)}
      />
    </>
  );
}

function TablaNominas({ liquidacion }: { liquidacion: LiquidacionDetalle }) {
  const { nominas } = liquidacion;
  return (
    <Card>
      <CardHeader titulo="Trabajadores liquidados" descripcion="Seleccione un trabajador para ver su comprobante de pago" />
      {nominas.length === 0 ? (
        <EmptyState
          titulo="Sin trabajadores en el periodo"
          descripcion="No hay trabajadores con vínculo en el periodo (los de salario por hora requieren horas registradas)."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Trabajador</Th>
              <Th>Documento</Th>
              <Th alinear="derecha">Días</Th>
              <Th alinear="derecha">IBC</Th>
              <Th alinear="derecha">Devengado</Th>
              <Th alinear="derecha">Deducciones</Th>
              <Th alinear="derecha">Neto</Th>
              <Th className="w-10">
                <span className="sr-only">Alertas</span>
              </Th>
            </tr>
          </thead>
          <TBody>
            {nominas.map((n) => (
              <Tr key={n.id}>
                <Td>
                  <Link href={`/nomina/desprendibles/${n.id}`} className="font-medium text-marca-700 hover:underline">
                    {n.nombreTrabajador}
                  </Link>
                  <span className="block text-xs text-slate-500">{n.cargo}</span>
                </Td>
                <Td className="whitespace-nowrap">{n.numeroDocumento}</Td>
                <Td alinear="derecha">{formatoNumero(n.diasLaborados)}</Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(n.ibc)}
                </Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(n.totalDevengado)}
                </Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(n.totalDeducciones)}
                </Td>
                <Td alinear="derecha" className="font-medium whitespace-nowrap text-slate-900">
                  {formatoPesos(n.netoPagar)}
                </Td>
                <Td alinear="centro">
                  {n.alertas.length > 0 && (
                    <span className="inline-flex cursor-help text-amber-600" title={n.alertas.join("\n")}>
                      <AlertTriangle className="size-4" aria-hidden />
                      <span className="sr-only">Alertas: {n.alertas.join(". ")}</span>
                    </span>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <Th scope="row" colSpan={4} className="normal-case">
                Totales
              </Th>
              <Td alinear="derecha" className="font-semibold whitespace-nowrap">
                {formatoPesos(liquidacion.totalDevengado)}
              </Td>
              <Td alinear="derecha" className="font-semibold whitespace-nowrap">
                {formatoPesos(liquidacion.totalDeducciones)}
              </Td>
              <Td alinear="derecha" className="font-semibold whitespace-nowrap text-slate-900">
                {formatoPesos(liquidacion.totalNeto)}
              </Td>
              <Td />
            </tr>
          </tfoot>
        </Table>
      )}
    </Card>
  );
}
