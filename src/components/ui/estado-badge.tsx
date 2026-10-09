import { Badge } from "./display";
import { ESTADOS } from "@/lib/etiquetas";

type Dominio = keyof typeof ESTADOS;

/** Insignia de estado: <EstadoBadge dominio="proyecto" estado="ACTIVO" />. */
export function EstadoBadge<D extends Dominio>({ dominio, estado }: { dominio: D; estado: keyof (typeof ESTADOS)[D] }) {
  const [etiqueta, tono] = (ESTADOS[dominio] as Record<string, [string, Parameters<typeof Badge>[0]["tono"]]>)[
    estado as string
  ];
  return <Badge tono={tono}>{etiqueta}</Badge>;
}
