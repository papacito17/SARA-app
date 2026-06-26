// ============================================================
// SARA ERP — Asientos Automáticos de Nómina
// Genera partida doble completa al aprobar planilla
// Ley 539 · LCT · NIIF PYMES
// ============================================================

// Códigos de cuentas del plan SARA para nómina
const COD_NOMINA = {
  // Gastos (Débito al registrar planilla)
  SUELDOS:           '6.1.01',
  INSS_PATRONAL_GTO: '6.1.02',
  INATEC_GTO:        '6.1.03',
  VACACIONES_GTO:    '6.1.04',
  AGUINALDO_GTO:     '6.1.05',
  INDEMNIZACION_GTO: '6.1.06',

  // Pasivos (Crédito al registrar planilla)
  SUELDOS_POR_PAGAR:  '2.1.10',
  INSS_LABORAL_PP:    '2.1.08',
  INSS_PATRONAL_PP:   '2.1.07',
  INATEC_PP:          '2.1.09',
  IR_LABORAL_PP:      '2.1.11',
  VACACIONES_PP:      '2.1.12',
  AGUINALDO_PP:       '2.1.13',
  INDEMNIZACION_PP:   '2.1.14',

  // Activo (Débito al pagar nómina)
  BANCO_MN:           '1.1.03',
  CAJA:               '1.1.01',
} as const

interface CuentaRef {
  id:     string
  nombre: string
}
type CuentasMap = Record<string, CuentaRef>

async function getCuentas(
  supabase: any,
  empresaId: string,
  codigos: string[]
): Promise<CuentasMap> {
  const { data } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre')
    .eq('empresa_id', empresaId)
    .in('codigo', codigos)

  const map: CuentasMap = {}
  data?.forEach((c: any) => { map[c.codigo] = { id: c.id, nombre: c.nombre } })
  return map
}

async function crearAsiento(
  supabase: any,
  empresaId: string,
  datos: {
    fecha:            string
    concepto:         string
    tipo:             string
    referencia_tipo:  string
    referencia_id:    string
    referencia_num:   string
    lineas:           any[]
  }
) {
  // Verificar balance
  const totalDebe  = datos.lineas.reduce((s: number, l: any) => s + (l.debe || 0), 0)
  const totalHaber = datos.lineas.reduce((s: number, l: any) => s + (l.haber || 0), 0)

  if (Math.abs(totalDebe - totalHaber) > 0.01) {
    console.error('Asiento no cuadra:', { totalDebe, totalHaber })
    return null
  }

  // Obtener período contable
  const fechaDate = new Date(datos.fecha)
  const { data: periodo } = await supabase
    .from('periodos_contables')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('anio', fechaDate.getFullYear())
    .eq('mes', fechaDate.getMonth() + 1)
    .single()

  const { data: asiento, error } = await supabase
    .from('asientos_contables')
    .insert({
      empresa_id:       empresaId,
      periodo_id:       periodo?.id,
      fecha:            datos.fecha,
      concepto:         datos.concepto,
      tipo:             datos.tipo,
      referencia_tipo:  datos.referencia_tipo,
      referencia_id:    datos.referencia_id,
      referencia_num:   datos.referencia_num,
      total_debe:       totalDebe,
      total_haber:      totalHaber,
      estado:           'activo',
    })
    .select('id')
    .single()

  if (error || !asiento) {
    console.error('Error creando asiento nómina:', error)
    return null
  }

  const detalles = datos.lineas.map((l: any, i: number) => ({
    asiento_id:    asiento.id,
    empresa_id:    empresaId,
    cuenta_id:     l.cuenta_id,
    codigo_cuenta: l.codigo_cuenta,
    nombre_cuenta: l.nombre_cuenta,
    debe:          l.debe || 0,
    haber:         l.haber || 0,
    descripcion:   l.descripcion,
    orden:         i + 1,
  }))

  await supabase.from('asientos_detalle').insert(detalles)
  return asiento.id
}

