// lib/estados-financieros.ts
// SARA - Fase 3: Motor de cálculo de Estados Financieros
// Ley 822 LCT Nicaragua | NIIF PYMES Secciones 3-7

// ─────────────────────────────────────────────────────────────────────
// ESTRUCTURA DEL ESTADO DE RESULTADOS
// NIIF PYMES Sección 5 | LCT art. 43-54
// ─────────────────────────────────────────────────────────────────────
export interface LineaEstado {
  codigo: string
  descripcion: string
  cuentas: string[]
  signo: 1 | -1
  esSubtotal?: boolean
  esTotal?: boolean
  nivel?: number
  componentes?: string[]
}

export const ESTRUCTURA_ESTADO_RESULTADOS: LineaEstado[] = [
  { codigo: 'I001', descripcion: 'Ventas Brutas', cuentas: ['4.1.1'], signo: -1, nivel: 1 },
  { codigo: 'I002', descripcion: 'Devoluciones y Descuentos en Ventas', cuentas: ['4.1.2', '4.1.3'], signo: 1, nivel: 1 },
  { codigo: 'I003', descripcion: 'Ventas Netas', cuentas: [], signo: 1, esSubtotal: true, nivel: 0, componentes: ['I001', 'I002'] },
  { codigo: 'I004', descripcion: 'Costo de Ventas / Costo de Producción', cuentas: ['5.1'], signo: 1, nivel: 1 },
  { codigo: 'I005', descripcion: 'UTILIDAD BRUTA', cuentas: [], signo: 1, esSubtotal: true, nivel: 0, componentes: ['I003', 'I004'] },
  { codigo: 'G001', descripcion: 'Gastos de Administración', cuentas: ['5.2.1'], signo: 1, nivel: 1 },
  { codigo: 'G002', descripcion: 'Gastos de Ventas', cuentas: ['5.2.2'], signo: 1, nivel: 1 },
  { codigo: 'G003', descripcion: 'Gastos de Personal (INSS/INATEC)', cuentas: ['5.2.3'], signo: 1, nivel: 1 },
  { codigo: 'G004', descripcion: 'Depreciación y Amortización (Art. 45 LCT)', cuentas: ['5.2.4', '5.2.5'], signo: 1, nivel: 1 },
  { codigo: 'G005', descripcion: 'Total Gastos Operativos', cuentas: [], signo: 1, esSubtotal: true, nivel: 0, componentes: ['G001', 'G002', 'G003', 'G004'] },
  { codigo: 'G006', descripcion: 'UTILIDAD / PÉRDIDA OPERATIVA', cuentas: [], signo: 1, esSubtotal: true, nivel: 0, componentes: ['I005', 'G005'] },
  { codigo: 'N001', descripcion: 'Ingresos Financieros', cuentas: ['4.2.1'], signo: -1, nivel: 1 },
  { codigo: 'N002', descripcion: 'Gastos Financieros (Intereses)', cuentas: ['5.3.1'], signo: 1, nivel: 1 },
  { codigo: 'N003', descripcion: 'Diferencial Cambiario Neto', cuentas: ['4.2.2', '5.3.2'], signo: -1, nivel: 1 },
  { codigo: 'N004', descripcion: 'Otros Ingresos No Operativos', cuentas: ['4.3'], signo: -1, nivel: 1 },
  { codigo: 'N005', descripcion: 'Otros Gastos No Operativos', cuentas: ['5.4'], signo: 1, nivel: 1 },
  { codigo: 'N006', descripcion: 'Total No Operativos Neto', cuentas: [], signo: 1, esSubtotal: true, nivel: 0, componentes: ['N001', 'N002', 'N003', 'N004', 'N005'] },
  { codigo: 'R001', descripcion: 'UTILIDAD ANTES DE IR', cuentas: [], signo: 1, esSubtotal: true, nivel: 0, componentes: ['G006', 'N006'] },
  { codigo: 'R002', descripcion: 'IR sobre la Renta (30% Personas Jurídicas - Art. 52 LCT)', cuentas: ['2.4.1'], signo: 1, nivel: 1 },
  { codigo: 'R003', descripcion: 'Anticipos IR descontados (Art. 56 LCT)', cuentas: ['1.1.5'], signo: -1, nivel: 1 },
  { codigo: 'R004', descripcion: 'UTILIDAD NETA DEL PERÍODO', cuentas: [], signo: 1, esTotal: true, nivel: 0, componentes: ['R001', 'R002', 'R003'] },
]

