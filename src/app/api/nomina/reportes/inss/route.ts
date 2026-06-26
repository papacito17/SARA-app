// ============================================================
// Reporte INSS — Formato Autodeterminación SIE INSS Nicaragua
// Vence día 17 de cada mes. Archivo xlsx conforme formato INSS.
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

  if (!empresaId || !planillaId) {
    return NextResponse.json({ error: 'empresa_id y planilla_id requeridos' }, { status: 400 })
  }

  // Datos planilla
  const { data: planilla } = await supabase
    .from('planillas')
    .select('*')
    .eq('id', planillaId)
    .eq('empresa_id', empresaId)
    .single()

  if (!planilla) return NextResponse.json({ error: 'Planilla no encontrada' }, { status: 404 })

  // Datos empresa
  const { data: empNat } = await supabase
    .from('empresas_persona_natural')
    .select('*')
    .eq('id', empresaId)
    .maybeSingle()

  const { data: empJur } = await supabase
    .from('empresas_juridicas')
    .select('*')
    .eq('id', empresaId)
    .maybeSingle()

  const empresa = empNat || empJur

  // Detalle con datos de empleados
  const { data: detalles } = await supabase
    .from('planilla_detalle')
    .select(`
      *,
      empleado:empleados(
        id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        numero_inss, cedula, regimen_inss, estado
      )
    `)
    .eq('planilla_id', planillaId)
    .order('empleado(primer_apellido)')

  // Construir reporte en formato SIE INSS
  // Columnas oficiales del archivo de autodeterminación INSS Nicaragua:
  // N° | Nº INSS | Nombre Completo | Salario | INSS Laboral | INSS Patronal | Estado | Días
  const filas = detalles?.map((d: any, i: number) => {
    const emp = d.empleado
    const nombreCompleto = [
      emp.primer_nombre,
      emp.segundo_nombre,
      emp.primer_apellido,
      emp.segundo_apellido,
    ].filter(Boolean).join(' ')

    return {
      numero_orden:    i + 1,
      numero_inss:     emp.numero_inss || '',
      cedula:          emp.cedula || '',
      nombre_completo: nombreCompleto,
      dias_cotizados:  d.dias_trabajados,
      salario_bruto:   d.salario_bruto,
      inss_laboral:    d.inss_laboral,    // 7%
      inss_patronal:   d.inss_patronal,   // 22.5%
      total_cotizacion: d.inss_laboral + d.inss_patronal,
      estado:          emp.estado === 'activo' ? 'A' : 'I',
      regimen:         emp.regimen_inss === 'integral' ? 'INT' : 'IVM',
    }
  }) ?? []

  const resumen = {
    empresa_nombre: (empresa as any)?.nombre_empresa || (empresa as any)?.nombre_completo || '',
    empresa_ruc:    (empresa as any)?.numero_ruc || '',
    periodo:        `${String(planilla.periodo_mes).padStart(2,'0')}/${planilla.periodo_anio}`,
    periodo_mes:    planilla.periodo_mes,
    periodo_anio:   planilla.periodo_anio,
    total_empleados: filas.length,
    total_salarios:  planilla.total_salarios_brutos,
    total_inss_laboral:  planilla.total_inss_laboral,
    total_inss_patronal: planilla.total_inss_patronal,
    total_cotizacion:    planilla.total_inss_laboral + planilla.total_inss_patronal,
    fecha_limite_pago:   `17/${String(planilla.periodo_mes).padStart(2,'0')}/${planilla.periodo_anio}`,
  }

  return NextResponse.json({ resumen, filas })
}
