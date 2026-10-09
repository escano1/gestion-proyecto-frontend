import { z } from "zod";

/** Política de contraseñas del API: mínimo 8 caracteres, con al menos una letra y un número. */
export const POLITICA_PASSWORD = "Mínimo 8 caracteres, con al menos una letra y un número";

export function cumplePolitica(password: string): boolean {
  return password.length >= 8 && /\p{L}/u.test(password) && /\d/.test(password);
}

export const passwordSegura = (mensajeVacio = "Ingrese la contraseña") =>
  z.string().min(1, mensajeVacio).refine(cumplePolitica, POLITICA_PASSWORD);
