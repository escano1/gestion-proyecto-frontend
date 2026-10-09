import { api } from "./api";

function nombreDesdeCabecera(disposicion: string | undefined): string | null {
  if (!disposicion) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposicion);
  if (utf8) return decodeURIComponent(utf8[1]);
  const simple = /filename="?([^";]+)"?/i.exec(disposicion);
  return simple ? simple[1] : null;
}

/** Descarga un archivo autenticado del API (PDF, Excel, adjuntos). */
export async function descargarArchivo(ruta: string, nombrePorDefecto: string): Promise<void> {
  const respuesta = await api.get<Blob>(ruta, { responseType: "blob" });
  const nombre = nombreDesdeCabecera(respuesta.headers["content-disposition"]) ?? nombrePorDefecto;
  const url = URL.createObjectURL(respuesta.data);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Abre en una pestaña nueva un archivo autenticado (imágenes, PDF). */
export async function abrirArchivo(ruta: string): Promise<void> {
  const ventana = window.open("", "_blank");
  const respuesta = await api.get<Blob>(ruta, { responseType: "blob" });
  const url = URL.createObjectURL(respuesta.data);
  if (ventana) ventana.location.href = url;
  else window.location.assign(url);
}