export const ESTRUCTURA_BALANCE_GENERAL = {
  activos: [
    { codigo: 'AC001', descripcion: 'ACTIVO CORRIENTE', esSubtotal: true, nivel: 0, cuentas: [] as string[], signo: 1 as const },
    { codigo: 'AC100', descripcion: 'Efectivo y Equivalentes de Efectivo', cuentas: ['1.1.1'], signo: 1 as const, nivel: 1 },
    { codigo: 'AC200', descripcion: 'Cuentas por Cobrar Clientes', cuentas: ['1.1.2.1'], signo: 1 as const, nivel: 1 },
    { codigo: 'AC210', descripcion: 'Retenciones IR por Cobrar (2% Art. 44 Reg. LCT)', cuentas: ['1.1.2.2'], signo: 1 as const, nivel: 1 },
    { codigo: 'AC220', descripcion: 'Anticipos IR (Art. 56 LCT)', cuentas: ['1.1.5'], signo: 1 as const, nivel: 1 },
    { codigo: 'AC300', descripcion: 'IVA Crédito Fiscal (Art. 107 LCT)', cuentas: ['1.1.3'], signo: 1 as const, nivel: 1 },
    { codigo: 'AC400', descripcion: 'Inventarios', cuentas: ['1.1.4'], signo: 1 as const, nivel: 1 },
    { codigo: 'AC500', descripcion: 'Gastos Pagados por Anticipado', cuentas: ['1.1.6'], signo: 1 as const, nivel: 1 },
    { codigo: 'AC999', descripcion: 'TOTAL ACTIVO CORRIENTE', cuentas: [] as string[], esSubtotal: true, nivel: 0, signo: 1 as const, componentes: ['AC100','AC200','AC210','AC220','AC300','AC400','AC500'] },
    { codigo: 'ANC001', descripcion: 'ACTIVO NO CORRIENTE', esSubtotal: true, nivel: 0, cuentas: [] as string[], signo: 1 as const },
    { codigo: 'ANC100', descripcion: 'Propiedad, Planta y Equipo (Bruto)', cuentas: ['1.2.1'], signo: 1 as const, nivel: 1 },
    { codigo: 'ANC110', descripcion: 'Menos: Depreciación Acumulada (Art. 45 LCT)', cuentas: ['1.2.2'], signo: -1 as const, nivel: 1 },
    { codigo: 'ANC120', descripcion: 'Propiedad, Planta y Equipo (Neto)', cuentas: [] as string[], esSubtotal: true, nivel: 0, signo: 1 as const, componentes: ['ANC100','ANC110'] },
    { codigo: 'ANC200', descripcion: 'Activos Intangibles (Bruto)', cuentas: ['1.2.3'], signo: 1 as const, nivel: 1 },
    { codigo: 'ANC210', descripcion: 'Menos: Amortización Acumulada', cuentas: ['1.2.4'], signo: -1 as const, nivel: 1 },
    { codigo: 'ANC220', descripcion: 'Activos Intangibles (Neto)', cuentas: [] as string[], esSubtotal: true, nivel: 0, signo: 1 as const, componentes: ['ANC200','ANC210'] },
    { codigo: 'ANC300', descripcion: 'Otros Activos No Corrientes', cuentas: ['1.3'], signo: 1 as const, nivel: 1 },
    { codigo: 'ANC999', descripcion: 'TOTAL ACTIVO NO CORRIENTE', cuentas: [] as string[], esSubtotal: true, nivel: 0, signo: 1 as const, componentes: ['ANC120','ANC220','ANC300'] },
    { codigo: 'AT000', descripcion: 'TOTAL ACTIVOS', cuentas: [] as string[], esTotal: true, nivel: 0, signo: 1 as const, componentes: ['AC999','ANC999'] },
  ],
  pasivos: [
    { codigo: 'PC001', descripcion: 'PASIVO CORRIENTE', esSubtotal: true, nivel: 0, cuentas: [] as string[], signo: -1 as const },
    { codigo: 'PC100', descripcion: 'Cuentas por Pagar Proveedores', cuentas: ['2.1.1'], signo: -1 as const, nivel: 1 },
    { codigo: 'PC200', descripcion: 'IVA por Pagar (Art. 104 LCT)', cuentas: ['2.1.2'], signo: -1 as const, nivel: 1 },
    { codigo: 'PC210', descripcion: 'Retenciones IR por Pagar (Art. 44 Reg. LCT)', cuentas: ['2.1.3'], signo: -1 as const, nivel: 1 },
    { codigo: 'PC220', descripcion: 'IR Anual por Pagar (30% - Art. 52 LCT)', cuentas: ['2.4.1'], signo: -1 as const, nivel: 1 },
    { codigo: 'PC300', descripcion: 'INSS Patronal/Laboral por Pagar (Ley 539)', cuentas: ['2.1.4'], signo: -1 as const, nivel: 1 },
    { codigo: 'PC310', descripcion: 'INATEC por Pagar (2% - Ley INATEC)', cuentas: ['2.1.5'], signo: -1 as const, nivel: 1 },
    { codigo: 'PC400', descripcion: 'Préstamos Bancarios Corto Plazo', cuentas: ['2.2.1'], signo: -1 as const, nivel: 1 },
    { codigo: 'PC500', descripcion: 'Otros Pasivos Corrientes', cuentas: ['2.1.9'], signo: -1 as const, nivel: 1 },
    { codigo: 'PC999', descripcion: 'TOTAL PASIVO CORRIENTE', cuentas: [] as string[], esSubtotal: true, nivel: 0, signo: -1 as const, componentes: ['PC100','PC200','PC210','PC220','PC300','PC310','PC400','PC500'] },
    { codigo: 'PNC100', descripcion: 'Préstamos Bancarios Largo Plazo', cuentas: ['2.2.2'], signo: -1 as const, nivel: 1 },
    { codigo: 'PNC200', descripcion: 'Prestaciones Sociales Acumuladas (Código del Trabajo)', cuentas: ['2.3.1'], signo: -1 as const, nivel: 1 },
    { codigo: 'PNC999', descripcion: 'TOTAL PASIVO NO CORRIENTE', cuentas: [] as string[], esSubtotal: true, nivel: 0, signo: -1 as const, componentes: ['PNC100','PNC200'] },
    { codigo: 'PT000', descripcion: 'TOTAL PASIVOS', cuentas: [] as string[], esTotal: true, nivel: 0, signo: -1 as const, componentes: ['PC999','PNC999'] },
  ],
  patrimonio: [
    { codigo: 'PA100', descripcion: 'Capital Social', cuentas: ['3.1.1'], signo: -1 as const, nivel: 1 },
    { codigo: 'PA200', descripcion: 'Reserva Legal (25% según Código de Comercio)', cuentas: ['3.1.2'], signo: -1 as const, nivel: 1 },
    { codigo: 'PA300', descripcion: 'Utilidades Retenidas de Ejercicios Anteriores', cuentas: ['3.2.1'], signo: -1 as const, nivel: 1 },
    { codigo: 'PA400', descripcion: 'Utilidad / Pérdida del Ejercicio', cuentas: ['3.2.2'], signo: -1 as const, nivel: 1 },
    { codigo: 'PA999', descripcion: 'TOTAL PATRIMONIO NETO', cuentas: [] as string[], esTotal: true, nivel: 0, signo: -1 as const, componentes: ['PA100','PA200','PA300','PA400'] },
    { codigo: 'PPA000', descripcion: 'TOTAL PASIVOS + PATRIMONIO', cuentas: [] as string[], esTotal: true, nivel: 0, signo: -1 as const, componentes: ['PT000','PA999'] },
  ]
}

