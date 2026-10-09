import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSesion } from "@/lib/auth-store";
import type { RespuestaLogin, Usuario } from "@/types/api";

export function useIniciarSesion() {
  const iniciarSesion = useSesion((s) => s.iniciarSesion);
  return useMutation({
    mutationFn: async (credenciales: { email: string; password: string }) =>
      (await api.post<RespuestaLogin>("/auth/login", credenciales)).data,
    onSuccess: iniciarSesion,
  });
}

export function usePerfil() {
  const actualizarUsuario = useSesion((s) => s.actualizarUsuario);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get<Usuario>("/auth/me");
      actualizarUsuario(data);
      return data;
    },
  });
}

export function useCambiarPassword() {
  return useMutation({
    mutationFn: async (datos: { passwordActual: string; passwordNueva: string }) => {
      await api.patch("/auth/password", datos);
    },
  });
}
