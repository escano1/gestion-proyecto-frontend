import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RespuestaLogin, Usuario } from "@/types/api";

interface EstadoSesion {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: Usuario | null;
  iniciarSesion: (respuesta: RespuestaLogin) => void;
  actualizarUsuario: (usuario: Usuario) => void;
  cerrarSesion: () => void;
}

export const useSesion = create<EstadoSesion>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      iniciarSesion: ({ accessToken, refreshToken, usuario }) =>
        set({ accessToken, refreshToken, usuario }),
      actualizarUsuario: (usuario) => set({ usuario }),
      cerrarSesion: () => set({ accessToken: null, refreshToken: null, usuario: null }),
    }),
    {
      name: "gp-sesion",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ accessToken, refreshToken, usuario }) => ({
        accessToken,
        refreshToken,
        usuario,
      }),
    },
  ),
);
