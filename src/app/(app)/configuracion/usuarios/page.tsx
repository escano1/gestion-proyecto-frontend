"use client";

import { GestionUsuarios } from "@/features/configuracion/gestion-usuarios";
import { SinPermisos } from "@/features/configuracion/sin-permisos";
import { useSesion } from "@/lib/auth-store";
import { esAdmin } from "@/lib/permisos";

export default function PaginaUsuarios() {
  const rol = useSesion((s) => s.usuario?.rol);
  // Sin rol ADMIN no se monta el listado, así no se llama al API.
  if (!esAdmin(rol)) return <SinPermisos titulo="Usuarios" />;
  return <GestionUsuarios />;
}
