"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { useGuardarProyecto } from "@/features/personal/api";
import { mensajeError } from "@/lib/errores";
import { ESTADOS } from "@/lib/etiquetas";
import { hoy } from "@/lib/fechas";
import { fechaOpcional, fechaRequerida, numeroOpcional, textoOpcional, textoRequerido } from "@/lib/validacion";
import type { EstadoProyecto, Proyecto } from "@/types/api";
import { tieneMaxDosDecimales } from "./utilidades";

const esquema = z
  .object({
    codigo: textoRequerido("Ingrese el código", 30),
    nombre: textoRequerido("Ingrese el nombre", 200),
    cliente: textoRequerido("Ingrese el cliente", 150),
    ubicacion: textoRequerido("Ingrese la ubicación", 200),
    descripcion: textoOpcional(5000),
    fechaInicio: fechaRequerida("Seleccione la fecha de inicio"),
    fechaFinPlaneada: fechaOpcional(),
    fechaFinReal: fechaOpcional(),
    estado: z.enum(["ACTIVO", "SUSPENDIDO", "FINALIZADO"]),
    presupuesto: numeroOpcional(
      z
        .number({ error: "Presupuesto inválido" })
        .min(0, "No puede ser negativo")
        .refine(tieneMaxDosDecimales, "Máximo 2 decimales"),
    ),
  })
  .superRefine((d, ctx) => {
    if (d.fechaFinPlaneada && d.fechaFinPlaneada < d.fechaInicio) {
      ctx.addIssue({ code: "custom", path: ["fechaFinPlaneada"], message: "Debe ser igual o posterior al inicio" });
    }
    if (d.fechaFinReal && d.fechaFinReal < d.fechaInicio) {
      ctx.addIssue({ code: "custom", path: ["fechaFinReal"], message: "Debe ser igual o posterior al inicio" });
    }
  });

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(p?: Proyecto): Entrada {
  return {
    codigo: p?.codigo ?? "",
    nombre: p?.nombre ?? "",
    cliente: p?.cliente ?? "",
    ubicacion: p?.ubicacion ?? "",
    descripcion: p?.descripcion ?? "",
    fechaInicio: p?.fechaInicio ?? hoy(),
    fechaFinPlaneada: p?.fechaFinPlaneada ?? "",
    fechaFinReal: p?.fechaFinReal ?? "",
    estado: p?.estado ?? "ACTIVO",
    presupuesto: p?.presupuesto ?? undefined,
  };
}

interface Props {
  proyecto?: Proyecto;
  onCerrar: () => void;
  /** Se invoca con el proyecto guardado (p. ej. para navegar al detalle tras crearlo). */
  onGuardado?: (proyecto: Proyecto) => void;
}

/** Crear/editar proyecto. Se monta al abrirse para iniciar siempre con datos frescos. */
export function ProyectoForm({ proyecto, onCerrar, onGuardado }: Props) {
  const guardar = useGuardarProyecto();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    values: valoresIniciales(proyecto),
  });

  const enviar = handleSubmit((datos) => {
    guardar.mutate(
      { id: proyecto?.id, datos },
      {
        onSuccess: (guardado) => {
          toast.success(proyecto ? "Proyecto actualizado" : "Proyecto creado");
          onCerrar();
          onGuardado?.(guardado);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  });

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={proyecto ? "Editar proyecto" : "Nuevo proyecto"}
      ancho="lg"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-proyecto" cargando={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-proyecto" onSubmit={enviar} className="grid grid-cols-1 gap-4 md:grid-cols-3" noValidate>
        <Field label="Código" error={errors.codigo?.message} ayuda="Único, p. ej. PRY-2026-01">
          {(id) => <Input id={id} autoComplete="off" aria-invalid={!!errors.codigo} {...register("codigo")} />}
        </Field>
        <Field label="Nombre" error={errors.nombre?.message} className="md:col-span-2">
          {(id) => <Input id={id} aria-invalid={!!errors.nombre} {...register("nombre")} />}
        </Field>
        <Field label="Cliente" error={errors.cliente?.message}>
          {(id) => <Input id={id} aria-invalid={!!errors.cliente} {...register("cliente")} />}
        </Field>
        <Field label="Ubicación" error={errors.ubicacion?.message} className="md:col-span-2">
          {(id) => <Input id={id} aria-invalid={!!errors.ubicacion} {...register("ubicacion")} />}
        </Field>
        <Field label="Fecha de inicio" error={errors.fechaInicio?.message}>
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaInicio} {...register("fechaInicio")} />}
        </Field>
        <Field label="Fin planeado" error={errors.fechaFinPlaneada?.message}>
          {(id) => (
            <Input id={id} type="date" aria-invalid={!!errors.fechaFinPlaneada} {...register("fechaFinPlaneada")} />
          )}
        </Field>
        <Field label="Fin real" error={errors.fechaFinReal?.message}>
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaFinReal} {...register("fechaFinReal")} />}
        </Field>
        <Field label="Estado" error={errors.estado?.message}>
          {(id) => (
            <Select id={id} {...register("estado")}>
              {(Object.keys(ESTADOS.proyecto) as EstadoProyecto[]).map((estado) => (
                <option key={estado} value={estado}>
                  {ESTADOS.proyecto[estado][0]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Presupuesto (COP)" error={errors.presupuesto?.message} ayuda="Opcional" className="md:col-span-2">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              aria-invalid={!!errors.presupuesto}
              {...register("presupuesto", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Descripción" error={errors.descripcion?.message} className="md:col-span-3">
          {(id) => <Textarea id={id} aria-invalid={!!errors.descripcion} {...register("descripcion")} />}
        </Field>
      </form>
    </Modal>
  );
}
