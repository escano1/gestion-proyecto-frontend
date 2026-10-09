"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { mensajeError } from "@/lib/errores";

/** Las descargas piden `responseType: "blob"`, así que el error JSON del API llega como Blob. */
async function mensajeDescarga(error: unknown): Promise<string> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const cuerpo: unknown = JSON.parse(await error.response.data.text());
      const mensaje = cuerpo && typeof cuerpo === "object" && "message" in cuerpo ? cuerpo.message : undefined;
      if (Array.isArray(mensaje)) return mensaje.join(". ");
      if (typeof mensaje === "string" && mensaje) return mensaje;
    } catch {
      // Cuerpo no JSON: se usa el mensaje genérico.
    }
  }
  return mensajeError(error, "No fue posible descargar el archivo");
}

/** Estado de carga por botón de descarga y errores en toast. */
export function useDescarga<T extends string>() {
  const [enCurso, setEnCurso] = useState<T | null>(null);

  const descargar = async (clave: T, accion: () => Promise<void>) => {
    setEnCurso(clave);
    try {
      await accion();
    } catch (error) {
      toast.error(await mensajeDescarga(error));
    } finally {
      setEnCurso(null);
    }
  };

  return { enCurso, descargar };
}
