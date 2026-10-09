"use client";

import { useState } from "react";
import { Download, ExternalLink, File, FileImage, FileSpreadsheet, FileText, Paperclip, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  rutaAdjunto,
  useBitacora,
  useEliminarAdjunto,
  useEliminarEntradaBitacora,
} from "@/features/operacion/api";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { abrirArchivo, descargarArchivo } from "@/lib/descargas";
import { formatoFecha, formatoFechaHora, formatoTamano } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState, ErrorState, Spinner } from "@/components/ui/display";
import { Input } from "@/components/ui/form-controls";
import { ConfirmDialog } from "@/components/ui/modal";
import type { AdjuntoBitacora, EntradaBitacora } from "@/types/api";
import { AdjuntosForm } from "./adjuntos-form";
import { EntradaBitacoraForm } from "./entrada-bitacora-form";
import { MAX_ADJUNTOS_POR_ENTRADA, puedeEliminarEntrada, seAbreEnNavegador } from "./utilidades";

type PorEliminar =
  | { tipo: "entrada"; entrada: EntradaBitacora }
  | { tipo: "adjunto"; adjunto: AdjuntoBitacora };

function IconoArchivo({ mimeType }: { mimeType: string }) {
  const clase = "size-4 shrink-0 text-slate-400";
  if (mimeType.startsWith("image/")) return <FileImage className={clase} aria-hidden />;
  if (mimeType === "application/pdf") return <FileText className={clase} aria-hidden />;
  if (mimeType.includes("spreadsheet")) return <FileSpreadsheet className={clase} aria-hidden />;
  return <File className={clase} aria-hidden />;
}

async function verAdjunto(adjunto: AdjuntoBitacora) {
  try {
    if (seAbreEnNavegador(adjunto.mimeType)) await abrirArchivo(rutaAdjunto(adjunto.id));
    else await descargarArchivo(rutaAdjunto(adjunto.id), adjunto.nombreArchivo);
  } catch (e) {
    toast.error(mensajeError(e, "No fue posible abrir el archivo"));
  }
}

