// ============================================================
// Reporte IR Laboral — para declaración VET DGI
// Constancias de retención individuales
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const empresaId  = searchParams.get('empresa_id')
  const planillaId = searchParams.get('planilla_id')
  const anio       = searchParams.get('anio')  // para constancias anuales
  const tipo       = searchParams.get('tipo') || 'mensual' // 'mensual' | 'anual'

  if (!empresaId) return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })

  const { data: emp1 } = await supabase
    .from('empresas_persona_natural').select('*').eq('id', empresaId).maybeSingle()
  const { data: emp2 } = await supabase
    .from('empresas_juridicas').select('*').eq('id', empresaId).maybeSingle()
  const empresa = emp1 || emp2

  if (tipo === 'anual' && anio) {
    // Constancias anuales de retención (para entregar a cada empleado)
    const { data: acumulados } = await supabase
      .from('ir_laboral_acumulado')
      .select(`
        *,
        empleado:empleados(
          id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
          cedula, numero_inss
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('anio_fiscal', parseInt(anio))
      .order('mes')

    // Agrupar por empleado
    const porEmpleado: Record<string, any> = {}
    acumulados?.forEach((row: any) => {
      const eid = row.empleado_id
      if (!porEmpleado[eid]) {
        porEmpleado[eid] = {
          empleado: row.empleado,
          meses:    [],
          total_bruto:     0,
          total_inss:      0,
          total_gravable:  0,
          total_ir:        0,
        }
      }
      porEmpleado[eid].meses.push(row)
      porEmpleado[eid].total_bruto    += row.salario_bruto
      porEmpleado[eid].total_inss     += row.inss_laboral
      porEmpleado[eid].total_gravable += row.renta_gravable
      porEmpleado[eid].total_ir       += row.ir_retenido
    })

    return NextResponse.json({
      empresa_nombre: (empresa as any)?.nombre_empresa || (empresa as any)?.nombre_completo || '',
      empresa_ruc:    (empresa as any)?.numero_ruc || '',
      anio_fiscal:    anio,
      constancias:    Object.values(porEmpleado),
    })
  }

  // Reporte mensual
  if (!planillaId) return NextResponse.json({ error: 'planilla_id requerido' }, { status: 400 })

  const { data: planilla } = await supabase
    .from('planillas').select('*').eq('id', planillaId).single()
  if (!planilla) return NextResponse.json({ error: 'Planilla no encontrada' }, { status: 404 })

  const { data: detalles } = await supabase
    .from('planilla_detalle')
    .select(`
      *,
      empleado:empleados(
        id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        cedula, numero_inss
      )
    `)
    .eq('planilla_id', planillaId)
    .order('empleado(primer_apellido)')

  const filas = detalles
    ?.filter((d: any) => d.ir_laboral > 0)
    .map((d: any, i: number) => {
      const emp = d.empleado
      return {
        numero:          i + 1,
        nombre_completo: [emp.primer_nombre, emp.segundo_nombre,
                          emp.primer_apellido, emp.segundo_apellido]
                          .filter(Boolean).join(' '),
        cedula:          emp.cedula || '',
        salario_bruto:   d.salario_bruto,
        inss_laboral:    d.inss_laboral,
        renta_gravable:  d.salario_bruto - d.inss_laboral,
        ir_retenido:     d.ir_laboral,
      }
    }) ?? []

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return NextResponse.json({
    empresa_nombre:    (empresa as any)?.nombre_empresa || (empresa as any)?.nombre_completo || '',
    empresa_ruc:       (empresa as any)?.numero_ruc || '',
    periodo:           `${meses[planilla.periodo_mes - 1]} ${planilla.periodo_anio}`,
    total_ir_retenido: planilla.total_ir_laboral,
    filas,
    // Nota: para VET se reporta en Declaración Mensual IR Empleador
    // Formulario 124 DGI — sección retenciones definitivas en la fuente
    base_legal:        'LCT Art. 23 — Rentas del Trabajo',
  })
}
