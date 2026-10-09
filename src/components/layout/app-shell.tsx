"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  Clock,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useSesion } from "@/lib/auth-store";
import { ETIQUETA_ROL } from "@/lib/permisos";
import { cn } from "@/lib/cn";
import type { Rol } from "@/types/api";

interface ItemNav {
  href: string;
  etiqueta: string;
  icono: typeof LayoutDashboard;
  roles?: Rol[];
}

const NAVEGACION: ItemNav[] = [
  { href: "/dashboard", etiqueta: "Dashboard", icono: LayoutDashboard },
  { href: "/proyectos", etiqueta: "Proyectos", icono: FolderKanban },
  { href: "/trabajadores", etiqueta: "Trabajadores", icono: Users },
  { href: "/registro-horas", etiqueta: "Registro de horas", icono: Clock },
  { href: "/nomina", etiqueta: "Nómina", icono: Wallet, roles: ["ADMIN", "NOMINA"] },
  { href: "/reportes", etiqueta: "Reportes", icono: BarChart3 },
  { href: "/configuracion/parametros", etiqueta: "Parámetros legales", icono: Settings2 },
  { href: "/configuracion/usuarios", etiqueta: "Usuarios", icono: ShieldCheck, roles: ["ADMIN"] },
  { href: "/auditoria", etiqueta: "Auditoría", icono: ScrollText, roles: ["ADMIN"] },
];

function Navegacion({ rol, alNavegar }: { rol: Rol; alNavegar?: () => void }) {
  const ruta = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {NAVEGACION.filter((i) => !i.roles || i.roles.includes(rol)).map(({ href, etiqueta, icono: Icono }) => {
        const activo = ruta === href || ruta.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={alNavegar}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activo ? "bg-marca-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <Icono className="size-4 shrink-0" aria-hidden />
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}

function Marca() {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-5">
      <span className="flex size-7 items-center justify-center rounded-md bg-acento-400 text-slate-900">
        <Zap className="size-4" aria-hidden />
      </span>
      <span className="text-sm font-semibold text-white">Gestión de Proyectos</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const usuario = useSesion((s) => s.usuario);
  const cerrarSesion = useSesion((s) => s.cerrarSesion);
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  if (!usuario) return null;

  const salir = () => {
    cerrarSesion();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-900 lg:flex">
        <Marca />
        <Navegacion rol={usuario.rol} />
      </aside>

      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuAbierto(false)} aria-hidden />
          <aside className="relative flex h-full w-64 flex-col bg-slate-900">
            <button
              type="button"
              className="absolute top-3.5 right-3 text-slate-300"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
            <Marca />
            <Navegacion rol={usuario.rol} alNavegar={() => setMenuAbierto(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="text-slate-600 lg:hidden"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex">
            <ClipboardList className="size-4" aria-hidden /> Ingeniería eléctrica · Colombia
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/perfil"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              <UserRound className="size-4 text-slate-500" aria-hidden />
              <span className="hidden sm:inline">{usuario.nombre}</span>
              <span className="hidden text-xs text-slate-400 md:inline">· {ETIQUETA_ROL[usuario.rol]}</span>
            </Link>
            <button
              type="button"
              onClick={salir}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
