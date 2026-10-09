import { z } from "zod";

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const vacioAIndefinido = (valor: unknown) =>
  valor === "" || valor === null || (typeof valor === "number" && Number.isNaN(valor)) ? undefined : valor;

/** Texto obligatorio recortado. */
export const textoRequerido = (mensaje = "Campo obligatorio", max = 255) =>
  z.string().trim().min(1, mensaje).max(max, `Máximo ${max} caracteres`);

/** Texto opcional: cadena vacía → null (permite limpiar el campo en un PATCH). */
export const textoOpcional = (max = 255) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const fechaRequerida = (mensaje = "Seleccione una fecha") =>
  z.string().regex(FORMATO_FECHA, mensaje);

/** Fecha opcional: vacía → null. */
export const fechaOpcional = () =>
  z
    .string()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || FORMATO_FECHA.test(v), "Fecha inválida")
    .nullable()
    .optional();

/**
 * Número obligatorio desde inputs con `valueAsNumber` (vacío/NaN → "requerido").
 * Ej.: numeroRequerido(z.number({ error: "Ingrese el salario" }).positive("Debe ser mayor a 0"))
 */
export const numeroRequerido = (esquema: z.ZodNumber = z.number({ error: "Ingrese un número" })) =>
  z.preprocess(vacioAIndefinido, esquema);

/** Número opcional: vacío → null. */
export const numeroOpcional = (esquema: z.ZodNumber = z.number({ error: "Número inválido" })) =>
  z.preprocess((v) => vacioAIndefinido(v) ?? null, esquema.nullable());
