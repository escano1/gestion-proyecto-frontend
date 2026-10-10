"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form-controls";
import { useGuardarUsuario, type DatosUsuario } from "@/features/catalogos/api";
import { cumplePolitica, POLITICA_PASSWORD } from "@/features/perfil/password";
import { mensajeError } from "@/lib/errores";
import { opciones } from "@/lib/etiquetas";
import { ETIQUETA_ROL } from "@/lib/permisos";
import { textoRequerido } from "@/lib/validacion";
import type { Usuario } from "@/types/api";

const base = z.object({
  nombre: textoRequerido("Ingrese el nombre", 150),
  // Se recorta antes de validar: los espacios al inicio o al final se descartan.
  email: z.string().trim().toLowerCase().min(1, "Ingrese el usuario"),
  rol: z.enum(["ADMIN", "GESTOR_PROYECTOS", "NOMINA", "CONSULTA"]),
  activo: z.boolean(),
  password: z.string(),
});

/** Contraseña obligatoria al crear; al editar, vacía significa "conservar la actual". */
const esquemaUsuario = (edicion: boolean) =>
  base.superRefine((d, ctx) => {
    if (!d.password) {
      if (!edicion) ctx.addIssue({ code: "custom", path: ["password"], message: "Ingrese una contraseña" });
    } else if (!cumplePolitica(d.password)) {
      ctx.addIssue({ code: "custom", path: ["password"], message: POLITICA_PASSWORD });
    }
  });

type Formulario = z.infer<typeof base>;

interface Props {
  usuario?: Usuario;
  /** El usuario editado es quien tiene la sesión: no puede cambiar su rol ni desactivarse. */
  esPropio: boolean;
  onCerrar: () => void;
}

/** Modal de creación/edición. Se monta al abrirse para partir siempre de los datos actuales. */
export function UsuarioForm({ usuario, esPropio, onCerrar }: Props) {
  const guardar = useGuardarUsuario();
  const edicion = Boolean(usuario);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulario>({
    resolver: zodResolver(esquemaUsuario(edicion)),
    defaultValues: {
      nombre: usuario?.nombre ?? "",
      email: usuario?.email ?? "",
      rol: usuario?.rol ?? "CONSULTA",
      activo: usuario?.activo ?? true,
      password: "",
    },
  });

  const enviar = handleSubmit(({ nombre, email, rol, activo, password }) => {
    const datos: DatosUsuario = usuario
      ? { nombre, ...(esPropio ? {} : { rol, activo }), ...(password ? { password } : {}) }
      : { nombre, email, rol, password };
    guardar.mutate(
      { id: usuario?.id, datos },
      {
        onSuccess: () => {
          toast.success(usuario ? "Usuario actualizado" : "Usuario creado");
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
      titulo={usuario ? "Editar usuario" : "Nuevo usuario"}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-usuario" cargando={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="form-usuario" onSubmit={enviar} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
        <Field label="Nombre completo" error={errors.nombre?.message} className="sm:col-span-2">
          {(id) => <Input id={id} autoComplete="off" aria-invalid={!!errors.nombre} {...register("nombre")} />}
        </Field>
        {usuario ? (
          <Field label="Usuario o correo" ayuda="No se puede modificar" className="sm:col-span-2">
            {(id) => <Input id={id} type="email" value={usuario.email} disabled readOnly />}
          </Field>
        ) : (
          <Field label="Usuario o correo" error={errors.email?.message} className="sm:col-span-2">
            {(id) => (
              <Input id={id} type="text" autoComplete="off" aria-invalid={!!errors.email} {...register("email")} />
            )}
          </Field>
        )}
        {esPropio && usuario ? (
          <Field label="Rol" ayuda="No puede cambiar su propio rol">
            {(id) => <Input id={id} value={ETIQUETA_ROL[usuario.rol]} disabled readOnly />}
          </Field>
        ) : (
          <Field label="Rol" error={errors.rol?.message}>
            {(id) => (
              <Select id={id} {...register("rol")}>
                {opciones(ETIQUETA_ROL).map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field
          label={usuario ? "Nueva contraseña (opcional)" : "Contraseña"}
          error={errors.password?.message}
          ayuda={usuario ? `Déjela vacía para conservar la actual. ${POLITICA_PASSWORD}` : POLITICA_PASSWORD}
        >
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
          )}
        </Field>
        {usuario && !esPropio && (
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <Checkbox {...register("activo")} />
            Usuario activo (puede iniciar sesión)
          </label>
        )}
      </form>
    </Modal>
  );
}
