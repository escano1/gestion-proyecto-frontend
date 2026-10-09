// Recursos de configuración: usuarios, tipos de hora, parámetros legales y auditoría.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, parametros } from "@/lib/api";
import type {
  AccionAuditoria,
  CodigoParametro,
  DefinicionParametro,
  Pagina,
  ParametroLegal,
  ParametrosVigentes,
  RegistroAuditoria,
  Rol,
  TipoHora,
  Usuario,
} from "@/types/api";

// --- Usuarios (ADMIN) ---
export const claveUsuarios = ["usuarios"] as const;

export function useUsuarios() {
  return useQuery({
    queryKey: claveUsuarios,
    queryFn: async () => (await api.get<Usuario[]>("/usuarios")).data,
  });
}

export interface DatosUsuario {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: Rol;
  activo?: boolean;
}

export function useGuardarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, datos }: { id?: number; datos: DatosUsuario }) =>
      id
        ? (await api.patch<Usuario>(`/usuarios/${id}`, datos)).data
        : (await api.post<Usuario>("/usuarios", datos)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: claveUsuarios }),
  });
}

// --- Tipos de hora ---
export function useTiposHora(fecha?: string) {
  return useQuery({
    queryKey: ["tipos-hora", fecha ?? "hoy"],
    queryFn: async () => (await api.get<TipoHora[]>("/tipos-hora", { params: parametros({ fecha }) })).data,
    staleTime: 5 * 60_000,
  });
}

// --- Parámetros legales ---
export const claveParametros = ["parametros"] as const;

export function useParametros() {
  return useQuery({
    queryKey: [...claveParametros, "lista"],
    queryFn: async () => (await api.get<ParametroLegal[]>("/parametros")).data,
  });
}

export function useCatalogoParametros() {
  return useQuery({
    queryKey: [...claveParametros, "catalogo"],
    queryFn: async () => (await api.get<DefinicionParametro[]>("/parametros/catalogo")).data,
    staleTime: Infinity,
  });
}

export function useParametrosVigentes(fecha?: string) {
  return useQuery({
    queryKey: [...claveParametros, "vigentes", fecha ?? "hoy"],
    queryFn: async () =>
      (await api.get<ParametrosVigentes>("/parametros/vigentes", { params: parametros({ fecha }) })).data,
  });
}

export function useCrearParametro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (datos: { codigo: CodigoParametro; valor: number; vigenteDesde: string; norma?: string }) =>
      (await api.post<ParametroLegal>("/parametros", datos)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveParametros });
      qc.invalidateQueries({ queryKey: ["tipos-hora"] });
      qc.invalidateQueries({ queryKey: ["nomina"] });
    },
  });
}

export function useEliminarParametro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/parametros/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: claveParametros });
      qc.invalidateQueries({ queryKey: ["tipos-hora"] });
      qc.invalidateQueries({ queryKey: ["nomina"] });
    },
  });
}

// --- Auditoría (ADMIN) ---
export interface FiltroAuditoria {
  entidad?: string;
  entidadId?: string;
  usuarioId?: number;
  accion?: AccionAuditoria;
  desde?: string;
  hasta?: string;
  pagina?: number;
  limite?: number;
}

export function useAuditoria(filtro: FiltroAuditoria) {
  return useQuery({
    queryKey: ["auditoria", filtro],
    queryFn: async () =>
      (await api.get<Pagina<RegistroAuditoria>>("/auditoria", { params: parametros(filtro) })).data,
    placeholderData: keepPreviousData,
  });
}
