// Trabajadores, proyectos y asignaciones.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, parametros } from "@/lib/api";
import type {
  Asignacion,
  EstadoProyecto,
  EstadoTrabajador,
  Proyecto,
  TipoContrato,
  TipoDocumento,
  TipoJornada,
  TipoSalario,
  Trabajador,
} from "@/types/api";

// --- Trabajadores ---
export const claveTrabajadores = ["trabajadores"] as const;

export function useTrabajadores(filtros?: { estado?: EstadoTrabajador; q?: string }) {
  return useQuery({
    queryKey: [...claveTrabajadores, "lista", filtros ?? {}],
    queryFn: async () => (await api.get<Trabajador[]>("/trabajadores", { params: parametros(filtros) })).data,
  });
}

export function useTrabajador(id: number | undefined) {
  return useQuery({
    queryKey: [...claveTrabajadores, id],
    queryFn: async () => (await api.get<Trabajador>(`/trabajadores/${id}`)).data,
    enabled: Boolean(id),
  });
}

export interface DatosTrabajador {
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  cargo: string;
  tipoSalario: TipoSalario;
  salarioBase: number;
  tipoContrato: TipoContrato;
  tipoJornada: TipoJornada;
  horasSemanales?: number | null;
  estado: EstadoTrabajador;
  email?: string | null;
  telefono?: string | null;
  eps?: string | null;
  fondoPension?: string | null;
}

export function useGuardarTrabajador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: number; datos: Partial<DatosTrabajador> }) =>
      id
        ? (await api.patch<Trabajador>(`/trabajadores/${id}`, datos)).data
        : (await api.post<Trabajador>("/trabajadores", datos)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveTrabajadores });
      qc.invalidateQueries({ queryKey: ["nomina"] });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

export function useEliminarTrabajador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/trabajadores/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveTrabajadores });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

// --- Proyectos ---
export const claveProyectos = ["proyectos"] as const;

export function useProyectos(filtros?: { estado?: EstadoProyecto }) {
  return useQuery({
    queryKey: [...claveProyectos, "lista", filtros ?? {}],
    queryFn: async () => (await api.get<Proyecto[]>("/proyectos", { params: parametros(filtros) })).data,
  });
}

export function useProyecto(id: number | undefined) {
  return useQuery({
    queryKey: [...claveProyectos, id],
    queryFn: async () => (await api.get<Proyecto>(`/proyectos/${id}`)).data,
    enabled: Boolean(id),
  });
}

export interface DatosProyecto {
  codigo: string;
  nombre: string;
  cliente?: string | null;
  ubicacion?: string | null;
  descripcion?: string | null;
  fechaInicio: string;
  fechaFinPlaneada?: string | null;
  fechaFinReal?: string | null;
  estado?: EstadoProyecto;
  presupuesto?: number | null;
}

export function useGuardarProyecto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: number; datos: Partial<DatosProyecto> }) =>
      id
        ? (await api.patch<Proyecto>(`/proyectos/${id}`, datos)).data
        : (await api.post<Proyecto>("/proyectos", datos)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveProyectos });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

export function useEliminarProyecto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/proyectos/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveProyectos });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

// --- Asignaciones ---
export const claveAsignaciones = ["asignaciones"] as const;

export interface FiltroAsignaciones {
  proyectoId?: number;
  trabajadorId?: number;
}

export function useAsignaciones(filtro: FiltroAsignaciones, habilitado = true) {
  return useQuery({
    queryKey: [...claveAsignaciones, "lista", filtro],
    queryFn: async () => (await api.get<Asignacion[]>("/asignaciones", { params: parametros(filtro) })).data,
    enabled: habilitado,
  });
}

export function useHistorialAsignaciones(trabajadorId: number | undefined) {
  return useQuery({
    queryKey: [...claveAsignaciones, "trabajador", trabajadorId],
    queryFn: async () => (await api.get<Asignacion[]>(`/trabajadores/${trabajadorId}/asignaciones`)).data,
    enabled: Boolean(trabajadorId),
  });
}

export interface DatosAsignacion {
  trabajadorId?: number;
  proyectoId?: number;
  rolEnProyecto?: string | null;
}

export function useGuardarAsignacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: number; datos: DatosAsignacion }) =>
      id
        ? (await api.patch<Asignacion>(`/asignaciones/${id}`, datos)).data
        : (await api.post<Asignacion>("/asignaciones", datos)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveAsignaciones });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

export function useEliminarAsignacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/asignaciones/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveAsignaciones });
      qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}