// ─── ASIENTO 1: Registro de Planilla Mensual ─────────────────
/**
 * Genera el asiento de DEVENGADO de la planilla.
 *
 * DÉBITO:
 *   Sueldos y Salarios                = total_salarios_brutos
 *   INSS Patronal (gasto)             = total_inss_patronal
 *   INATEC (gasto)                    = total_inatec
 *   Vacaciones (provisión gasto)      = total_prov_vacaciones
 *   Aguinaldo (provisión gasto)       = total_prov_aguinaldo
 *   Indemnización (provisión gasto)   = total_prov_indemnizacion
 *
 * CRÉDITO:
 *   Sueldos y Salarios por Pagar      = neto_pagar
 *   INSS Laboral por Pagar            = total_inss_laboral
 *   INSS Patronal por Pagar           = total_inss_patronal
 *   INATEC por Pagar                  = total_inatec
 *   IR Laboral por Enterar            = total_ir_laboral
 *   Vacaciones por Pagar              = total_prov_vacaciones
 *   Aguinaldo por Pagar               = total_prov_aguinaldo
 *   Indemnización por Pagar           = total_prov_indemnizacion
 */
export async function crearAsientoPlanilla(
  supabase: any,
  empresaId: string,
  planilla: {
    id:                    string
    periodo_mes:           number
    periodo_anio:          number
    fecha_pago:            string
    total_salarios_brutos: number
    total_inss_laboral:    number
    total_inss_patronal:   number
    total_inatec:          number
    total_ir_laboral:      number
    total_neto_pagar:      number
    total_prov_vacaciones: number
    total_prov_aguinaldo:  number
    total_prov_indemnizacion: number
  }
) {
  const codigos = Object.values(COD_NOMINA)
  const cuentas = await getCuentas(supabase, empresaId, codigos)

  const p = planilla
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const nombrePeriodo = `${meses[p.periodo_mes - 1]} ${p.periodo_anio}`

  const lineas: any[] = []

  const addLinea = (
    codigo: string,
    debe: number,
    haber: number,
    descripcion: string
  ) => {
    if (!cuentas[codigo]) {
      console.warn(`Cuenta ${codigo} no encontrada en plan de cuentas`)
      return
    }
    if (debe === 0 && haber === 0) return
    lineas.push({
      cuenta_id:    cuentas[codigo].id,
      codigo_cuenta: codigo,
      nombre_cuenta: cuentas[codigo].nombre,
      debe:         round2(debe),
      haber:        round2(haber),
      descripcion,
    })
  }

  // ── DÉBITOS (gastos y provisiones) ─────────────────────────
  addLinea(COD_NOMINA.SUELDOS,
    p.total_salarios_brutos, 0,
    `Planilla sueldos ${nombrePeriodo}`)

  addLinea(COD_NOMINA.INSS_PATRONAL_GTO,
    p.total_inss_patronal, 0,
    `INSS Patronal 22.5% — ${nombrePeriodo}`)

  addLinea(COD_NOMINA.INATEC_GTO,
    p.total_inatec, 0,
    `INATEC 2% — ${nombrePeriodo}`)

  if (p.total_prov_vacaciones > 0) {
    addLinea(COD_NOMINA.VACACIONES_GTO,
      p.total_prov_vacaciones, 0,
      `Provisión vacaciones ${nombrePeriodo}`)
  }

  if (p.total_prov_aguinaldo > 0) {
    addLinea(COD_NOMINA.AGUINALDO_GTO,
      p.total_prov_aguinaldo, 0,
      `Provisión aguinaldo ${nombrePeriodo}`)
  }

  if (p.total_prov_indemnizacion > 0) {
    addLinea(COD_NOMINA.INDEMNIZACION_GTO,
      p.total_prov_indemnizacion, 0,
      `Provisión indemnización ${nombrePeriodo}`)
  }

  // ── CRÉDITOS (pasivos y retenciones) ───────────────────────
  addLinea(COD_NOMINA.SUELDOS_POR_PAGAR,
    0, p.total_neto_pagar,
    `Neto a pagar empleados ${nombrePeriodo}`)

  addLinea(COD_NOMINA.INSS_LABORAL_PP,
    0, p.total_inss_laboral,
    `INSS Laboral 7% retenido ${nombrePeriodo}`)

  addLinea(COD_NOMINA.INSS_PATRONAL_PP,
    0, p.total_inss_patronal,
    `INSS Patronal 22.5% por enterar ${nombrePeriodo}`)

  addLinea(COD_NOMINA.INATEC_PP,
    0, p.total_inatec,
    `INATEC 2% por enterar ${nombrePeriodo}`)

  if (p.total_ir_laboral > 0) {
    addLinea(COD_NOMINA.IR_LABORAL_PP,
      0, p.total_ir_laboral,
      `IR Laboral retenido ${nombrePeriodo}`)
  }

  if (p.total_prov_vacaciones > 0) {
    addLinea(COD_NOMINA.VACACIONES_PP,
      0, p.total_prov_vacaciones,
      `Provisión vacaciones ${nombrePeriodo}`)
  }

  if (p.total_prov_aguinaldo > 0) {
    addLinea(COD_NOMINA.AGUINALDO_PP,
      0, p.total_prov_aguinaldo,
      `Provisión aguinaldo ${nombrePeriodo}`)
  }

  if (p.total_prov_indemnizacion > 0) {
    addLinea(COD_NOMINA.INDEMNIZACION_PP,
      0, p.total_prov_indemnizacion,
      `Provisión indemnización ${nombrePeriodo}`)
  }

  return crearAsiento(supabase, empresaId, {
    fecha:           p.fecha_pago,
    concepto:        `Planilla de sueldos — ${nombrePeriodo}`,
    tipo:            'automatico_nomina',
    referencia_tipo: 'planilla',
    referencia_id:   p.id,
    referencia_num:  `PLAN-${p.periodo_anio}-${String(p.periodo_mes).padStart(2,'0')}`,
    lineas,
  })
}

