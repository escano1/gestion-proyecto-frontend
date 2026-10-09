"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { useCrearEntradaBitacora } from "@/features/operacion/api";
import { mensajeError } from "@/lib/errores";
import { hoy } from "@/lib/fechas";
import { fechaRequerida, textoOpcional, textoRequerido } from "@/lib/validacion";
import { SelectorArchivos } from "./selector-archivos";
import { prepararArchivos, validarArchivos } from "./utilidades";

const esquema = z.object({
  fecha: fechaRequerida(),
  descripcion: textoRequerido("Describa la actividad o novedad", 5000),
  observaciones: textoOpcional(5000),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

interface Props {
  proyectoId: number;
  onCerrar: () => void;
}

export function EntradaBitacoraForm({ proyectoId, onCerrar }: Props) {
  const crear = useCrearEntradaBitacora(proyectoId);
  const [archivos, setArchivos] = useState<File[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    defaultValues: { fecha: hoy(), descripcion: "", observaciones: "" },
  });

  const archivosValidos = validarArchivos(archivos).length === 0;

  const enviar = handleSubmit((datos) => {
    if (!archivosValidos) return;
    crear.mutate(
      { ...datos, archivos: prepararArchivos(archivos) },
      {
        onSuccess: () => {
          toast.success("Entrada registrada en la bitácora");
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
      titulo="Nueva entrada de bitácora"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-bitacora" cargando={crear.isPending} disabled={!archivosValidos}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-bitacora" onSubmit={enviar} className="grid grid-cols-1 gap-4 sm:grid-cols-3" noValidate>
        <Field label="Fecha" error={errors.fecha?.message}>
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fecha} {...register("fecha")} />}
        </Field>
        <Field label="Descripción" error={errors.descripcion?.message} className="sm:col-span-3">
          {(id) => (
            <Textarea
              id={id}
              rows={4}
              placeholder="Actividades ejecutadas, avance, novedades de obra…"
              aria-invalid={!!errors.descripcion}
              {...register("descripcion")}
            />
          )}
        </Field>
        <Field label="Observaciones" error={errors.observaciones?.message} className="sm:col-span-3">
          {(id) => <Textarea id={id} rows={2} aria-invalid={!!errors.observaciones} {...register("observaciones")} />}
        </Field>
        <div className="sm:col-span-3">
          <SelectorArchivos archivos={archivos} onCambiar={setArchivos} />
        </div>
      </form>
    </Modal>
  );
}
