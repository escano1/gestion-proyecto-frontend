import { z } from "zod";

/** Política de contraseñas del API: solo se exige que no esté vacía. */
export const POLITICA_PASSWORD = "Cualquier contraseña no vacía";

export function cumplePolitica(password: string): boolean {
  return password.length > 0;
}

export const passwordSegura = (mensajeVacio = "Ingrese la contraseña") =>
  z.string().min(1, mensajeVacio).refine(cumplePolitica, POLITICA_PASSWORD);
