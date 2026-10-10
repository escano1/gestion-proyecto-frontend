"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { useGuardarTrabajador, type DatosTrabajador } from "./api";
import { mensajeError } from "@/lib/errores";
import { opciones, TIPOS_DOCUMENTO } from "@/lib/etiquetas";
import { numeroRequerido, textoOpcional, textoRequerido } from "@/lib/validacion";
import type { Trabajador } from "@/types/api";

// Valores por defecto para trabajadores nuevos; en edición se conservan los valores ya guardados
// (este formulario simplificado no permite cambiar contrato, tipo de salario, jornada ni afiliaciones).
const TIPO_SALARIO_DEFECTO = "MENSUAL";
const TIPO_CONTRATO_DEFECTO = "INDEFINIDO";
const TIPO_JORNADA_DEFECTO = "COMPLETA";

const esquema = z.object({
  nombre: textoRequerido("Ingrese el nombre", 150),
  tipoDocumento: z.enum(["CC", "CE", "PA", "PPT", "TI"]),
  numeroDocumento: textoRequerido("Ingrese el número de documento", 30),
  cargo: textoRequerido("Ingrese el cargo", 100),
  salarioBase: numeroRequerido(z.number({ error: "Ingrese el salario" }).positive("Debe ser mayor a 0")),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
  telefono: textoOpcional(30),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(t?: Trabajador): Entrada {
  return {
    nombre: t?.nombre ?? "",
    tipoDocumento: t?.tipoDocumento ?? "CC",
    numeroDocumento: t?.numeroDocumento ?? "",
    cargo: t?.cargo ?? "",
    salarioBase: t?.salarioBase,
    estado: t?.estado ?? "ACTIVO",
    telefono: t?.telefono ?? "",
  };
}

interface Props {
  abierto: boolean;
  trabajador?: Trabajador;
  onCerrar: () => void;
}

export function TrabajadorForm({ abierto, trabajador, onCerrar }: Props) {
  const guardar = useGuardarTrabajador();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    values: valoresIniciales(trabajador),
  });

  const enviar = handleSubmit((datos) => {
    // Campos fuera de este formulario simplificado: se conservan tal cual al editar
    // y se fijan en valores por defecto al crear un trabajador nuevo.
    const cuerpo: Partial<DatosTrabajador> = {
      ...datos,
      tipoSalario: trabajador?.tipoSalario ?? TIPO_SALARIO_DEFECTO,
      tipoContrato: trabajador?.tipoContrato ?? TIPO_CONTRATO_DEFECTO,
      tipoJornada: trabajador?.tipoJornada ?? TIPO_JORNADA_DEFECTO,
      horasSemanales: trabajador?.horasSemanales ?? null,
      email: trabajador?.email ?? null,
      eps: trabajador?.eps ?? null,
      fondoPension: trabajador?.fondoPension ?? null,
    };
    guardar.mutate(
      { id: trabajador?.id, datos: cuerpo },
      {
        onSuccess: () => {
          toast.success(trabajador ? "Trabajador actualizado" : "Trabajador creado");
          onCerrar();
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  });

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={trabajador ? "Editar trabajador" : "Nuevo trabajador"}
      ancho="lg"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-trabajador" cargando={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-trabajador" onSubmit={enviar} className="grid grid-cols-1 gap-4 md:grid-cols-3" noValidate>
        <Field label="Nombre completo" error={errors.nombre?.message} className="md:col-span-2">
          {(id) => <Input id={id} aria-invalid={!!errors.nombre} {...register("nombre")} />}
        </Field>
        <Field label="Cargo" error={errors.cargo?.message}>
          {(id) => <Input id={id} aria-invalid={!!errors.cargo} {...register("cargo")} />}
        </Field>
        <Field label="Tipo de documento" error={errors.tipoDocumento?.message}>
          {(id) => (
            <Select id={id} {...register("tipoDocumento")}>
              {opciones(TIPOS_DOCUMENTO).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Número de documento" error={errors.numeroDocumento?.message}>
          {(id) => <Input id={id} aria-invalid={!!errors.numeroDocumento} {...register("numeroDocumento")} />}
        </Field>
        <Field label="Salario mensual (COP)" error={errors.salarioBase?.message}>
          {(id) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              aria-invalid={!!errors.salarioBase}
              {...register("salarioBase", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Estado" error={errors.estado?.message}>
          {(id) => (
            <Select id={id} {...register("estado")}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </Select>
          )}
        </Field>
        <Field label="Teléfono" error={errors.telefono?.message}>
          {(id) => <Input id={id} type="tel" {...register("telefono")} />}
        </Field>
      </form>
    </Modal>
  );
}
