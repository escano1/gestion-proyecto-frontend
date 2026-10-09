import { Card, EmptyState, PageHeader } from "@/components/ui/display";

/** Se muestra a roles sin acceso a nómina, sin llamar al API. */
export function SinPermisoNomina() {
  return (
    <>
      <PageHeader titulo="Nómina" />
      <Card>
        <EmptyState
          titulo="Sin permisos"
          descripcion="La nómina solo está disponible para los roles Administrador y Nómina."
        />
      </Card>
    </>
  );
}
