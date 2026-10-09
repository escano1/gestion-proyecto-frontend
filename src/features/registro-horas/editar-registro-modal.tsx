"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { DataList, ErrorState, Spinner } from "@/components/ui/display";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { useActualizarRegistroHoras } from "@/features/horas/api";
import { useTiposHora } from "@/features/catalogos/api";
import { mensajeError } from "@/lib/errores";
import { formatoFecha, formatoHoras } from "@/lib/formato";
import { numeroOpcional, textoOpcional } from "@/lib/validacion";
import { HORAS_MAXIMAS_DIA, tiposDeGrilla, type TipoGrilla } from "./grilla";
import type { RegistroHoras } from "@/types/api";

const esquema = z.object({
  detalles: z.array(
    z.object({
      tipoHoraId: z.number(),
      horas: numeroOpcional(
        z
          .number({ error: "Número inválido" })
          .min(0, "No puede ser negativo")
          .max(HORAS_MAXIMAS_DIA, `Máximo ${HORAS_MAXIMAS_DIA} h`)
          .multipleOf(0.01, "Máximo 2 decimales"),
      ),
    }),
  ),
  observacion: textoOpcional(500),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(registro: RegistroHoras, tipos: TipoGrilla[]): Entrada {
  return {
    detalles: tipos.map((t) => ({
      tipoHoraId: t.id,
      horas: registro.detalles.find((d) => d.tipoHoraId === t.id)?.horas,
    })),
    observacion: registro.observacion ?? "",
  };
}

interface Props {
  registro: RegistroHoras | null;
  onCerrar: () => void;
  /** Recibe las alertas (no bloqueantes) devueltas por el API. */
  onGuardado: (alertas: string[]) => void;
}

export function EditarRegistroModal({ registro, onCerrar, onGuardado }: Props) {
  const tiposHora = useTiposHora();
  const actualizar = useActualizarRegistroHoras();
  const tipos = useMemo(
    () => (registro ? tiposDeGrilla(tiposHora.data ?? [], [registro]) : []),
    [registro, tiposHora.data],
  );
  const listo = Boolean(registro && tiposHora.data);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    values: registro && listo ? valoresIniciales(registro, tipos) : undefined,
  });

  const detallesDigitados = useWatch({ control, name: "detalles" });
  const total = (detallesDigitados ?? []).reduce(
    (suma, d) => suma + (typeof d.horas === "number" && Number.isFinite(d.horas) ? d.horas : 0),
    0,
  );

  const enviar = handleSubmit((datos) => {
    if (!registro) return;
    const detalles = datos.detalles.flatMap((d) =>
      d.horas !== null && d.horas > 0 ? [{ tipoHoraId: d.tipoHoraId, horas: d.horas }] : [],
    );
    if (detalles.length === 0) {
      setError("root", { message: "Registre horas en al menos un tipo. Para quitar el registro use Eliminar." });
      return;
    }
    actualizar.mutate(
      { id: registro.id, datos: { observacion: datos.observacion ?? null, detalles } },
      {
        onSuccess: (respuesta) => {
          toast.success("Registro actualizado");
          onGuardado(respuesta.alertas);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  });

  return (
    <Modal
      abierto={registro !== null}
      onCerrar={onCerrar}
      titulo="Editar registro de horas"
      descripcion="Los cambios se auditan y marcan para recálculo la nómina en borrador del periodo."
      ancho="md"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-registro-horas" cargando={actualizar.isPending} disabled={!listo}>
            Guardar
          </Button>
        </>
      }
    >
      {!registro ? null : tiposHora.isError ? (
        <ErrorState mensaje={mensajeError(tiposHora.error)} reintentar={() => tiposHora.refetch()} />
      ) : !listo ? (
        <Spinner />
      ) : (
        <form id="form-registro-horas" onSubmit={enviar} className="space-y-5" noValidate>
          <DataList
            items={[
              { etiqueta: "Trabajador", valor: registro.trabajador.nombre },
              { etiqueta: "Proyecto", valor: `${registro.proyecto.codigo} · ${registro.proyecto.nombre}` },
              { etiqueta: "Fecha", valor: formatoFecha(registro.fecha) },
            ]}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Horas por tipo</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {tipos.map((t, i) => (
                <Field
                  key={t.id}
                  label={`${t.codigo} · ${t.nombre}${t.activo ? "" : " (inactivo)"}`}
                  error={errors.detalles?.[i]?.horas?.message}
                >
                  {(id) => (
                    <Input
                      id={id}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={HORAS_MAXIMAS_DIA}
                      step={0.5}
                      aria-invalid={!!errors.detalles?.[i]?.horas}
                      {...register(`detalles.${i}.horas`, { valueAsNumber: true })}
                    />
                  )}
                </Field>
              ))}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">{formatoHoras(Math.round(total * 100) / 100)}</span>
            </p>
            {errors.root?.message && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.root.message}
              </p>
            )}
          </fieldset>
          <Field label="Observación" error={errors.observacion?.message}>
            {(id) => <Textarea id={id} maxLength={500} aria-invalid={!!errors.observacion} {...register("observacion")} />}
          </Field>
        </form>
      )}
    </Modal>
  );
}
