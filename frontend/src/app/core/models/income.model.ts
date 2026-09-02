export type TipoComprobante = 'SALARIO' | 'FACTURA';
export type CategoriaIngreso = 'SERVICIOS' | 'PLANILLA' | 'PRODUCTOS' | 'CONSULTORIA' | 'OTROS';
export type EstadoIngreso = 'PAGADO' | 'PENDIENTE' | 'ANULADO';

export interface Ingreso {
  id: string;
  clienteOrigen: string;
  categoria: CategoriaIngreso;
  montoBruto: number;
  fecha: string; // ISO 8601
  tipoComprobante: TipoComprobante;
  estado: EstadoIngreso;
  igss: number;
  ivaIsr: number;
  ingresoNeto: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngresoKPIs {
  totalIngresosBrutos: number;
  previsionImpuestos: number;
  retencionesIgss: number;
  ingresoNetoReal: number;
}

export interface CreateIngresoPayload {
  clienteOrigen: string;
  categoria: CategoriaIngreso;
  montoBruto: number;
  fecha: string;
  tipoComprobante: TipoComprobante;
  estado?: EstadoIngreso;
}

export interface UpdateIngresoPayload {
  clienteOrigen?: string;
  categoria?: CategoriaIngreso;
  montoBruto?: number;
  fecha?: string;
  tipoComprobante?: TipoComprobante;
  estado?: EstadoIngreso;
}