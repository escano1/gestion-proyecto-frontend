"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form-controls";
import { useGuardarTrabajador } from "./api";
import { mensajeError } from "@/lib/errores";
import { opciones, TIPOS_CONTRATO, TIPOS_DOCUMENTO, TIPOS_JORNADA, TIPOS_SALARIO } from "@/lib/etiquetas";
import { fechaOpcional, fechaRequerida, numeroOpcional, numeroRequerido, textoOpcional, textoRequerido } from "@/lib/validacion";
import { hoy } from "@/lib/fechas";
import type { Trabajador } from "@/types/api";

const esquema = z
  .object({
    nombre: textoRequerido("Ingrese el nombre", 150),
    tipoDocumento: z.enum(["CC", "CE", "PA", "PPT", "TI"]),
    numeroDocumento: textoRequerido("Ingrese el número de documento", 30),
    cargo: textoRequerido("Ingrese el cargo", 100),
    tipoSalario: z.enum(["MENSUAL", "POR_HORA"]),
    salarioBase: numeroRequerido(z.number({ error: "Ingrese el salario" }).positive("Debe ser mayor a 0")),
    tipoContrato: z.enum(["INDEFINIDO", "FIJO", "OBRA_LABOR", "APRENDIZAJE"]),
    tipoJornada: z.enum(["COMPLETA", "PARCIAL"]),
    horasSemanales: numeroOpcional(),
    aplicaAuxilioTransporte: z.boolean(),
    fechaIngreso: fechaRequerida(),
    fechaRetiro: fechaOpcional(),
    estado: z.enum(["ACTIVO", "INACTIVO"]),
    email: textoOpcional(160).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Correo inválido"),
    telefono: textoOpcional(30),
    eps: textoOpcional(100),
    fondoPension: textoOpcional(100),
  })
  .superRefine((d, ctx) => {
    if (d.tipoJornada === "PARCIAL" && (d.horasSemanales == null || d.horasSemanales < 1 || d.horasSemanales > 48)) {
      ctx.addIssue({ code: "custom", path: ["horasSemanales"], message: "Indique las horas semanales (1 a 48)" });
    }
    if (d.estado === "INACTIVO" && !d.fechaRetiro) {
      ctx.addIssue({ code: "custom", path: ["fechaRetiro"], message: "Obligatoria para trabajadores inactivos" });
    }
    if (d.fechaRetiro && d.fechaRetiro < d.fechaIngreso) {
      ctx.addIssue({ code: "custom", path: ["fechaRetiro"], message: "Debe ser posterior a la fecha de ingreso" });
    }
  });

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(t?: Trabajador): Entrada {
  return {
    nombre: t?.nombre ?? "",
    tipoDocumento: t?.tipoDocumento ?? "CC",
    numeroDocumento: t?.numeroDocumento ?? "",
    cargo: t?.cargo ?? "",
    tipoSalario: t?.tipoSalario ?? "MENSUAL",
    salarioBase: t?.salarioBase,
    tipoContrato: t?.tipoContrato ?? "INDEFINIDO",
    tipoJornada: t?.tipoJornada ?? "COMPLETA",
    horasSemanales: t?.horasSemanales ?? undefined,
    aplicaAuxilioTransporte: t?.aplicaAuxilioTransporte ?? true,
    fechaIngreso: t?.fechaIngreso ?? hoy(),
    fechaRetiro: t?.fechaRetiro ?? "",
    estado: t?.estado ?? "ACTIVO",
    email: t?.email ?? "",
    telefono: t?.telefono ?? "",
    eps: t?.eps ?? "",
    fondoPension: t?.fondoPension ?? "",
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
    control,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    values: valoresIniciales(trabajador),
  });

  const [jornada, tipoSalario] = useWatch({ control, name: ["tipoJornada", "tipoSalario"] });

  const enviar = handleSubmit((datos) => {
    const cuerpo = { ...datos, horasSemanales: datos.tipoJornada === "PARCIAL" ? datos.horasSemanales : null };
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
        <Field label="Tipo de contrato" error={errors.tipoContrato?.message}>
          {(id) => (
            <Select id={id} {...register("tipoContrato")}>
              {opciones(TIPOS_CONTRATO).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Tipo de salario" error={errors.tipoSalario?.message}>
          {(id) => (
            <Select id={id} {...register("tipoSalario")}>
              {opciones(TIPOS_SALARIO).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field
          label={tipoSalario === "POR_HORA" ? "Valor de la hora (COP)" : "Salario mensual (COP)"}
          error={errors.salarioBase?.message}
        >
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
        <Field label="Jornada" error={errors.tipoJornada?.message}>
          {(id) => (
            <Select id={id} {...register("tipoJornada")}>
              {opciones(TIPOS_JORNADA).map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {jornada === "PARCIAL" && (
          <Field label="Horas semanales" error={errors.horasSemanales?.message}>
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="decimal"
                step="0.5"
                aria-invalid={!!errors.horasSemanales}
                {...register("horasSemanales", { valueAsNumber: true })}
              />
            )}
          </Field>
        )}
        <Field label="Fecha de ingreso" error={errors.fechaIngreso?.message}>
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaIngreso} {...register("fechaIngreso")} />}
        </Field>
        <Field label="Estado" error={errors.estado?.message}>
          {(id) => (
            <Select id={id} {...register("estado")}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </Select>
          )}
        </Field>
        <Field label="Fecha de retiro" error={errors.fechaRetiro?.message}>
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.fechaRetiro} {...register("fechaRetiro")} />}
        </Field>
        <Field label="EPS" error={errors.eps?.message}>
          {(id) => <Input id={id} {...register("eps")} />}
        </Field>
        <Field label="Fondo de pensión" error={errors.fondoPension?.message}>
          {(id) => <Input id={id} {...register("fondoPension")} />}
        </Field>
        <Field label="Teléfono" error={errors.telefono?.message}>
          {(id) => <Input id={id} type="tel" {...register("telefono")} />}
        </Field>
        <Field label="Correo electrónico" error={errors.email?.message} className="md:col-span-2">
          {(id) => <Input id={id} type="email" aria-invalid={!!errors.email} {...register("email")} />}
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
          <Checkbox {...register("aplicaAuxilioTransporte")} />
          Aplica auxilio de transporte
        </label>
      </form>
    </Modal>
  );
}
