"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useUsuarios } from "@/features/catalogos/api";
import { useSesion } from "@/lib/auth-store";
import { mensajeError } from "@/lib/errores";
import { formatoFechaHora } from "@/lib/formato";
import { ETIQUETA_ROL } from "@/lib/permisos";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui/display";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { Usuario } from "@/types/api";
import { UsuarioForm } from "./usuario-form";

/** Listado y edición de usuarios (solo ADMIN: la página verifica el rol antes de montarlo). */
export function GestionUsuarios() {
  const idPropio = useSesion((s) => s.usuario?.id);
  const consulta = useUsuarios();
  const [edicion, setEdicion] = useState<{ abierto: boolean; usuario?: Usuario }>({ abierto: false });

  return (
    <>
      <PageHeader
        titulo="Usuarios"
        descripcion="Cuentas de acceso al sistema y sus roles"
        acciones={
          <Button onClick={() => setEdicion({ abierto: true })}>
            <Plus className="size-4" /> Nuevo usuario
          </Button>
        }
      />

      <Card>
        {consulta.isPending ? (
          <Spinner />
        ) : consulta.isError ? (
          <ErrorState mensaje={mensajeError(consulta.error)} reintentar={() => consulta.refetch()} />
        ) : consulta.data.length === 0 ? (
          <EmptyState titulo="No hay usuarios" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nombre</Th>
                <Th>Correo</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th>Creado</Th>
                <Th className="w-12">
                  <span className="sr-only">Acciones</span>
                </Th>
              </tr>
            </thead>
            <TBody>
              {consulta.data.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium text-slate-900">
                    {u.nombre}
                    {u.id === idPropio && <span className="ml-1.5 text-xs font-normal text-slate-500">(usted)</span>}
                  </Td>
                  <Td>{u.email}</Td>
                  <Td className="whitespace-nowrap">{ETIQUETA_ROL[u.rol]}</Td>
                  <Td>{u.activo ? <Badge tono="verde">Activo</Badge> : <Badge>Inactivo</Badge>}</Td>
                  <Td className="whitespace-nowrap">{formatoFechaHora(u.creadoEn)}</Td>
                  <Td>
                    <Button
                      variante="fantasma"
                      tamano="sm"
                      onClick={() => setEdicion({ abierto: true, usuario: u })}
                      aria-label={`Editar ${u.nombre}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {edicion.abierto && (
        <UsuarioForm
          usuario={edicion.usuario}
          esPropio={edicion.usuario?.id === idPropio}
          onCerrar={() => setEdicion({ abierto: false })}
        />
      )}
    </>
  );
}
