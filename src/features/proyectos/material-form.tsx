"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { useGuardarMaterial } from "@/features/operacion/api";
import { mensajeError } from "@/lib/errores";
import { numeroRequerido, textoRequerido } from "@/lib/validacion";
import type { Material } from "@/types/api";
import { tieneMaxDosDecimales } from "./utilidades";

const esquema = z.object({
  nombre: textoRequerido("Ingrese el nombre del material", 150),
  cantidadSolicitada: numeroRequerido(
    z
      .number({ error: "Ingrese la cantidad" })
      .positive("Debe ser mayor a 0")
      .refine(tieneMaxDosDecimales, "Máximo 2 decimales"),
  ),
  unidadMedida: textoRequerido("Ingrese la unidad", 20),
  precioUnitario: numeroRequerido(
    z
      .number({ error: "Ingrese el precio" })
      .min(0, "No puede ser negativo")
      .refine(tieneMaxDosDecimales, "Máximo 2 decimales"),
  ),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(m?: Material): Entrada {
  return {
    nombre: m?.nombre ?? "",
    cantidadSolicitada: m?.cantidadSolicitada,
    unidadMedida: m?.unidadMedida ?? "",
    precioUnitario: m?.precioUnitario,
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

  const enviar = handleSubmit((datos) => {
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
        <Field label="Precio unitario (COP)" error={errors.precioUnitario?.message} className="sm:col-span-2">
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              aria-invalid={!!errors.precioUnitario}
              {...register("precioUnitario", { valueAsNumber: true })}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
