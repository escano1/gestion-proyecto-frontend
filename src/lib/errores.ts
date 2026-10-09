import { isAxiosError } from "axios";
import type { ErrorApi } from "@/types/api";

/** Mensaje legible de un error del API (los mensajes del backend ya vienen en español). */
export function mensajeError(error: unknown, porDefecto = "Ocurrió un error inesperado"): string {
  if (isAxiosError<ErrorApi>(error)) {
    if (!error.response) return "No fue posible conectar con el servidor";
    const { message } = error.response.data ?? {};
    if (Array.isArray(message)) return message.join(". ");
    if (message) return message;
    if (error.response.status === 403) return "No tiene permisos para esta operación";
  }
  return error instanceof Error && error.message ? error.message : porDefecto;
}

export function estadoHttp(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
