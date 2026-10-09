"use client";

import { ConsultaAuditoria } from "@/features/auditoria/consulta-auditoria";
import { SinPermisos } from "@/features/configuracion/sin-permisos";
import { useSesion } from "@/lib/auth-store";
import { esAdmin } from "@/lib/permisos";

export default function PaginaAuditoria() {
  const rol = useSesion((s) => s.usuario?.rol);
  // Sin rol ADMIN no se monta la consulta, así no se llama al API.
  if (!esAdmin(rol)) return <SinPermisos titulo="Auditoría" />;
  return <ConsultaAuditoria />;
}
