"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { useCrearLiquidacion } from "@/features/nomina/api";
import { mensajeError } from "@/lib/errores";
import { hoy, inicioSemana, sumarDias } from "@/lib/fechas";
import { nombrePeriodo } from "@/lib/formato";
import { rangoFechas } from "./formato-nomina";

const esquema = z.object({
  fecha: z.string().min(1, "Seleccione un día de la semana a liquidar"),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

/** Semana lunes-domingo que contiene la fecha, para la vista previa. */
const semanaDe = (fecha: string) => {
  const lunes = inicioSemana(fecha);
  return rangoFechas(lunes, sumarDias(lunes, 6));
};

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export function NuevaLiquidacionModal({ abierto, onCerrar }: Props) {
  const router = useRouter();
  const crear = useCrearLiquidacion();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    defaultValues: { fecha: hoy() },
  });

  const fecha = useWatch({ control, name: "fecha" });

  const enviar = handleSubmit((datos) => {
    crear.mutate(datos, {
      onSuccess: (liquidacion) => {
        toast.success(`Liquidación calculada: ${nombrePeriodo(liquidacion)}`);
        onCerrar();
        router.push(`/nomina/${liquidacion.id}`);
      },
      onError: (e) => toast.error(mensajeError(e)),
    });
  });

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva liquidación semanal"
      descripcion="Se calcula la nómina de la semana (lunes a domingo) de los trabajadores activos y de quienes registraron horas."
      ancho="sm"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={crear.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="form-liquidacion" cargando={crear.isPending}>
            Calcular liquidación
          </Button>
        </>
      }
    >
      <form id="form-liquidacion" onSubmit={enviar} className="grid gap-4" noValidate>
        <Field label="Cualquier día de la semana" error={errors.fecha?.message}>
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fecha} {...register("fecha")} />}
        </Field>
        <p className="text-sm text-slate-600" aria-live="polite">
          {fecha ? (
            <>
              Semana: <span className="font-medium text-slate-900">{semanaDe(fecha)}</span>
            </>
          ) : (
            "Seleccione una fecha para ver la semana a liquidar."
          )}
        </p>
      </form>
    </Modal>
  );
}
