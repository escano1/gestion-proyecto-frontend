// Lógica pura del módulo de proyectos (sin React): filtros, vencimientos, avance y validación de adjuntos.
import { esAdmin, puedeEscribir } from "@/lib/permisos";
import type { EstadoMaterial, Hito, Material, Proyecto, Rol } from "@/types/api";

// --- Búsqueda ---
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Búsqueda local por código, nombre o cliente (sin distinguir mayúsculas ni tildes). */
export function filtrarProyectos<T extends Pick<Proyecto, "codigo" | "nombre" | "cliente">>(
  proyectos: T[],
  texto: string,
): T[] {
  const termino = normalizar(texto.trim());
  if (!termino) return proyectos;
  return proyectos.filter((p) => [p.codigo, p.nombre, p.cliente].some((campo) => normalizar(campo).includes(termino)));
}

// --- Gráficos ---
/**
 * Etiqueta de eje para un tipo de hora: quita el prefijo "Hora " y, si supera `max` caracteres,
 * la parte en 2 líneas lo más parejas posible, cortando en un espacio o después de "/"
 * ("Hora extra dominical/festiva nocturna" → ["Extra dominical/", "festiva nocturna"]).
 */
export function etiquetaEnLineas(nombre: string, max = 22): string[] {
  const limpio = nombre.trim().replace(/^hora\s+/i, "");
  const texto = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  if (texto.length <= max) return [texto];

  let mejor: [string, string] | null = null;
  for (let i = 1; i < texto.length; i++) {
    const corte = texto[i - 1] === "/" || texto[i] === " ";
    if (!corte) continue;
    const linea1 = texto.slice(0, i).trimEnd();
    const linea2 = texto.slice(i).trimStart();
    if (!linea1 || !linea2) continue;
    if (!mejor || Math.max(linea1.length, linea2.length) < Math.max(mejor[0].length, mejor[1].length)) {
      mejor = [linea1, linea2];
    }
  }
  return mejor ?? [texto]; // una sola palabra muy larga: no se parte
}

// --- Materiales ---
const FLUJO_MATERIAL: EstadoMaterial[] = ["PENDIENTE", "SOLICITADO", "ENTREGADO", "INSTALADO"];

/** Material aún no entregado cuya fecha requerida ya pasó (misma regla que `/reportes/pendientes`). */
export function materialVencido(m: Pick<Material, "estado" | "fechaRequerida">, fechaHoy: string): boolean {
  return (m.estado === "PENDIENTE" || m.estado === "SOLICITADO") && m.fechaRequerida !== null && m.fechaRequerida < fechaHoy;
}

/** Siguiente estado del flujo PENDIENTE → SOLICITADO → ENTREGADO → INSTALADO (null si ya terminó). */
export function siguienteEstadoMaterial(estado: EstadoMaterial): EstadoMaterial | null {
  const indice = FLUJO_MATERIAL.indexOf(estado);
  return indice >= 0 ? (FLUJO_MATERIAL[indice + 1] ?? null) : null;
}

// --- Números ---
/** Máximo 2 decimales (regla del API para cantidades, pesos y montos). */
export const tieneMaxDosDecimales = (valor: number) => Math.abs(Math.round(valor * 100) - valor * 100) < 1e-6;

const redondear2 = (valor: number) => Math.round(valor * 100) / 100;

/** Suma de pesos de los hitos; el avance solo es representativo si da 100. */
export const sumaPesos = (hitos: Pick<Hito, "peso">[]) => redondear2(hitos.reduce((total, h) => total + h.peso, 0));

export const pesosCompletos = (suma: number) => Math.abs(suma - 100) < 0.005;

/** Porcentaje del presupuesto consumido por la mano de obra (null si no hay presupuesto). */
export function porcentajeEjecucion(costo: number, presupuesto: number | null): number | null {
  if (presupuesto === null || presupuesto <= 0) return null;
  return redondear2((costo / presupuesto) * 100);
}

