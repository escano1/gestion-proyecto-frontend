import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useSesion } from "./auth-store";
import type { RespuestaLogin } from "@/types/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export const api = axios.create({ baseURL: API_URL, timeout: 30_000 });

api.interceptors.request.use((config) => {
  const token = useSesion.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Un solo refresh en curso aunque fallen varias peticiones a la vez.
let refrescoEnCurso: Promise<string | null> | null = null;

async function refrescarToken(): Promise<string | null> {
  const { refreshToken, iniciarSesion } = useSesion.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<RespuestaLogin>(`${API_URL}/auth/refresh`, { refreshToken });
    iniciarSesion(data);
    return data.accessToken;
  } catch {
    return null;
  }
}

// Al limpiar la sesión, el layout autenticado redirige a /login.
const expirarSesion = () => useSesion.getState().cerrarSesion();

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _reintento?: boolean }) | undefined;
    const esAuth = original?.url?.startsWith("/auth/login") || original?.url?.startsWith("/auth/refresh");

    if (error.response?.status !== 401 || !original || original._reintento || esAuth) {
      return Promise.reject(error);
    }

    original._reintento = true;
    refrescoEnCurso ??= refrescarToken().finally(() => {
      refrescoEnCurso = null;
    });
    const nuevoToken = await refrescoEnCurso;
    if (!nuevoToken) {
      expirarSesion();
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${nuevoToken}`;
    return api(original);
  },
);

/** Quita claves vacías para no enviar `?q=&estado=` al API. */
export function parametros<T extends object>(filtros?: T): Partial<T> | undefined {
  if (!filtros) return undefined;
  return Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => valor !== undefined && valor !== null && valor !== ""),
  ) as Partial<T>;
}
