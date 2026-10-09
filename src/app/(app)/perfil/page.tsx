"use client";

import { usePerfil } from "@/features/auth/api";
import { CambiarPasswordForm } from "@/features/perfil/cambiar-password-form";
import { mensajeError } from "@/lib/errores";
import { formatoFechaHora } from "@/lib/formato";
import { ETIQUETA_ROL } from "@/lib/permisos";
import { Badge, Card, CardHeader, DataList, ErrorState, PageHeader, Spinner } from "@/components/ui/display";

export default function PaginaPerfil() {
  const perfil = usePerfil();

  return (
    <>
      <PageHeader titulo="Mi perfil" descripcion="Datos de su cuenta y cambio de contraseña" />

      <div className="space-y-6">
        <Card>
          <CardHeader titulo="Datos de la cuenta" />
          {perfil.isPending ? (
            <Spinner />
          ) : perfil.isError ? (
            <ErrorState mensaje={mensajeError(perfil.error)} reintentar={() => perfil.refetch()} />
          ) : (
            <div className="p-4">
              <DataList
                items={[
                  { etiqueta: "Nombre", valor: perfil.data.nombre },
                  { etiqueta: "Correo electrónico", valor: perfil.data.email },
                  { etiqueta: "Rol", valor: ETIQUETA_ROL[perfil.data.rol] },
                  {
                    etiqueta: "Estado",
                    valor: perfil.data.activo ? <Badge tono="verde">Activo</Badge> : <Badge>Inactivo</Badge>,
                  },
                  { etiqueta: "Cuenta creada", valor: formatoFechaHora(perfil.data.creadoEn) },
                ]}
              />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader titulo="Cambiar contraseña" descripcion="Use una contraseña que no utilice en otros servicios" />
          <div className="p-4">
            <CambiarPasswordForm />
          </div>
        </Card>
      </div>
    </>
  );
}
