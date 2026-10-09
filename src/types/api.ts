// Tipos del contrato de API (docs/API.md en el repositorio de lineamientos).

export type Rol = "ADMIN" | "GESTOR_PROYECTOS" | "NOMINA" | "CONSULTA";
export type TipoDocumento = "CC" | "CE" | "PA" | "PPT" | "TI";
export type TipoSalario = "MENSUAL" | "POR_HORA";
export type TipoContrato = "INDEFINIDO" | "FIJO" | "OBRA_LABOR" | "APRENDIZAJE";
export type TipoJornada = "COMPLETA" | "PARCIAL";
export type EstadoTrabajador = "ACTIVO" | "INACTIVO";
export type EstadoProyecto = "ACTIVO" | "SUSPENDIDO" | "FINALIZADO";
export type CodigoTipoHora = "ORD" | "NOC" | "HED" | "HEN" | "DOM" | "DOMN" | "HEDD" | "HEDN";
export type TipoPeriodo = "QUINCENAL" | "MENSUAL";
export type EstadoLiquidacion = "BORRADOR" | "CERRADA";
export type TipoConcepto = "DEVENGADO" | "DEDUCCION";
export type EstadoMaterial = "PENDIENTE" | "SOLICITADO" | "ENTREGADO" | "INSTALADO";
export type EstadoHerramienta = "ASIGNADA" | "DEVUELTA" | "EXTRAVIADA";
export type EstadoHito = "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO";
export type EstadoAvance = "EN_TIEMPO" | "RETRASADO" | "ADELANTADO" | "SIN_HITOS";
export type AccionAuditoria = "CREAR" | "ACTUALIZAR" | "ELIMINAR" | "CALCULAR" | "CERRAR" | "REABRIR";
export type CodigoParametro =
  | "SMMLV"
  | "AUXILIO_TRANSPORTE"
  | "UVT"
  | "JORNADA_MAXIMA_SEMANAL"
  | "RECARGO_NOCTURNO"
  | "RECARGO_EXTRA_DIURNA"
  | "RECARGO_EXTRA_NOCTURNA"
  | "RECARGO_DOMINICAL_FESTIVO"
  | "APORTE_SALUD_EMPLEADO"
  | "APORTE_PENSION_EMPLEADO"
  | "LIMITE_HORAS_EXTRA_DIA"
  | "LIMITE_HORAS_EXTRA_SEMANA";
export type UnidadParametro = "PESOS" | "FRACCION" | "HORAS";

export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
}

export interface ErrorApi {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creadoEn: string;
}

