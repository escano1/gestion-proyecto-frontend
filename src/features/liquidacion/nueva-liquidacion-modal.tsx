"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { useCrearLiquidacion } from "@/features/nomina/api";
import { mensajeError } from "@/lib/errores";
import { opciones, TIPOS_PERIODO } from "@/lib/etiquetas";
import { hoy, ultimoDiaMes } from "@/lib/fechas";
import { nombreMes, nombrePeriodo } from "@/lib/formato";
import { numeroRequerido } from "@/lib/validacion";
import { rangoFechas } from "./formato-nomina";

const esquema = z.object({
  tipoPeriodo: z.enum(["QUINCENAL", "MENSUAL"]),
  anio: numeroRequerido(
    z.number({ error: "Ingrese el año" }).int("Año inválido").min(2000, "Año inválido").max(2100, "Año inválido"),
  ),
  mes: z.string().regex(/^(?:[1-9]|1[0-2])$/, "Seleccione el mes"),
  quincena: z.enum(["1", "2"]),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

const MESES = Array.from({ length: 12 }, (_, i) => {
  const nombre = nombreMes(i + 1);
  return { valor: String(i + 1), etiqueta: nombre.charAt(0).toUpperCase() + nombre.slice(1) };
});

/** Periodo en curso por defecto. */
function valoresIniciales(): Entrada {
  const [anio, mes, dia] = hoy().split("-").map(Number);
  return { tipoPeriodo: "QUINCENAL", anio, mes: String(mes), quincena: dia <= 15 ? "1" : "2" };
}

/** Fechas del periodo elegido (vista previa); `null` si los datos aún no son válidos. */
function fechasPeriodo(tipo: string, anio: unknown, mes: string, quincena: string): string | null {
  const numeroMes = Number(mes);
  if (typeof anio !== "number" || !Number.isInteger(anio) || anio < 2000 || anio > 2100 || !numeroMes) return null;
  const inicioMes = `${anio}-${String(numeroMes).padStart(2, "0")}-01`;
  const finMes = ultimoDiaMes(inicioMes);
  if (tipo !== "QUINCENAL") return rangoFechas(inicioMes, finMes);
  return quincena === "1"
    ? rangoFechas(inicioMes, `${inicioMes.slice(0, 8)}15`)
    : rangoFechas(`${inicioMes.slice(0, 8)}16`, finMes);
}

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
    defaultValues: valoresIniciales(),
  });

  const [tipoPeriodo, anio, mes, quincena] = useWatch({ control, name: ["tipoPeriodo", "anio", "mes", "quincena"] });
  const vistaPrevia = fechasPeriodo(tipoPeriodo, anio, mes, quincena);

  const enviar = handleSubmit((datos) => {
    const quincenal = datos.tipoPeriodo === "QUINCENAL";
    crear.mutate(
      {
        tipoPeriodo: datos.tipoPeriodo,
        anio: datos.anio,
        mes: Number(datos.mes),
        quincena: quincenal ? (datos.quincena === "1" ? 1 : 2) : undefined,
      },
      {
        onSuccess: (liquidacion) => {
          toast.success(`Liquidación calculada: ${nombrePeriodo(liquidacion)}`);
          onCerrar();
          router.push(`/nomina/${liquidacion.id}`);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  });

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva liquidación"
      descripcion="Se calcula la nómina de todos los trabajadores con vínculo en el periodo."
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
      <form id="form-liquidacion" onSubmit={enviar} className="grid grid-cols-2 gap-4" noValidate>
        <Field label="Tipo de periodo" error={errors.tipoPeriodo?.message} className="col-span-2">
          {(id) => (
            <Select id={id} {...register("tipoPeriodo")}>
              {opciones(TIPOS_PERIODO).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Año" error={errors.anio?.message}>
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="numeric"
              min={2000}
              max={2100}
              step={1}
              aria-invalid={!!errors.anio}
              {...register("anio", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Mes" error={errors.mes?.message}>
          {(id) => (
            <Select id={id} aria-invalid={!!errors.mes} {...register("mes")}>
              {MESES.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.etiqueta}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {tipoPeriodo === "QUINCENAL" && (
          <Field label="Quincena" error={errors.quincena?.message} className="col-span-2">
            {(id) => (
              <Select id={id} {...register("quincena")}>
                <option value="1">Primera (días 1 a 15)</option>
                <option value="2">Segunda (día 16 a fin de mes)</option>
              </Select>
            )}
          </Field>
        )}
        <p className="col-span-2 text-sm text-slate-600" aria-live="polite">
          {vistaPrevia ? (
            <>
              Periodo: <span className="font-medium text-slate-900">{vistaPrevia}</span>
            </>
          ) : (
            "Complete el año y el mes para ver las fechas del periodo."
          )}
        </p>
      </form>
    </Modal>
  );
}
