"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorState, Spinner } from "@/components/ui/display";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { useCatalogoParametros, useCrearParametro } from "@/features/catalogos/api";
import { mensajeError } from "@/lib/errores";
import { hoy } from "@/lib/fechas";
import { fechaRequerida, numeroRequerido, textoOpcional } from "@/lib/validacion";
import type { CodigoParametro } from "@/types/api";
import { aValorApi, CODIGOS_PARAMETRO, ETIQUETA_UNIDAD, formatoValorParametro, type GrupoParametro } from "./parametros";

const esquema = z.object({
  codigo: z.enum(CODIGOS_PARAMETRO, { error: "Seleccione el parámetro" }),
  valor: numeroRequerido(z.number({ error: "Ingrese el valor" }).min(0, "No puede ser negativo")),
  vigenteDesde: fechaRequerida(),
  norma: textoOpcional(200),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

interface Props {
  /** Parámetro preseleccionado (al agregar desde su historial). */
  codigoInicial?: CodigoParametro;
  /** Historial agrupado, para mostrar el valor vigente del parámetro elegido. */
  grupos: GrupoParametro[];
  onCerrar: () => void;
}

/** Modal "Nueva vigencia". Se monta al abrirse, así cada apertura parte de un formulario limpio. */
export function ParametroForm({ codigoInicial, grupos, onCerrar }: Props) {
  const catalogo = useCatalogoParametros();
  const crear = useCrearParametro();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    defaultValues: { codigo: codigoInicial ?? "SMMLV", vigenteDesde: hoy(), norma: "" },
  });

  const codigo = useWatch({ control, name: "codigo" });
  const definicion = catalogo.data?.find((d) => d.codigo === codigo);
  const unidad = definicion?.unidad ?? "PESOS";
  const grupo = grupos.find((g) => g.codigo === codigo);
  const vigente = grupo?.vigencias.find((v) => v.id === grupo.idVigente);

  const enviar = handleSubmit((datos) => {
    crear.mutate(
      {
        codigo: datos.codigo,
        valor: aValorApi(datos.valor, unidad),
        vigenteDesde: datos.vigenteDesde,
        norma: datos.norma ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Vigencia registrada");
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
      titulo="Nueva vigencia"
      descripcion="Registre el valor de un parámetro legal a partir de una fecha"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-parametro" cargando={crear.isPending} disabled={!catalogo.data}>
            Guardar
          </Button>
        </>
      }
    >
      {catalogo.isPending ? (
        <Spinner />
      ) : catalogo.isError ? (
        <ErrorState mensaje={mensajeError(catalogo.error)} reintentar={() => catalogo.refetch()} />
      ) : (
        <form id="form-parametro" onSubmit={enviar} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <Field
            label="Parámetro"
            error={errors.codigo?.message}
            ayuda={definicion?.descripcion}
            className="sm:col-span-2"
          >
            {(id) => (
              <Select id={id} aria-invalid={!!errors.codigo} {...register("codigo")}>
                {catalogo.data.map((d) => (
                  <option key={d.codigo} value={d.codigo}>
                    {d.nombre}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label={`Valor (${ETIQUETA_UNIDAD[unidad]})`}
            error={errors.valor?.message}
            ayuda={
              unidad === "FRACCION"
                ? "Escriba el porcentaje: 90 equivale a 90 %"
                : vigente && `Vigente hoy: ${formatoValorParametro(vigente.valor, unidad)}`
            }
          >
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                aria-invalid={!!errors.valor}
                {...register("valor", { valueAsNumber: true })}
              />
            )}
          </Field>
          <Field label="Vigente desde" error={errors.vigenteDesde?.message}>
            {(id) => <Input id={id} type="date" aria-invalid={!!errors.vigenteDesde} {...register("vigenteDesde")} />}
          </Field>
          <Field
            label="Norma"
            error={errors.norma?.message}
            ayuda="Decreto o resolución que fija el valor (opcional)"
            className="sm:col-span-2"
          >
            {(id) => <Input id={id} aria-invalid={!!errors.norma} {...register("norma")} />}
          </Field>
          {unidad === "FRACCION" && vigente && (
            <p className="text-xs text-slate-500 sm:col-span-2">
              Vigente hoy: {formatoValorParametro(vigente.valor, unidad)}
            </p>
          )}
          <p className="flex gap-2 rounded-md bg-marca-50 p-3 text-xs text-marca-800 sm:col-span-2">
            <Info className="size-4 shrink-0" aria-hidden />
            El valor aplica a horas y nóminas con fecha igual o posterior a la vigencia. Las liquidaciones en borrador
            afectadas quedarán marcadas para recálculo.
          </p>
        </form>
      )}
    </Modal>
  );
}
