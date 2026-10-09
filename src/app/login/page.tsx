"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap } from "lucide-react";
import { useIniciarSesion } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { mensajeError } from "@/lib/errores";

const esquema = z.object({
  // Recortar antes de validar: correos pegados con espacios son comunes.
  email: z.string().trim().toLowerCase().pipe(z.email("Correo inválido")),
  password: z.string().min(1, "Ingrese la contraseña"),
});

type Formulario = z.infer<typeof esquema>;

export default function PaginaLogin() {
  const router = useRouter();
  const iniciar = useIniciarSesion();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Formulario>({ resolver: zodResolver(esquema) });

  const enviar = handleSubmit((datos) =>
    iniciar.mutate(datos, { onSuccess: () => router.replace("/dashboard") }),
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-lg bg-acento-400 text-slate-900">
            <Zap className="size-6" aria-hidden />
          </span>
          <h1 className="text-xl font-semibold text-white">Gestión de Proyectos y Nómina</h1>
          <p className="text-sm text-slate-400">Ingrese con su cuenta corporativa</p>
        </div>
        {/* method="post": si se envía antes de hidratar, las credenciales nunca quedan en la URL. */}
        <form method="post" onSubmit={enviar} className="space-y-4 rounded-xl bg-white p-6 shadow-xl" noValidate>
          <Field label="Correo electrónico" error={errors.email?.message}>
            {(id) => (
              <Input id={id} type="email" autoComplete="username" autoFocus aria-invalid={!!errors.email} {...register("email")} />
            )}
          </Field>
          <Field label="Contraseña" error={errors.password?.message}>
            {(id) => (
              <Input id={id} type="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
            )}
          </Field>
          {iniciar.isError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {mensajeError(iniciar.error)}
            </p>
          )}
          <Button type="submit" className="w-full" cargando={iniciar.isPending}>
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  );
}
