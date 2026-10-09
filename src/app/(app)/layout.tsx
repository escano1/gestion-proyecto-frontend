"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSesion } from "@/lib/auth-store";
import { AppShell } from "@/components/layout/app-shell";
import { Spinner } from "@/components/ui/display";

const suscribirHidratacion = (aviso: () => void) => useSesion.persist.onFinishHydration(aviso);
const estaHidratado = () => useSesion.persist.hasHydrated();
const servidorNoHidratado = () => false;

/** Área autenticada: espera a leer la sesión de localStorage y redirige a /login si no hay token. */
export default function LayoutAutenticado({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hidratado = useSyncExternalStore(suscribirHidratacion, estaHidratado, servidorNoHidratado);
  const token = useSesion((s) => s.accessToken);

  useEffect(() => {
    if (hidratado && !token) router.replace("/login");
  }, [hidratado, token, router]);

  if (!hidratado || !token) return <Spinner texto="Verificando sesión…" className="min-h-screen" />;
  return <AppShell>{children}</AppShell>;
}