// --- Bitácora ---
export const MAX_ADJUNTOS_POR_ENTRADA = 5;
export const TAMANO_MAXIMO_MB = 10;
export const TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024;

/** Extensión → MIME aceptado por el API. */
const TIPOS_POR_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
const TIPOS_PERMITIDOS = new Set(Object.values(TIPOS_POR_EXTENSION));

/** Valor del atributo `accept` del selector de archivos. */
export const ACEPTAR_ADJUNTOS = [
  ...Object.keys(TIPOS_POR_EXTENSION).map((ext) => `.${ext}`),
  ...TIPOS_PERMITIDOS,
].join(",");

type ArchivoLigero = Pick<File, "name" | "size" | "type">;

const extension = (nombre: string) => {
  const punto = nombre.lastIndexOf(".");
  return punto >= 0 ? nombre.slice(punto + 1).toLowerCase() : "";
};

/**
 * MIME con el que se enviará el archivo: el del navegador si es permitido; si el navegador no lo
 * reconoce (p. ej. .docx sin Office instalado), se deduce de la extensión. Null si no es aceptado.
 */
export function tipoAdjunto(archivo: Pick<File, "name" | "type">): string | null {
  if (TIPOS_PERMITIDOS.has(archivo.type)) return archivo.type;
  if (archivo.type && archivo.type !== "application/octet-stream") return null;
  return TIPOS_POR_EXTENSION[extension(archivo.name)] ?? null;
}

/** Errores de validación en cliente (mismas reglas del API). Vacío si todo es válido. */
export function validarArchivos(archivos: ArchivoLigero[], existentes = 0): string[] {
  const errores: string[] = [];
  if (existentes + archivos.length > MAX_ADJUNTOS_POR_ENTRADA) {
    errores.push(
      existentes > 0
        ? `Una entrada admite máximo ${MAX_ADJUNTOS_POR_ENTRADA} adjuntos (ya tiene ${existentes})`
        : `Seleccione máximo ${MAX_ADJUNTOS_POR_ENTRADA} archivos`,
    );
  }
  for (const archivo of archivos) {
    if (!tipoAdjunto(archivo)) {
      errores.push(`"${archivo.name}": tipo no permitido (JPG, PNG, WEBP, PDF, DOCX o XLSX)`);
    } else if (archivo.size === 0) {
      errores.push(`"${archivo.name}" está vacío`);
    } else if (archivo.size > TAMANO_MAXIMO_BYTES) {
      errores.push(`"${archivo.name}" supera el máximo de ${TAMANO_MAXIMO_MB} MB`);
    }
  }
  return errores;
}

/** Garantiza que cada archivo viaje con el MIME correcto (el API lo valida contra su firma). */
export function prepararArchivos(archivos: File[]): File[] {
  return archivos.map((archivo) => {
    const tipo = tipoAdjunto(archivo);
    return tipo && tipo !== archivo.type
      ? new File([archivo], archivo.name, { type: tipo, lastModified: archivo.lastModified })
      : archivo;
  });
}

/** Une selecciones sucesivas sin duplicar el mismo archivo. */
export function agregarSinDuplicados(actuales: File[], nuevos: File[]): File[] {
  const clave = (a: File) => `${a.name}|${a.size}|${a.lastModified}`;
  const vistos = new Set(actuales.map(clave));
  return [...actuales, ...nuevos.filter((a) => !vistos.has(clave(a)))];
}

/** Imágenes y PDF se abren en el navegador; el resto se descarga. */
export const seAbreEnNavegador = (mimeType: string) => mimeType.startsWith("image/") || mimeType === "application/pdf";

/** Además del rol de escritura, solo un ADMIN o el autor pueden borrar una entrada o sus adjuntos. */
export function puedeEliminarEntrada(usuario: { id: number; rol: Rol } | null | undefined, autorId: number): boolean {
  if (!usuario || !puedeEscribir(usuario.rol, "operacionProyecto")) return false;
  return esAdmin(usuario.rol) || usuario.id === autorId;
}