// ─── ASIENTO 2: Pago de Nómina ───────────────────────────────
/**
 * Cancela Sueldos por Pagar contra Banco/Caja.
 *
 * DÉBITO:  Sueldos y Salarios por Pagar = total_neto_pagar
 * CRÉDITO: Banco Moneda Nacional         = total_neto_pagar
 */
export async function crearAsientoPagoNomina(
  supabase: any,
  empresaId: string,
  planilla: {
    id:              string
    periodo_mes:     number
    periodo_anio:    number
    fecha_pago:      string
    total_neto_pagar: number
    forma_pago:      'banco' | 'caja'
  }
) {
  const codigos = [
    COD_NOMINA.SUELDOS_POR_PAGAR,
    COD_NOMINA.BANCO_MN,
    COD_NOMINA.CAJA,
  ]
  const cuentas = await getCuentas(supabase, empresaId, codigos)
  const meses   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const nombrePeriodo = `${meses[planilla.periodo_mes - 1]} ${planilla.periodo_anio}`
  const ctaCredito    = planilla.forma_pago === 'banco'
    ? COD_NOMINA.BANCO_MN
    : COD_NOMINA.CAJA

  const lineas = [
    {
      cuenta_id:     cuentas[COD_NOMINA.SUELDOS_POR_PAGAR]?.id,
      codigo_cuenta: COD_NOMINA.SUELDOS_POR_PAGAR,
      nombre_cuenta: cuentas[COD_NOMINA.SUELDOS_POR_PAGAR]?.nombre,
      debe:          planilla.total_neto_pagar,
      haber:         0,
      descripcion:   `Pago nómina ${nombrePeriodo}`,
    },
    {
      cuenta_id:     cuentas[ctaCredito]?.id,
      codigo_cuenta: ctaCredito,
      nombre_cuenta: cuentas[ctaCredito]?.nombre,
      debe:          0,
      haber:         planilla.total_neto_pagar,
      descripcion:   `Pago nómina ${nombrePeriodo}`,
    },
  ]

  return crearAsiento(supabase, empresaId, {
    fecha:           planilla.fecha_pago,
    concepto:        `Pago nómina — ${nombrePeriodo}`,
    tipo:            'automatico_nomina_pago',
    referencia_tipo: 'planilla',
    referencia_id:   planilla.id,
    referencia_num:  `PAGO-${planilla.periodo_anio}-${String(planilla.periodo_mes).padStart(2,'0')}`,
    lineas,
  })
}

// ─── Helper ─────────────────────────────────────────────────
function round2(n: number): number {
  return Math.round(n * 100) / 100
}