export interface RespuestaLogin {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export interface Trabajador {
  id: number;
  nombre: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  cargo: string;
  tipoSalario: TipoSalario;
  salarioBase: number;
  tipoContrato: TipoContrato;
  tipoJornada: TipoJornada;
  horasSemanales: number | null;
  aplicaAuxilioTransporte: boolean;
  fechaIngreso: string;
  fechaRetiro: string | null;
  estado: EstadoTrabajador;
  email: string | null;
  telefono: string | null;
  eps: string | null;
  fondoPension: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Proyecto {
  id: number;
  codigo: string;
  nombre: string;
  cliente: string;
  ubicacion: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFinPlaneada: string | null;
  fechaFinReal: string | null;
  estado: EstadoProyecto;
  presupuesto: number | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface TrabajadorRef {
  id: number;
  nombre: string;
  numeroDocumento: string;
  cargo: string;
}

export interface ProyectoRef {
  id: number;
  codigo: string;
  nombre: string;
}

export interface UsuarioRef {
  id: number;
  nombre: string;
}

export interface Asignacion {
  id: number;
  trabajadorId: number;
  proyectoId: number;
  fechaInicio: string;
  fechaFin: string | null;
  rolEnProyecto: string | null;
  vigente: boolean;
  trabajador: TrabajadorRef;
  proyecto: ProyectoRef;
  creadoEn: string;
}

export interface TipoHora {
  id: number;
  codigo: CodigoTipoHora;
  nombre: string;
  descripcion: string | null;
  esExtra: boolean;
  esNocturna: boolean;
  esDominicalFestiva: boolean;
  orden: number;
  activo: boolean;
  recargo: number;
}

export interface ParametroLegal {
  id: number;
  codigo: CodigoParametro;
  nombre: string;
  unidad: UnidadParametro;
  valor: number;
  vigenteDesde: string;
  norma: string | null;
  creadoEn: string;
}

export interface DefinicionParametro {
  codigo: CodigoParametro;
  nombre: string;
  unidad: UnidadParametro;
  descripcion: string;
}

export interface ParametrosVigentes {
  fecha: string;
  valores: {
    smmlv: number;
    auxilioTransporte: number;
    uvt: number;
    jornadaMaximaSemanal: number;
    recargoNocturno: number;
    recargoExtraDiurna: number;
    recargoExtraNocturna: number;
    recargoDominicalFestivo: number;
    aporteSaludEmpleado: number;
    aportePensionEmpleado: number;
    limiteHorasExtraDia: number;
    limiteHorasExtraSemana: number;
  };
}

export interface DetalleHoras {
  tipoHoraId: number;
  codigo: CodigoTipoHora;
  nombre: string;
  horas: number;
}

export interface RegistroHoras {
  id: number;
  fecha: string;
  observacion: string | null;
  trabajador: { id: number; nombre: string; numeroDocumento: string };
  proyecto: ProyectoRef;
  detalles: DetalleHoras[];
  totalHoras: number;
  creadoPor: UsuarioRef;
  actualizadoPor: UsuarioRef | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface EntradaRegistroHoras {
  trabajadorId: number;
  proyectoId: number;
  fecha: string;
  observacion?: string;
  detalles: { tipoHoraId: number; horas: number }[];
}

export interface RespuestaRegistroHoras {
  registro: RegistroHoras;
  alertas: string[];
}

export interface RespuestaLoteHoras {
  creados: number;
  actualizados: number;
  eliminados: number;
  alertas: string[];
}

export interface LiquidacionResumen {
  id: number;
  tipoPeriodo: TipoPeriodo;
  anio: number;
  mes: number;
  quincena: 1 | 2 | null;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoLiquidacion;
  requiereRecalculo: boolean;
  totalDevengado: number;
  totalDeducciones: number;
  totalNeto: number;
  numeroTrabajadores: number;
  calculadaEn: string | null;
  cerradaEn: string | null;
  creadoEn: string;
}

export interface NominaTrabajadorResumen {
  id: number;
  trabajadorId: number;
  nombreTrabajador: string;
  numeroDocumento: string;
  cargo: string;
  tipoSalario: TipoSalario;
  diasLaborados: number;
  ibc: number;
  totalDevengado: number;
  totalDeducciones: number;
  netoPagar: number;
  alertas: string[];
}

export interface LiquidacionDetalle extends LiquidacionResumen {
  nominas: NominaTrabajadorResumen[];
}

export interface ConceptoNomina {
  tipo: TipoConcepto;
  codigo: string;
  descripcion: string;
  cantidad: number | null;
  valorUnitario: number | null;
  valor: number;
}

export interface Desprendible extends NominaTrabajadorResumen {
  tipoDocumento: TipoDocumento;
  salarioBase: number;
  valorHora: number;
  parametros: Record<string, number>;
  liquidacion: {
    id: number;
    tipoPeriodo: TipoPeriodo;
    fechaInicio: string;
    fechaFin: string;
    estado: EstadoLiquidacion;
  };
  conceptos: ConceptoNomina[];
}

export interface Material {
  id: number;
  proyectoId: number;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string;
  cantidadSolicitada: number;
  cantidadEntregada: number;
  estado: EstadoMaterial;
  fechaSolicitud: string;
  fechaRequerida: string | null;
  fechaEntrega: string | null;
  observaciones: string | null;
  solicitadoPor: UsuarioRef;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Herramienta {
  id: number;
  proyectoId: number;
  nombre: string;
  codigo: string | null;
  cantidad: number;
  responsable: { id: number; nombre: string } | null;
  fechaAsignacion: string;
  fechaDevolucionPrevista: string | null;
  fechaDevolucion: string | null;
  estado: EstadoHerramienta;
  observaciones: string | null;
  vencida: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Hito {
  id: number;
  proyectoId: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  fechaPlaneada: string;
  fechaReal: string | null;
  peso: number;
  porcentajeAvance: number;
  estado: EstadoHito;
  creadoEn: string;
  actualizadoEn: string;
}

export interface AvanceProyecto {
  avanceReal: number;
  avancePlaneado: number;
  estado: EstadoAvance;
  sumaPesos: number;
  curva: { fecha: string; planeado: number; real: number }[];
}

export type AvanceResumen = Omit<AvanceProyecto, "curva">;

export interface AdjuntoBitacora {
  id: number;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
  creadoEn: string;
}

export interface EntradaBitacora {
  id: number;
  proyectoId: number;
  fecha: string;
  descripcion: string;
  observaciones: string | null;
  autor: UsuarioRef;
  adjuntos: AdjuntoBitacora[];
  creadoEn: string;
}

export type AgrupacionHoras = "trabajador" | "proyecto" | "tipo" | "fecha";

export interface ReporteHoras {
  desde: string;
  hasta: string;
  agrupacion: AgrupacionHoras;
  filas: {
    clave: string;
    etiqueta: string;
    horas: number;
    horasExtra: number;
    costo: number;
    porTipo: Partial<Record<CodigoTipoHora, number>>;
  }[];
  totales: { horas: number; horasExtra: number; costo: number };
}

export interface ReporteCostosProyectos {
  filas: {
    proyectoId: number;
    codigo: string;
    nombre: string;
    estado: EstadoProyecto;
    presupuesto: number | null;
    horas: number;
    costo: number;
  }[];
  total: number;
}

export type TipoAlertaHoras = "EXTRA_DIA" | "EXTRA_SEMANA" | "JORNADA_SEMANA";

export interface AlertaHoras {
  trabajadorId: number;
  nombre: string;
  tipo: TipoAlertaHoras;
  periodo: string;
  horas: number;
  limite: number;
  mensaje: string;
}

export interface ReporteNominaPeriodos {
  filas: LiquidacionResumen[];
  totales: { devengado: number; deducciones: number; neto: number };
}

export interface ReportePendientes {
  materiales: (Material & { proyecto: ProyectoRef; vencido: boolean })[];
  herramientas: (Herramienta & { proyecto: ProyectoRef })[];
}

export interface AvanceProyectoReporte {
  proyecto: Proyecto;
  avance: AvanceResumen;
}

export interface ResumenProyecto {
  proyecto: Proyecto;
  asignaciones: Asignacion[];
  horas: {
    total: number;
    horasExtra: number;
    porTipo: { codigo: CodigoTipoHora; nombre: string; horas: number }[];
  };
  costoManoObra: number;
  costoPorTrabajador: { trabajadorId: number; nombre: string; horas: number; costo: number }[];
  avance: AvanceResumen;
  pendientes: { materiales: number; herramientas: number };
}

export interface Dashboard {
  fecha: string;
  proyectosActivos: number;
  trabajadoresActivos: number;
  mes: {
    desde: string;
    hasta: string;
    horas: number;
    horasExtra: number;
    costo: number;
    porTipo: { codigo: CodigoTipoHora; nombre: string; horas: number }[];
  };
  costoPorProyecto: { proyectoId: number; codigo: string; nombre: string; horas: number; costo: number }[];
  alertasHorasExtra: number;
  materialesPendientes: number;
  herramientasVencidas: number;
  avanceProyectos: {
    id: number;
    codigo: string;
    nombre: string;
    avanceReal: number;
    avancePlaneado: number;
    estado: EstadoAvance;
  }[];
  ultimaLiquidacion: LiquidacionResumen | null;
}

export interface RegistroAuditoria {
  id: number;
  entidad: string;
  entidadId: string;
  accion: AccionAuditoria;
  datosAnteriores: Record<string, unknown> | null;
  datosNuevos: Record<string, unknown> | null;
  descripcion: string | null;
  usuarioId: number | null;
  usuarioEmail: string | null;
  fecha: string;
}
