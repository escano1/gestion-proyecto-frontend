import { formatoNumero, formatoPesos } from "@/lib/formato";
import { Card, CardHeader, EmptyState } from "@/components/ui/display";
import { Table, TBody, Td, Th, Tr } from "@/components/ui/table";
import type { ConceptoNomina } from "@/types/api";

interface Props {
  titulo: string;
  conceptos: ConceptoNomina[];
  etiquetaTotal: string;
  total: number;
}

/** Devengados o deducciones de un comprobante de pago. */
export function TablaConceptos({ titulo, conceptos, etiquetaTotal, total }: Props) {
  return (
    <Card>
      <CardHeader titulo={titulo} />
      {conceptos.length === 0 ? (
        <EmptyState titulo={`Sin ${titulo.toLowerCase()}`} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Descripción</Th>
              <Th alinear="derecha">Cantidad</Th>
              <Th alinear="derecha">Valor unitario</Th>
              <Th alinear="derecha">Valor</Th>
            </tr>
          </thead>
          <TBody>
            {conceptos.map((c) => (
              <Tr key={`${c.codigo}-${c.descripcion}`}>
                <Td title={c.codigo}>{c.descripcion}</Td>
                <Td alinear="derecha">{formatoNumero(c.cantidad)}</Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(c.valorUnitario)}
                </Td>
                <Td alinear="derecha" className="whitespace-nowrap">
                  {formatoPesos(c.valor)}
                </Td>
              </Tr>
            ))}
          </TBody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <Th scope="row" colSpan={3} className="normal-case">
                {etiquetaTotal}
              </Th>
              <Td alinear="derecha" className="font-semibold whitespace-nowrap text-slate-900">
                {formatoPesos(total)}
              </Td>
            </tr>
          </tfoot>
        </Table>
      )}
    </Card>
  );
}