// ─────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────
export interface FilaCalculada {
  codigo: string
  descripcion: string
  valor: number
  valorAnterior?: number
  esSubtotal: boolean
  esTotal: boolean
  nivel: number
}

// Usamos 'any' para el cliente Supabase para evitar conflictos de tipos
// entre el cliente del servidor y del navegador
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = any

// ─────────────────────────────────────────────────────────────────────
// FUNCIÓN CENTRAL DE SALDOS
// ─────────────────────────────────────────────────────────────────────
export async function getSaldoCuentas(
  supabase: SupabaseClientAny,
  empresaId: string,
  cuentas: string[],
  fechaInicio: Date,
  fechaFin: Date,
  acumulado: boolean = false
): Promise<number> {
  if (cuentas.length === 0) return 0

  const fechaInicioStr = fechaInicio.toISOString().split('T')[0]
  const fechaFinStr = fechaFin.toISOString().split('T')[0]

  const { data, error } = await supabase.rpc('get_saldos_multiple', {
    p_empresa_id: empresaId,
    p_cuentas: cuentas,
    p_fecha_inicio: fechaInicioStr,
    p_fecha_fin: fechaFinStr,
    p_acumulado: acumulado
  })

  if (error) {
    console.error('Error obteniendo saldo:', error)
    return 0
  }

  return data || 0
}