export function PestanaBitacora({ proyectoId }: { proyectoId: number }) {
  const usuario = useSesion((s) => s.usuario);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const rangoInvalido = Boolean(desde && hasta && desde > hasta);
  const consulta = useBitacora(
    proyectoId,
    rangoInvalido ? undefined : { desde: desde || undefined, hasta: hasta || undefined },
  );
  const eliminarEntrada = useEliminarEntradaBitacora(proyectoId);
  const eliminarAdjunto = useEliminarAdjunto(proyectoId);
  const [creando, setCreando] = useState(false);
  const [adjuntandoA, setAdjuntandoA] = useState<EntradaBitacora | null>(null);
  const [porEliminar, setPorEliminar] = useState<PorEliminar | null>(null);

  const editable = puedeEscribir(usuario?.rol, "operacionProyecto");

  const confirmarEliminar = () => {
    if (!porEliminar) return;
    const opciones = {
      onSuccess: () => toast.success(porEliminar.tipo === "entrada" ? "Entrada eliminada" : "Adjunto eliminado"),
      onError: (e: Error) => toast.error(mensajeError(e)),
      onSettled: () => setPorEliminar(null),
    };
    if (porEliminar.tipo === "entrada") eliminarEntrada.mutate(porEliminar.entrada.id, opciones);
    else eliminarAdjunto.mutate(porEliminar.adjunto.id, opciones);
  };

  return (
    <Card>
      <CardHeader
        titulo="Bitácora de obra"
        descripcion="Registro diario de actividades, novedades y evidencias"
        acciones={
          editable && (
            <Button tamano="sm" onClick={() => setCreando(true)}>
              <Plus className="size-4" /> Nueva entrada
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-3">
        <label className="space-y-1 text-xs text-slate-500">
          <span className="block">Desde</span>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        </label>
        <label className="space-y-1 text-xs text-slate-500">
          <span className="block">Hasta</span>
          <Input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-40"
            aria-invalid={rangoInvalido}
          />
        </label>
        {(desde || hasta) && (
          <Button
            variante="fantasma"
            tamano="sm"
            onClick={() => {
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar
          </Button>
        )}
        {rangoInvalido && (
          <p className="w-full text-xs text-red-600" role="alert">
            La fecha inicial no puede ser posterior a la final.
          </p>
        )}
      </div>

      {consulta.isPending ? (
        <Spinner />
      ) : consulta.isError ? (
        <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <EmptyState
          titulo="Sin entradas"
          descripcion={desde || hasta ? "No hay entradas en el rango seleccionado." : "Aún no se ha registrado actividad en la bitácora."}
        />
      ) : (
        <ol className="space-y-0 p-4">
          {consulta.data.map((entrada) => {
            const eliminable = puedeEliminarEntrada(usuario, entrada.autor.id);
            const cupoAdjuntos = entrada.adjuntos.length < MAX_ADJUNTOS_POR_ENTRADA;
            return (
              <li key={entrada.id} className="relative border-l-2 border-slate-200 pb-6 pl-5 last:pb-0">
                <span className="absolute top-1.5 -left-[7px] size-3 rounded-full bg-marca-600 ring-4 ring-white" aria-hidden />
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      <time dateTime={entrada.fecha}>{formatoFecha(entrada.fecha)}</time>
                    </p>
                    <p className="text-xs text-slate-500">
                      {entrada.autor.nombre} · registrada {formatoFechaHora(entrada.creadoEn)}
                    </p>
                  </div>
                  {editable && (
                    <div className="flex gap-1">
                      {cupoAdjuntos && (
                        <Button variante="fantasma" tamano="sm" onClick={() => setAdjuntandoA(entrada)}>
                          <Paperclip className="size-4" aria-hidden /> Adjuntar
                        </Button>
                      )}
                      {eliminable && (
                        <Button
                          variante="fantasma"
                          tamano="sm"
                          onClick={() => setPorEliminar({ tipo: "entrada", entrada })}
                          aria-label={`Eliminar entrada del ${formatoFecha(entrada.fecha)}`}
                        >
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <p className="mt-2 text-sm whitespace-pre-line text-slate-700">{entrada.descripcion}</p>
                {entrada.observaciones && (
                  <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm whitespace-pre-line text-slate-600">
                    <span className="font-medium text-slate-700">Observaciones: </span>
                    {entrada.observaciones}
                  </p>
                )}

                {entrada.adjuntos.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2" aria-label="Adjuntos">
                    {entrada.adjuntos.map((adjunto) => {
                      const enLinea = seAbreEnNavegador(adjunto.mimeType);
                      return (
                        <li
                          key={adjunto.id}
                          className="flex max-w-full items-center rounded-md bg-white ring-1 ring-slate-200"
                        >
                          <button
                            type="button"
                            onClick={() => verAdjunto(adjunto)}
                            className="flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-slate-50"
                            title={enLinea ? "Abrir en una pestaña nueva" : "Descargar"}
                          >
                            <IconoArchivo mimeType={adjunto.mimeType} />
                            <span className="truncate text-slate-700">{adjunto.nombreArchivo}</span>
                            <span className="shrink-0 text-xs text-slate-400">{formatoTamano(adjunto.tamanoBytes)}</span>
                            {enLinea ? (
                              <ExternalLink className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                            ) : (
                              <Download className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                            )}
                            <span className="sr-only">{enLinea ? "(abre en una pestaña nueva)" : "(descargar)"}</span>
                          </button>
                          {eliminable && (
                            <button
                              type="button"
                              onClick={() => setPorEliminar({ tipo: "adjunto", adjunto })}
                              className="mr-1 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Eliminar adjunto ${adjunto.nombreArchivo}`}
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {creando && <EntradaBitacoraForm proyectoId={proyectoId} onCerrar={() => setCreando(false)} />}
      {adjuntandoA && (
        <AdjuntosForm proyectoId={proyectoId} entrada={adjuntandoA} onCerrar={() => setAdjuntandoA(null)} />
      )}

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo={porEliminar?.tipo === "adjunto" ? "Eliminar adjunto" : "Eliminar entrada"}
        mensaje={
          porEliminar?.tipo === "adjunto" ? (
            <>
              ¿Eliminar el archivo <strong>{porEliminar.adjunto.nombreArchivo}</strong>?
            </>
          ) : (
            porEliminar && (
              <>
                ¿Eliminar la entrada del <strong>{formatoFecha(porEliminar.entrada.fecha)}</strong>
                {porEliminar.entrada.adjuntos.length > 0 &&
                  ` y sus ${porEliminar.entrada.adjuntos.length} adjunto${porEliminar.entrada.adjuntos.length === 1 ? "" : "s"}`}
                ? Esta acción no se puede deshacer.
              </>
            )
          )
        }
        textoConfirmar="Eliminar"
        peligroso
        cargando={eliminarEntrada.isPending || eliminarAdjunto.isPending}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPorEliminar(null)}
      />
    </Card>
  );
}
