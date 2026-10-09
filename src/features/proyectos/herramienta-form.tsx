"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { useGuardarHerramienta, type DatosHerramienta } from "@/features/operacion/api";
import { useTrabajadores } from "@/features/personal/api";
import { mensajeError } from "@/lib/errores";
import { ESTADOS } from "@/lib/etiquetas";
import { hoy } from "@/lib/fechas";
import {
  fechaOpcional,
  fechaRequerida,
  numeroOpcional,
  numeroRequerido,
  textoOpcional,
  textoRequerido,
} from "@/lib/validacion";
import type { EstadoHerramienta, Herramienta } from "@/types/api";

const esquema = z
  .object({
    nombre: textoRequerido("Ingrese el nombre de la herramienta", 150),
    codigo: textoOpcional(50),
    cantidad: numeroRequerido(z.number({ error: "Ingrese la cantidad" }).int("Debe ser un número entero").min(1, "Mínimo 1")),
    responsableId: numeroOpcional(z.number({ error: "Responsable inválido" }).int().positive("Responsable inválido")),
    fechaAsignacion: fechaRequerida("Seleccione la fecha de asignación"),
    fechaDevolucionPrevista: fechaOpcional(),
    observaciones: textoOpcional(5000),
    // Solo en edición:
    estado: z.enum(["ASIGNADA", "DEVUELTA", "EXTRAVIADA"]),
    fechaDevolucion: fechaOpcional(),
  })
  .superRefine((d, ctx) => {
    if (d.fechaDevolucionPrevista && d.fechaDevolucionPrevista < d.fechaAsignacion) {
      ctx.addIssue({ code: "custom", path: ["fechaDevolucionPrevista"], message: "Debe ser igual o posterior a la asignación" });
    }
    if (d.fechaDevolucion && d.fechaDevolucion < d.fechaAsignacion) {
      ctx.addIssue({ code: "custom", path: ["fechaDevolucion"], message: "Debe ser igual o posterior a la asignación" });
    }
  });

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(h?: Herramienta): Entrada {
  return {
    nombre: h?.nombre ?? "",
    codigo: h?.codigo ?? "",
    cantidad: h?.cantidad ?? 1,
    responsableId: h?.responsable?.id ?? "",
    fechaAsignacion: h?.fechaAsignacion ?? hoy(),
    fechaDevolucionPrevista: h?.fechaDevolucionPrevista ?? "",
    observaciones: h?.observaciones ?? "",
    estado: h?.estado ?? "ASIGNADA",
    fechaDevolucion: h?.fechaDevolucion ?? "",
  };
}

interface Props {
  proyectoId: number;
  herramienta?: Herramienta;
  onCerrar: () => void;
}

export function HerramientaForm({ proyectoId, herramienta, onCerrar }: Props) {
  const guardar = useGuardarHerramienta(proyectoId);
  const trabajadores = useTrabajadores({ estado: "ACTIVO" });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    values: valoresIniciales(herramienta),
  });

  // El responsable actual puede estar inactivo: se conserva como opción para no perderlo al editar.
  const responsableActual = herramienta?.responsable;
  const opcionesResponsable = [
    ...(responsableActual && !trabajadores.data?.some((t) => t.id === responsableActual.id) ? [responsableActual] : []),
    ...(trabajadores.data ?? []),
  ];

  const enviar = handleSubmit(({ estado, fechaDevolucion, ...comunes }) => {
    const datos: DatosHerramienta = herramienta
      ? // DEVUELTA sin fecha de devolución: el API asigna hoy.
        { ...comunes, estado, fechaDevolucion: fechaDevolucion ?? null }
      : comunes;
    guardar.mutate(
      { id: herramienta?.id, datos },
      {
        onSuccess: () => {
          toast.success(herramienta ? "Herramienta actualizada" : "Herramienta asignada");
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
      titulo={herramienta ? "Editar herramienta" : "Asignar herramienta"}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-herramienta" cargando={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-herramienta" onSubmit={enviar} className="grid grid-cols-1 gap-4 sm:grid-cols-6" noValidate>
        <Field label="Herramienta o equipo" error={errors.nombre?.message} className="sm:col-span-4">
          {(id) => <Input id={id} aria-invalid={!!errors.nombre} {...register("nombre")} />}
        </Field>
        <Field label="Cantidad" error={errors.cantidad?.message} className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              aria-invalid={!!errors.cantidad}
              {...register("cantidad", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Código o serial" error={errors.codigo?.message} ayuda="Opcional, placa de inventario" className="sm:col-span-2">
          {(id) => <Input id={id} aria-invalid={!!errors.codigo} {...register("codigo")} />}
        </Field>
        <Field
          label="Responsable"
          error={errors.responsableId?.message ?? (trabajadores.isError ? mensajeError(trabajadores.error) : undefined)}
          className="sm:col-span-4"
        >
          {(id) => (
            <Select id={id} disabled={trabajadores.isPending} {...register("responsableId", { valueAsNumber: true })}>
              <option value="">{trabajadores.isPending ? "Cargando trabajadores…" : "Sin responsable"}</option>
              {opcionesResponsable.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Fecha de asignación" error={errors.fechaAsignacion?.message} className="sm:col-span-3">
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaAsignacion} {...register("fechaAsignacion")} />}
        </Field>
        <Field label="Devolución prevista" error={errors.fechaDevolucionPrevista?.message} className="sm:col-span-3">
          {(id) => (
            <Input id={id} type="date" aria-invalid={!!errors.fechaDevolucionPrevista} {...register("fechaDevolucionPrevista")} />
          )}
        </Field>

        {herramienta && (
          <>
            <Field label="Estado" error={errors.estado?.message} className="sm:col-span-3">
              {(id) => (
                <Select id={id} {...register("estado")}>
                  {(Object.keys(ESTADOS.herramienta) as EstadoHerramienta[]).map((estado) => (
                    <option key={estado} value={estado}>
                      {ESTADOS.herramienta[estado][0]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              label="Fecha de devolución"
              error={errors.fechaDevolucion?.message}
              ayuda="Vacía = hoy al marcar devuelta"
              className="sm:col-span-3"
            >
              {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaDevolucion} {...register("fechaDevolucion")} />}
            </Field>
          </>
        )}

        <Field label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-6">
          {(id) => <Textarea id={id} rows={2} aria-invalid={!!errors.observaciones} {...register("observaciones")} />}
        </Field>
      </form>
    </Modal>
  );
}
