"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useCambiarPassword } from "@/features/auth/api";
import { useSesion } from "@/lib/auth-store";
import { mensajeError } from "@/lib/errores";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { passwordSegura, POLITICA_PASSWORD } from "./password";

const esquema = z
  .object({
    passwordActual: z.string().min(1, "Ingrese su contraseña actual"),
    passwordNueva: passwordSegura("Ingrese la nueva contraseña"),
    confirmacion: z.string().min(1, "Confirme la nueva contraseña"),
  })
  .superRefine((d, ctx) => {
    if (d.confirmacion && d.confirmacion !== d.passwordNueva) {
      ctx.addIssue({ code: "custom", path: ["confirmacion"], message: "Las contraseñas no coinciden" });
    }
    if (d.passwordNueva && d.passwordNueva === d.passwordActual) {
      ctx.addIssue({ code: "custom", path: ["passwordNueva"], message: "Debe ser distinta de la actual" });
    }
  });

type Formulario = z.infer<typeof esquema>;

const VACIO: Formulario = { passwordActual: "", passwordNueva: "", confirmacion: "" };

export function CambiarPasswordForm() {
  const email = useSesion((s) => s.usuario?.email ?? "");
  const cambiar = useCambiarPassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Formulario>({ resolver: zodResolver(esquema), defaultValues: VACIO });

  const enviar = handleSubmit(({ passwordActual, passwordNueva }) => {
    cambiar.mutate(
      { passwordActual, passwordNueva },
      {
        onSuccess: () => {
          toast.success("Contraseña actualizada");
          reset(VACIO);
        },
        onError: (e) => toast.error(mensajeError(e)),
      },
    );
  });

  return (
    <form onSubmit={enviar} className="grid max-w-md grid-cols-1 gap-4" noValidate>
      {/* Usuario oculto para que los gestores de contraseñas asocien la cuenta. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <Field label="Contraseña actual" error={errors.passwordActual?.message}>
        {(id) => (
          <Input
            id={id}
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.passwordActual}
            {...register("passwordActual")}
          />
        )}
      </Field>
      <Field label="Nueva contraseña" error={errors.passwordNueva?.message} ayuda={POLITICA_PASSWORD}>
        {(id) => (
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.passwordNueva}
            {...register("passwordNueva")}
          />
        )}
      </Field>
      <Field label="Confirmar nueva contraseña" error={errors.confirmacion?.message}>
        {(id) => (
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmacion}
            {...register("confirmacion")}
          />
        )}
      </Field>
      <div>
        <Button type="submit" cargando={cambiar.isPending}>
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}
