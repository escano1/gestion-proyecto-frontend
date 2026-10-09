import { Card, EmptyState, PageHeader } from "@/components/ui/display";

/** Página reservada a administradores vista con otro rol. */
export function SinPermisos({ titulo }: { titulo: string }) {
  return (
    <>
      <PageHeader titulo={titulo} />
      <Card>
        <EmptyState titulo="Sin permisos" descripcion="Esta sección está disponible solo para administradores." />
      </Card>
    </>
  );
}
