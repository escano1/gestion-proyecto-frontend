// Operación de proyectos: materiales, herramientas, hitos/avance y bitácora.
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, parametros } from "@/lib/api";
import type {
  AvanceProyecto,
  EntradaBitacora,
  EstadoHerramienta,
  EstadoMaterial,
  Herramienta,
  Hito,
  Material,
} from "@/types/api";

const claveOperacion = (proyectoId: number | undefined, recurso: string) => ["operacion", proyectoId, recurso];

function invalidar(qc: QueryClient, proyectoId: number | undefined, recurso: string) {
  qc.invalidateQueries({ queryKey: claveOperacion(proyectoId, recurso) });
  qc.invalidateQueries({ queryKey: claveOperacion(proyectoId, "avance") });
  qc.invalidateQueries({ queryKey: ["reportes"] });
}

// --- Materiales ---
export interface DatosMaterial {
  nombre?: string;
  descripcion?: string | null;
  unidadMedida?: string;
  cantidadSolicitada?: number;
  cantidadEntregada?: number;
  estado?: EstadoMaterial;
  fechaSolicitud?: string;
  fechaRequerida?: string | null;
  fechaEntrega?: string | null;
  observaciones?: string | null;
}

export function useMateriales(proyectoId: number | undefined, estado?: EstadoMaterial) {
  return useQuery({
    queryKey: [...claveOperacion(proyectoId, "materiales"), estado ?? "todos"],
    queryFn: async () =>
      (await api.get<Material[]>(`/proyectos/${proyectoId}/materiales`, { params: parametros({ estado }) })).data,
    enabled: Boolean(proyectoId),
  });
}

export function useGuardarMaterial(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: number; datos: DatosMaterial }) =>
      id
        ? (await api.patch<Material>(`/materiales/${id}`, datos)).data
        : (await api.post<Material>(`/proyectos/${proyectoId}/materiales`, datos)).data,
    onSuccess: () => invalidar(qc, proyectoId, "materiales"),
  });
}

export function useEliminarMaterial(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/materiales/${id}`);
    },
    onSuccess: () => invalidar(qc, proyectoId, "materiales"),
  });
}

// --- Herramientas ---
export interface DatosHerramienta {
  nombre?: string;
  codigo?: string | null;
  cantidad?: number;
  responsableId?: number | null;
  fechaAsignacion?: string;
  fechaDevolucionPrevista?: string | null;
  fechaDevolucion?: string | null;
  estado?: EstadoHerramienta;
  observaciones?: string | null;
}

export function useHerramientas(proyectoId: number | undefined, estado?: EstadoHerramienta) {
  return useQuery({
    queryKey: [...claveOperacion(proyectoId, "herramientas"), estado ?? "todas"],
    queryFn: async () =>
      (await api.get<Herramienta[]>(`/proyectos/${proyectoId}/herramientas`, { params: parametros({ estado }) }))
        .data,
    enabled: Boolean(proyectoId),
  });
}

export function useGuardarHerramienta(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: number; datos: DatosHerramienta }) =>
      id
        ? (await api.patch<Herramienta>(`/herramientas/${id}`, datos)).data
        : (await api.post<Herramienta>(`/proyectos/${proyectoId}/herramientas`, datos)).data,
    onSuccess: () => invalidar(qc, proyectoId, "herramientas"),
  });
}

export function useEliminarHerramienta(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/herramientas/${id}`);
    },
    onSuccess: () => invalidar(qc, proyectoId, "herramientas"),
  });
}

// --- Hitos y avance ---
export interface DatosHito {
  nombre?: string;
  descripcion?: string | null;
  orden?: number;
  fechaPlaneada?: string;
  fechaReal?: string | null;
  peso?: number;
  porcentajeAvance?: number;
}

export function useHitos(proyectoId: number | undefined) {
  return useQuery({
    queryKey: claveOperacion(proyectoId, "hitos"),
    queryFn: async () => (await api.get<Hito[]>(`/proyectos/${proyectoId}/hitos`)).data,
    enabled: Boolean(proyectoId),
  });
}

export function useAvanceProyecto(proyectoId: number | undefined) {
  return useQuery({
    queryKey: claveOperacion(proyectoId, "avance"),
    queryFn: async () => (await api.get<AvanceProyecto>(`/proyectos/${proyectoId}/avance`)).data,
    enabled: Boolean(proyectoId),
  });
}

export function useGuardarHito(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: number; datos: DatosHito }) =>
      id
        ? (await api.patch<Hito>(`/hitos/${id}`, datos)).data
        : (await api.post<Hito>(`/proyectos/${proyectoId}/hitos`, datos)).data,
    onSuccess: () => invalidar(qc, proyectoId, "hitos"),
  });
}

export function useEliminarHito(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/hitos/${id}`);
    },
    onSuccess: () => invalidar(qc, proyectoId, "hitos"),
  });
}

// --- Bitácora ---
export function useBitacora(proyectoId: number | undefined, rango?: { desde?: string; hasta?: string }) {
  return useQuery({
    queryKey: [...claveOperacion(proyectoId, "bitacora"), rango ?? {}],
    queryFn: async () =>
      (await api.get<EntradaBitacora[]>(`/proyectos/${proyectoId}/bitacora`, { params: parametros(rango) })).data,
    enabled: Boolean(proyectoId),
  });
}

export interface DatosEntradaBitacora {
  fecha: string;
  descripcion: string;
  observaciones?: string | null;
  archivos?: File[];
}

export function useCrearEntradaBitacora(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fecha, descripcion, observaciones, archivos = [] }: DatosEntradaBitacora) => {
      const formulario = new FormData();
      formulario.append("fecha", fecha);
      formulario.append("descripcion", descripcion);
      if (observaciones) formulario.append("observaciones", observaciones);
      archivos.forEach((archivo) => formulario.append("archivos", archivo));
      return (await api.post<EntradaBitacora>(`/proyectos/${proyectoId}/bitacora`, formulario)).data;
    },
    onSuccess: () => invalidar(qc, proyectoId, "bitacora"),
  });
}

export function useAgregarAdjuntos(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entradaId, archivos }: { entradaId: number; archivos: File[] }) => {
      const formulario = new FormData();
      archivos.forEach((archivo) => formulario.append("archivos", archivo));
      return (await api.post<EntradaBitacora>(`/bitacora/${entradaId}/adjuntos`, formulario)).data;
    },
    onSuccess: () => invalidar(qc, proyectoId, "bitacora"),
  });
}

export function useEliminarEntradaBitacora(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bitacora/${id}`);
    },
    onSuccess: () => invalidar(qc, proyectoId, "bitacora"),
  });
}

export function useEliminarAdjunto(proyectoId: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bitacora/adjuntos/${id}`);
    },
    onSuccess: () => invalidar(qc, proyectoId, "bitacora"),
  });
}

export const rutaAdjunto = (id: number) => `/bitacora/adjuntos/${id}`;