// ─────────────────────────────────────────────────────────────────────
// ESTADO DE RESULTADOS
// ─────────────────────────────────────────────────────────────────────
export async function calcularEstadoResultados(
  supabase: SupabaseClientAny,
  empresaId: string,
  fechaInicio: Date,
  fechaFin: Date,
  fechaInicioAnterior?: Date,
  fechaFinAnterior?: Date
): Promise<{ filas: FilaCalculada[], totales: Record<string, number> }> {
  const valores: Record<string, number> = {}
  const valoresAnt: Record<string, number> = {}

  for (const linea of ESTRUCTURA_ESTADO_RESULTADOS) {
    if (linea.cuentas && linea.cuentas.length > 0) {
      const saldo = await getSaldoCuentas(supabase, empresaId, linea.cuentas, fechaInicio, fechaFin)
      valores[linea.codigo] = saldo * linea.signo

      if (fechaInicioAnterior && fechaFinAnterior) {
        const saldoAnt = await getSaldoCuentas(supabase, empresaId, linea.cuentas, fechaInicioAnterior, fechaFinAnterior)
        valoresAnt[linea.codigo] = saldoAnt * linea.signo
      }
    }
  }

  const calcularComponente = (codigo: string, mapa: Record<string, number>): number => {
    const linea = ESTRUCTURA_ESTADO_RESULTADOS.find(l => l.codigo === codigo)
    if (!linea) return 0
    if (linea.cuentas && linea.cuentas.length > 0) return mapa[codigo] || 0
    if (!linea.componentes) return 0
    return linea.componentes.reduce((sum, comp) => sum + calcularComponente(comp, mapa), 0)
  }

  for (const linea of ESTRUCTURA_ESTADO_RESULTADOS) {
    if (!linea.cuentas || linea.cuentas.length === 0) {
      valores[linea.codigo] = calcularComponente(linea.codigo, valores)
      if (fechaInicioAnterior) valoresAnt[linea.codigo] = calcularComponente(linea.codigo, valoresAnt)
    }
  }

  const filas: FilaCalculada[] = ESTRUCTURA_ESTADO_RESULTADOS.map(linea => ({
    codigo: linea.codigo,
    descripcion: linea.descripcion,
    valor: valores[linea.codigo] || 0,
    valorAnterior: fechaInicioAnterior ? (valoresAnt[linea.codigo] || 0) : undefined,
    esSubtotal: linea.esSubtotal || false,
    esTotal: linea.esTotal || false,
    nivel: linea.nivel || 0,
  }))

  return {
    filas,
    totales: {
      ventas_netas: valores['I003'] || 0,
      utilidad_bruta: valores['I005'] || 0,
      utilidad_operativa: valores['G006'] || 0,
      utilidad_antes_ir: valores['R001'] || 0,
      utilidad_neta: valores['R004'] || 0,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// BALANCE GENERAL
// ─────────────────────────────────────────────────────────────────────
export async function calcularBalanceGeneral(
  supabase: SupabaseClientAny,
  empresaId: string,
  fechaCorte: Date,
): Promise<{
  activos: FilaCalculada[],
  pasivos: FilaCalculada[],
  patrimonio: FilaCalculada[],
  totales: Record<string, number>
}> {
  const inicio = new Date('2000-01-01')

  type LineaBG = {
    codigo: string
    descripcion: string
    cuentas: string[]
    signo: number
    nivel?: number
    esSubtotal?: boolean
    esTotal?: boolean
    componentes?: string[]
  }

  const calcularSeccion = async (
    lineas: LineaBG[],
    fechaFin: Date
  ): Promise<Record<string, number>> => {
    const valores: Record<string, number> = {}

    for (const linea of lineas) {
      if (linea.cuentas && linea.cuentas.length > 0) {
        const saldo = await getSaldoCuentas(supabase, empresaId, linea.cuentas, inicio, fechaFin, true)
        valores[linea.codigo] = saldo * linea.signo
      }
    }

    const calcComp = (codigo: string): number => {
      const l = lineas.find(x => x.codigo === codigo)
      if (!l) return 0
      if (l.cuentas && l.cuentas.length > 0) return valores[codigo] || 0
      if (!l.componentes) return 0
      return l.componentes.reduce((s: number, c: string) => s + calcComp(c), 0)
    }

    for (const linea of lineas) {
      if (!linea.cuentas || linea.cuentas.length === 0) {
        valores[linea.codigo] = calcComp(linea.codigo)
      }
    }

    return valores
  }

  const [vActivos, vPasivos, vPatrimonio] = await Promise.all([
    calcularSeccion(ESTRUCTURA_BALANCE_GENERAL.activos as LineaBG[], fechaCorte),
    calcularSeccion(ESTRUCTURA_BALANCE_GENERAL.pasivos as LineaBG[], fechaCorte),
    calcularSeccion(ESTRUCTURA_BALANCE_GENERAL.patrimonio as LineaBG[], fechaCorte),
  ])

  const toFilas = (lineas: LineaBG[], valores: Record<string, number>): FilaCalculada[] =>
    lineas.map(l => ({
      codigo: l.codigo,
      descripcion: l.descripcion,
      valor: valores[l.codigo] || 0,
      esSubtotal: l.esSubtotal || false,
      esTotal: l.esTotal || false,
      nivel: l.nivel || 0,
    }))

  return {
    activos: toFilas(ESTRUCTURA_BALANCE_GENERAL.activos, vActivos),
    pasivos: toFilas(ESTRUCTURA_BALANCE_GENERAL.pasivos, vPasivos),
    patrimonio: toFilas(ESTRUCTURA_BALANCE_GENERAL.patrimonio, vPatrimonio),
    totales: {
      total_activos: vActivos['AT000'] || 0,
      total_pasivos: vPasivos['PT000'] || 0,
      total_patrimonio: vPatrimonio['PA999'] || 0,
      total_pasivos_patrimonio: vPatrimonio['PPA000'] || 0,
      diferencia_cuadre: (vActivos['AT000'] || 0) - (vPatrimonio['PPA000'] || 0),
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// FLUJO DE EFECTIVO
// ─────────────────────────────────────────────────────────────────────
export async function calcularFlujoEfectivo(
  supabase: SupabaseClientAny,
  empresaId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<{ secciones: unknown[], totales: Record<string, number> }> {
  const [
    utilidadNeta, depreciacion, amortizacion,
    varCxC, varInventario, varCxP, varIVA, varRetenciones,
    activosFijosCompra, activosFijosVenta,
    prestamosRecibidos, prestamosPagados, aportesCapital,
    efectivoInicio, efectivoFin,
  ] = await Promise.all([
    getSaldoCuentas(supabase, empresaId, ['3.2.2'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['5.2.4'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['5.2.5'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['1.1.2'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['1.1.4'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['2.1.1'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['2.1.2'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['2.1.3'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['1.2.1'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['4.2.3'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['2.2'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['5.3.1'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['3.1'], fechaInicio, fechaFin),
    getSaldoCuentas(supabase, empresaId, ['1.1.1'], new Date('2000-01-01'), new Date(fechaInicio.getTime() - 86400000), true),
    getSaldoCuentas(supabase, empresaId, ['1.1.1'], new Date('2000-01-01'), fechaFin, true),
  ])

  const operativas_netas = utilidadNeta + depreciacion + amortizacion - varCxC - varInventario + varCxP + varIVA + varRetenciones
  const inversiones_netas = -activosFijosCompra + activosFijosVenta
  const financiamiento_neto = prestamosRecibidos - prestamosPagados + aportesCapital
  const variacion_neta = operativas_netas + inversiones_netas + financiamiento_neto

  return {
    secciones: [
      {
        titulo: 'A. ACTIVIDADES OPERATIVAS (Método Indirecto)',
        referencia: 'NIIF PYMES Sección 7.7-7.15',
        items: [
          { descripcion: 'Utilidad Neta del Período', valor: utilidadNeta, ajuste: false },
          { descripcion: 'Ajustes por partidas que no afectan efectivo:', valor: null, esEncabezado: true },
          { descripcion: '  (+) Depreciación (Art. 45 LCT)', valor: depreciacion, ajuste: true },
          { descripcion: '  (+) Amortización de Intangibles', valor: amortizacion, ajuste: true },
          { descripcion: 'Cambios en Capital de Trabajo:', valor: null, esEncabezado: true },
          { descripcion: '  (Aumento) / Disminución en Cuentas por Cobrar', valor: -varCxC, ajuste: true },
          { descripcion: '  (Aumento) / Disminución en Inventarios', valor: -varInventario, ajuste: true },
          { descripcion: '  Aumento / (Disminución) en Cuentas por Pagar', valor: varCxP, ajuste: true },
          { descripcion: '  Aumento / (Disminución) en IVA por Pagar (Art. 104 LCT)', valor: varIVA, ajuste: true },
          { descripcion: '  Aumento / (Disminución) en Retenciones por Pagar (Art. 44 Reg.)', valor: varRetenciones, ajuste: true },
        ],
        subtotal: operativas_netas,
        subtotalLabel: 'EFECTIVO NETO DE ACTIVIDADES OPERATIVAS'
      },
      {
        titulo: 'B. ACTIVIDADES DE INVERSIÓN',
        referencia: 'NIIF PYMES Sección 7.16-7.17',
        items: [
          { descripcion: '  Compra de Propiedad, Planta y Equipo', valor: -activosFijosCompra, ajuste: true },
          { descripcion: '  Ventas de Activos Fijos', valor: activosFijosVenta, ajuste: true },
        ],
        subtotal: inversiones_netas,
        subtotalLabel: 'EFECTIVO NETO DE ACTIVIDADES DE INVERSIÓN'
      },
      {
        titulo: 'C. ACTIVIDADES DE FINANCIAMIENTO',
        referencia: 'NIIF PYMES Sección 7.18-7.19',
        items: [
          { descripcion: '  Préstamos Bancarios Recibidos', valor: prestamosRecibidos, ajuste: true },
          { descripcion: '  Pago de Préstamos Bancarios', valor: -prestamosPagados, ajuste: true },
          { descripcion: '  Aportes de Capital', valor: aportesCapital, ajuste: true },
        ],
        subtotal: financiamiento_neto,
        subtotalLabel: 'EFECTIVO NETO DE ACTIVIDADES DE FINANCIAMIENTO'
      }
    ],
    totales: {
      operativas: operativas_netas,
      inversiones: inversiones_netas,
      financiamiento: financiamiento_neto,
      variacion_neta,
      efectivo_inicio: efectivoInicio,
      efectivo_fin: efectivoFin,
      conciliacion: efectivoFin - efectivoInicio - variacion_neta,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// UTILIDADES
// ─────────────────────────────────────────────────────────────────────
export function formatCordoba(valor: number, decimales: number = 2): string {
  const abs = Math.abs(valor)
  const formatted = abs.toLocaleString('es-NI', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  })
  return valor < 0 ? `(C$ ${formatted})` : `C$ ${formatted}`
}

export function calcularVariacion(actual: number, anterior: number): { valor: number, porcentaje: number } {
  const diferencia = actual - anterior
  const porcentaje = anterior !== 0 ? (diferencia / Math.abs(anterior)) * 100 : 0
  return { valor: diferencia, porcentaje }
}
