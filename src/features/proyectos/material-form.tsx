"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { useGuardarMaterial, type DatosMaterial } from "@/features/operacion/api";
import { mensajeError } from "@/lib/errores";
import { ESTADOS } from "@/lib/etiquetas";
import { fechaOpcional, numeroOpcional, numeroRequerido, textoOpcional, textoRequerido } from "@/lib/validacion";
import type { EstadoMaterial, Material } from "@/types/api";
import { tieneMaxDosDecimales } from "./utilidades";

const esquema = z.object({
  nombre: textoRequerido("Ingrese el nombre del material", 150),
  unidadMedida: textoRequerido("Ingrese la unidad", 20),
  cantidadSolicitada: numeroRequerido(
    z
      .number({ error: "Ingrese la cantidad" })
      .positive("Debe ser mayor a 0")
      .refine(tieneMaxDosDecimales, "Máximo 2 decimales"),
  ),
  fechaRequerida: fechaOpcional(),
  descripcion: textoOpcional(5000),
  observaciones: textoOpcional(5000),
  // Solo en edición:
  estado: z.enum(["PENDIENTE", "SOLICITADO", "ENTREGADO", "INSTALADO"]),
  cantidadEntregada: numeroOpcional(
    z.number({ error: "Cantidad inválida" }).min(0, "No puede ser negativa").refine(tieneMaxDosDecimales, "Máximo 2 decimales"),
  ),
  fechaEntrega: fechaOpcional(),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(m?: Material): Entrada {
  return {
    nombre: m?.nombre ?? "",
    unidadMedida: m?.unidadMedida ?? "",
    cantidadSolicitada: m?.cantidadSolicitada,
    fechaRequerida: m?.fechaRequerida ?? "",
    descripcion: m?.descripcion ?? "",
    observaciones: m?.observaciones ?? "",
    estado: m?.estado ?? "PENDIENTE",
    cantidadEntregada: m?.cantidadEntregada ?? 0,
    fechaEntrega: m?.fechaEntrega ?? "",
  };
}

interface Props {
  proyectoId: number;
  material?: Material;
  onCerrar: () => void;
}

export function MaterialForm({ proyectoId, material, onCerrar }: Props) {
  const guardar = useGuardarMaterial(proyectoId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    values: valoresIniciales(material),
  });

  const enviar = handleSubmit(({ estado, cantidadEntregada, fechaEntrega, ...comunes }) => {
    const datos: DatosMaterial = material
      ? // Sin fecha de entrega, el API asigna hoy al pasar a ENTREGADO/INSTALADO.
        { ...comunes, estado, cantidadEntregada: cantidadEntregada ?? 0, fechaEntrega: fechaEntrega ?? null }
      : comunes;
    guardar.mutate(
      { id: material?.id, datos },
      {
        onSuccess: () => {
          toast.success(material ? "Material actualizado" : "Material registrado");
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
      titulo={material ? "Editar material" : "Nuevo material"}
      descripcion={material ? undefined : "Se registra como pendiente con fecha de solicitud de hoy"}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-material" cargando={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-material" onSubmit={enviar} className="grid grid-cols-1 gap-4 sm:grid-cols-6" noValidate>
        <Field label="Material" error={errors.nombre?.message} className="sm:col-span-6">
          {(id) => <Input id={id} aria-invalid={!!errors.nombre} {...register("nombre")} />}
        </Field>
        <Field label="Cantidad solicitada" error={errors.cantidadSolicitada?.message} className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              aria-invalid={!!errors.cantidadSolicitada}
              {...register("cantidadSolicitada", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Unidad" error={errors.unidadMedida?.message} ayuda="m, und, kg, rollo…" className="sm:col-span-2">
          {(id) => <Input id={id} aria-invalid={!!errors.unidadMedida} {...register("unidadMedida")} />}
        </Field>
        <Field label="Fecha requerida" error={errors.fechaRequerida?.message} className="sm:col-span-2">
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaRequerida} {...register("fechaRequerida")} />}
        </Field>

        {material && (
          <>
            <Field label="Estado" error={errors.estado?.message} className="sm:col-span-2">
              {(id) => (
                <Select id={id} {...register("estado")}>
                  {(Object.keys(ESTADOS.material) as EstadoMaterial[]).map((estado) => (
                    <option key={estado} value={estado}>
                      {ESTADOS.material[estado][0]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Cantidad entregada" error={errors.cantidadEntregada?.message} className="sm:col-span-2">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  aria-invalid={!!errors.cantidadEntregada}
                  {...register("cantidadEntregada", { valueAsNumber: true })}
                />
              )}
            </Field>
            <Field
              label="Fecha de entrega"
              error={errors.fechaEntrega?.message}
              ayuda="Vacía = hoy al marcar entregado"
              className="sm:col-span-2"
            >
              {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaEntrega} {...register("fechaEntrega")} />}
            </Field>
          </>
        )}

        <Field label="Descripción" error={errors.descripcion?.message} className="sm:col-span-6">
          {(id) => <Textarea id={id} rows={2} aria-invalid={!!errors.descripcion} {...register("descripcion")} />}
        </Field>
        <Field label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-6">
          {(id) => <Textarea id={id} rows={2} aria-invalid={!!errors.observaciones} {...register("observaciones")} />}
        </Field>
      </form>
    </Modal>
  );
}
