import { PrismaClient, Prisma } from '@prisma/client';
import {
  IngresoResponse,
  IngresoKPIs,
} from './income.types';
import { CreateIngresoDTO, UpdateIngresoDTO } from './dto';

const prisma = new PrismaClient();

function calcularFiscales(
  montoBruto: Prisma.Decimal | number,
  tipoComprobante: string
): { igss: Prisma.Decimal; ivaIsr: Prisma.Decimal; ingresoNeto: Prisma.Decimal } {
  const bruto = montoBruto instanceof Prisma.Decimal ? montoBruto : new Prisma.Decimal(montoBruto);
  let igss = new Prisma.Decimal(0);
  let ivaIsr = new Prisma.Decimal(0);

  if (tipoComprobante === 'SALARIO') {
    igss = bruto.mul(0.0483);
    ivaIsr = new Prisma.Decimal(0);
  } else if (tipoComprobante === 'FACTURA') {
    igss = new Prisma.Decimal(0);
    // Base Imponible = Monto Bruto / 1.12
    const baseImponible = bruto.div(1.12);
    // Monto IVA = Monto Bruto - Base Imponible
    const montoIva = bruto.minus(baseImponible);
    // Monto ISR = Base Imponible * 0.05
    const montoIsr = baseImponible.mul(0.05);
    // Total Previsión IVA/ISR = Monto IVA + Monto ISR
    ivaIsr = montoIva.plus(montoIsr);
  }

  const ingresoNeto = bruto.minus(igss).minus(ivaIsr);

  return {
    igss: igss.toDecimalPlaces(2),
    ivaIsr: ivaIsr.toDecimalPlaces(2),
    ingresoNeto: ingresoNeto.toDecimalPlaces(2),
  };
}

// Remueve el parámetro userId o ignóralo para listar todos los ingresos globales
export async function listarIngresos(_userId?: string): Promise<IngresoResponse[]> {
  return prisma.ingreso.findMany({
    orderBy: { fecha: 'desc' },
  }) as Promise<IngresoResponse[]>;
}

export async function crearIngreso(
  data: CreateIngresoDTO,
  userId: string
): Promise<IngresoResponse> {
  const fiscales = calcularFiscales(data.montoBruto, data.tipoComprobante);

  return prisma.ingreso.create({
    data: {
      clienteOrigen: data.clienteOrigen,
      categoria: data.categoria,
      montoBruto: new Prisma.Decimal(data.montoBruto),
      fecha: data.fecha,
      tipoComprobante: data.tipoComprobante,
      estado: data.estado ?? 'PAGADO',
      igss: fiscales.igss,
      ivaIsr: fiscales.ivaIsr,
      ingresoNeto: fiscales.ingresoNeto,
      userId,
    },
  }) as Promise<IngresoResponse>;
}

export async function actualizarIngreso(
  id: string,
  data: UpdateIngresoDTO,
  userId: string
): Promise<IngresoResponse> {
  const existente = await prisma.ingreso.findFirst({ where: { id, userId } });
  if (!existente) throw new Error('Ingreso no encontrado');

  const montoBruto = data.montoBruto !== undefined ? data.montoBruto : existente.montoBruto.toNumber();
  const tipo = data.tipoComprobante ?? existente.tipoComprobante;
  const fiscales = calcularFiscales(montoBruto, tipo);

  return prisma.ingreso.update({
    where: { id },
    data: {
      ...(data.clienteOrigen && { clienteOrigen: data.clienteOrigen }),
      ...(data.categoria && { categoria: data.categoria }),
      ...(data.montoBruto !== undefined && { montoBruto: new Prisma.Decimal(data.montoBruto) }),
      ...(data.fecha && { fecha: data.fecha }),
      ...(data.tipoComprobante && { tipoComprobante: data.tipoComprobante }),
      ...(data.estado && { estado: data.estado }),
      igss: fiscales.igss,
      ivaIsr: fiscales.ivaIsr,
      ingresoNeto: fiscales.ingresoNeto,
    },
  }) as Promise<IngresoResponse>;
}

export async function anularIngreso(id: string, userId: string): Promise<IngresoResponse> {
  const existente = await prisma.ingreso.findFirst({ where: { id, userId } });
  if (!existente) throw new Error('Ingreso no encontrado');

  return prisma.ingreso.update({
    where: { id },
    data: { estado: 'ANULADO' },
  }) as Promise<IngresoResponse>;
}

// Remueve el filtro por userId en la consulta de KPIs
export async function obtenerKPIs(_userId?: string): Promise<IngresoKPIs> {
  const ingresos = await prisma.ingreso.findMany({
    where: {
      estado: { not: 'ANULADO' },
    },
  });

  let totalIngresosBrutos = new Prisma.Decimal(0);
  let previsionImpuestos = new Prisma.Decimal(0);
  let retencionesIgss = new Prisma.Decimal(0);

  for (const ing of ingresos) {
    totalIngresosBrutos = totalIngresosBrutos.plus(ing.montoBruto);

    if (ing.tipoComprobante === 'FACTURA') {
      previsionImpuestos = previsionImpuestos.plus(ing.ivaIsr);
    } else if (ing.tipoComprobante === 'SALARIO') {
      retencionesIgss = retencionesIgss.plus(ing.igss);
    }
  }

  const ingresoNetoReal = totalIngresosBrutos.minus(previsionImpuestos).minus(retencionesIgss);

  return {
    totalIngresosBrutos: totalIngresosBrutos.toDecimalPlaces(2).toNumber(),
    previsionImpuestos: previsionImpuestos.toDecimalPlaces(2).toNumber(),
    retencionesIgss: retencionesIgss.toDecimalPlaces(2).toNumber(),
    ingresoNetoReal: ingresoNetoReal.toDecimalPlaces(2).toNumber(),
  };
}