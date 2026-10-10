"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import { useGuardarAsignacion, useTrabajadores } from "@/features/personal/api";
import { mensajeError } from "@/lib/errores";
import { numeroRequerido, textoOpcional } from "@/lib/validacion";
import type { Asignacion } from "@/types/api";

const esquema = z.object({
  trabajadorId: numeroRequerido(
    z.number({ error: "Seleccione un trabajador" }).int().positive("Seleccione un trabajador"),
  ),
  rolEnProyecto: textoOpcional(100),
});

type Entrada = z.input<typeof esquema>;
type Salida = z.output<typeof esquema>;

function valoresIniciales(a?: Asignacion): Entrada {
  return {
    trabajadorId: a?.trabajadorId ?? "",
    rolEnProyecto: a?.rolEnProyecto ?? "",
  };
}

interface Props {
  proyectoId: number;
  asignacion?: Asignacion;
  onCerrar: () => void;
}

export function AsignacionForm({ proyectoId, asignacion, onCerrar }: Props) {
  const guardar = useGuardarAsignacion();
  const trabajadores = useTrabajadores({ estado: "ACTIVO" });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Entrada, unknown, Salida>({
    resolver: zodResolver(esquema),
    values: valoresIniciales(asignacion),
  });

  const trabajadorId = useWatch({ control, name: "trabajadorId" });
  const seleccionado = trabajadores.data?.find((t) => t.id === Number(trabajadorId));

  const enviar = handleSubmit(({ trabajadorId: idTrabajador, rolEnProyecto }) => {
    const comunes = { rolEnProyecto: rolEnProyecto ?? null };
    guardar.mutate(
      asignacion
        ? { id: asignacion.id, datos: comunes }
        : { datos: { ...comunes, trabajadorId: idTrabajador, proyectoId } },
      {
        onSuccess: () => {
          toast.success(asignacion ? "Asignación actualizada" : "Trabajador asignado al proyecto");
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
      titulo={asignacion ? "Editar asignación" : "Asignar trabajador"}
      descripcion={asignacion ? `${asignacion.trabajador.nombre} · ${asignacion.trabajador.cargo}` : undefined}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-asignacion" cargando={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-asignacion" onSubmit={enviar} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        {!asignacion && (
          <Field
            label="Trabajador"
            error={errors.trabajadorId?.message ?? (trabajadores.isError ? mensajeError(trabajadores.error) : undefined)}
            ayuda={seleccionado ? seleccionado.cargo : undefined}
            className="sm:col-span-2"
          >
            {(id) => (
              <Select
                id={id}
                aria-invalid={!!errors.trabajadorId}
                disabled={trabajadores.isPending}
                {...register("trabajadorId", { valueAsNumber: true })}
              >
                <option value="">{trabajadores.isPending ? "Cargando trabajadores…" : "Seleccione…"}</option>
                {trabajadores.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} — {t.cargo}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Rol en el proyecto" error={errors.rolEnProyecto?.message} ayuda="Opcional, p. ej. Residente de obra" className="sm:col-span-2">
          {(id) => <Input id={id} aria-invalid={!!errors.rolEnProyecto} {...register("rolEnProyecto")} />}
        </Field>
      </form>
    </Modal>
  );
}
