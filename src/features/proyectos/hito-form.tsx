"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { useGuardarHito, type DatosHito } from "@/features/operacion/api";
import { mensajeError } from "@/lib/errores";
import { formatoAvance } from "@/lib/formato";
import { fechaOpcional, fechaRequerida, numeroRequerido, textoOpcional, textoRequerido } from "@/lib/validacion";
import type { Hito } from "@/types/api";
import { tieneMaxDosDecimales } from "./utilidades";

const porcentaje = (mensaje: string) =>
  z.number({ error: mensaje }).refine(tieneMaxDosDecimales, "Máximo 2 decimales");

const esquema = z.object({
  nombre: textoRequerido("Ingrese el nombre del hito", 150),
  descripcion: textoOpcional(5000),
  orden: numeroRequerido(
    z.number({ error: "Ingrese el orden" }).int("Debe ser un número entero").min(0, "No puede ser negativo").max(32767, "Máximo 32767"),
  ),
  fechaPlaneada: fechaRequerida("Seleccione la fecha planeada"),
  peso: numeroRequerido(porcentaje("Ingrese el peso").gt(0, "Debe ser mayor a 0").max(100, "Máximo 100")),
  porcentajeAvance: numeroRequerido(porcentaje("Ingrese el avance").min(0, "Mínimo 0").max(100, "Máximo 100")),
  // Solo en edición:
  fechaReal: fechaOpcional(),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(h: Hito | undefined, ordenSugerido: number): Entrada {
  return {
    nombre: h?.nombre ?? "",
    descripcion: h?.descripcion ?? "",
    orden: h?.orden ?? ordenSugerido,
    fechaPlaneada: h?.fechaPlaneada ?? "",
    peso: h?.peso,
    porcentajeAvance: h?.porcentajeAvance ?? 0,
    fechaReal: h?.fechaReal ?? "",
  };
}

interface Props {
  proyectoId: number;
  hito?: Hito;
  /** Suma de pesos de los demás hitos, para sugerir el peso disponible. */
  pesoOtros: number;
  ordenSugerido: number;
  onCerrar: () => void;
}

export function HitoForm({ proyectoId, hito, pesoOtros, ordenSugerido, onCerrar }: Props) {
  const guardar = useGuardarHito(proyectoId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    values: valoresIniciales(hito, ordenSugerido),
  });

  const disponible = Math.max(0, Math.round((100 - pesoOtros) * 100) / 100);

  const enviar = handleSubmit(({ fechaReal, ...comunes }) => {
    // El estado lo deriva el API del avance (100 % sin fecha real → hoy).
    const datos: DatosHito = hito ? { ...comunes, fechaReal: fechaReal ?? null } : comunes;
    guardar.mutate(
      { id: hito?.id, datos },
      {
        onSuccess: () => {
          toast.success(hito ? "Hito actualizado" : "Hito creado");
          onCerrar();
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  });

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={hito ? "Editar hito" : "Nuevo hito"}
      descripcion="El estado se calcula a partir del % de avance"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-hito" cargando={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-hito" onSubmit={enviar} className="grid grid-cols-1 gap-4 sm:grid-cols-6" noValidate>
        <Field label="Nombre" error={errors.nombre?.message} className="sm:col-span-4">
          {(id) => <Input id={id} aria-invalid={!!errors.nombre} {...register("nombre")} />}
        </Field>
        <Field label="Orden" error={errors.orden?.message} className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              aria-invalid={!!errors.orden}
              {...register("orden", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Fecha planeada" error={errors.fechaPlaneada?.message} className="sm:col-span-2">
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaPlaneada} {...register("fechaPlaneada")} />}
        </Field>
        <Field
          label="Peso (%)"
          error={errors.peso?.message}
          ayuda={`Disponible: ${formatoAvance(disponible)}`}
          className="sm:col-span-2"
        >
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="any"
              aria-invalid={!!errors.peso}
              {...register("peso", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Avance (%)" error={errors.porcentajeAvance?.message} className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step="any"
              aria-invalid={!!errors.porcentajeAvance}
              {...register("porcentajeAvance", { valueAsNumber: true })}
            />
          )}
        </Field>
        {hito && (
          <Field
            label="Fecha real de cumplimiento"
            error={errors.fechaReal?.message}
            ayuda="Vacía = hoy al llegar a 100 %"
            className="sm:col-span-3"
          >
            {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaReal} {...register("fechaReal")} />}
          </Field>
        )}
        <Field label="Descripción" error={errors.descripcion?.message} className="sm:col-span-6">
          {(id) => <Textarea id={id} rows={2} aria-invalid={!!errors.descripcion} {...register("descripcion")} />}
        </Field>
      </form>
    </Modal>
  );
}
