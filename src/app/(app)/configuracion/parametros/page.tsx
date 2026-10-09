"use client";

import { useState } from "react";
import { Info, Plus } from "lucide-react";
import { toast } from "sonner";
import { useEliminarParametro, useParametros } from "@/features/catalogos/api";
import { ParametroForm } from "@/features/configuracion/parametro-form";
import { agruparPorCodigo, formatoValorParametro } from "@/features/configuracion/parametros";
import { HistorialVigencias, TablaTiposHora, ValoresVigentes } from "@/features/configuracion/secciones-parametros";
import { useSesion } from "@/lib/auth-store";
import { puedeEscribir } from "@/lib/permisos";
import { mensajeError } from "@/lib/errores";
import { formatoFecha } from "@/lib/formato";
import { hoy } from "@/lib/fechas";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/modal";
import type { CodigoParametro, ParametroLegal } from "@/types/api";

export default function PaginaParametros() {
  const rol = useSesion((s) => s.usuario?.rol);
  const editable = puedeEscribir(rol, "parametros");
  const historial = useParametros();
  const eliminar = useEliminarParametro();
  const [fecha] = useState(hoy);
  const [formulario, setFormulario] = useState<{ abierto: boolean; codigo?: CodigoParametro }>({ abierto: false });
  const [porEliminar, setPorEliminar] = useState<ParametroLegal | null>(null);

  const grupos = historial.data ? agruparPorCodigo(historial.data, fecha) : [];

  const confirmarEliminacion = () => {
    if (!porEliminar) return;
    eliminar.mutate(porEliminar.id, {
      onSuccess: () => toast.success("Vigencia eliminada"),
      onError: (e) => toast.error(mensajeError(e)),
      onSettled: () => setPorEliminar(null),
    });
  };

  return (
    <>
      <PageHeader
        titulo="Parámetros legales"
        descripcion="Valores de ley usados en el cálculo de horas, costos y nómina"
        acciones={
          editable && (
            <Button onClick={() => setFormulario({ abierto: true })}>
              <Plus className="size-4" /> Nueva vigencia
            </Button>
          )
        }
      />

      <div className="space-y-6">
        <p className="flex gap-2 rounded-md bg-marca-50 p-3 text-sm text-marca-800 ring-1 ring-marca-100">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Cada parámetro aplica según su fecha de vigencia: las horas y nóminas usan el valor vigente en su fecha. Crear
            o eliminar una vigencia marca para recálculo las nóminas en borrador afectadas; no es posible eliminar una
            vigencia que afecte nóminas ya cerradas.
          </span>
        </p>

        <ValoresVigentes />

        <TablaTiposHora />

        <Card>
          <CardHeader titulo="Historial de vigencias" descripcion="Valores por parámetro, del más reciente al más antiguo" />
          {historial.isPending ? (
            <Spinner />
          ) : historial.isError ? (
            <ErrorState mensaje={mensajeError(historial.error)} reintentar={() => historial.refetch()} />
          ) : (
            <HistorialVigencias
              grupos={grupos}
              fecha={fecha}
              editable={editable}
              onAgregar={(codigo) => setFormulario({ abierto: true, codigo })}
              onEliminar={setPorEliminar}
            />
          )}
        </Card>
      </div>

      {formulario.abierto && (
        <ParametroForm
          codigoInicial={formulario.codigo}
          grupos={grupos}
          onCerrar={() => setFormulario({ abierto: false })}
        />
      )}

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="Eliminar vigencia"
        peligroso
        textoConfirmar="Eliminar"
        cargando={eliminar.isPending}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPorEliminar(null)}
        mensaje={
          porEliminar && (
            <>
              ¿Eliminar el valor{" "}
              <strong>{formatoValorParametro(porEliminar.valor, porEliminar.unidad)}</strong> de{" "}
              <strong>{porEliminar.nombre}</strong> vigente desde {formatoFecha(porEliminar.vigenteDesde)}? Las fechas
              cubiertas pasarán a usar la vigencia anterior y las nóminas en borrador afectadas se marcarán para
              recálculo.
            </>
          )
        }
      />
    </>
  );
}
