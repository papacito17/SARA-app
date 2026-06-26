// ============================================================
// Reporte INATEC — Factura mensual 2% sobre planilla
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
  if (!empresaId || !planillaId)
    return NextResponse.json({ error: 'empresa_id y planilla_id requeridos' }, { status: 400 })

  const { data: planilla } = await supabase
    .from('planillas').select('*').eq('id', planillaId).single()
  if (!planilla) return NextResponse.json({ error: 'Planilla no encontrada' }, { status: 404 })

  const { data: emp1 } = await supabase
    .from('empresas_persona_natural').select('*').eq('id', empresaId).maybeSingle()
  const { data: emp2 } = await supabase
    .from('empresas_juridicas').select('*').eq('id', empresaId).maybeSingle()
  const empresa = emp1 || emp2

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  return NextResponse.json({
    empresa_nombre:  (empresa as any)?.nombre_empresa || (empresa as any)?.nombre_completo || '',
    empresa_ruc:     (empresa as any)?.numero_ruc || '',
    periodo:         `${meses[planilla.periodo_mes - 1]} ${planilla.periodo_anio}`,
    total_planilla:  planilla.total_salarios_brutos,
    tasa_inatec:     0.02,
    monto_inatec:    planilla.total_inatec,
    numero_empleados: null, // se completa en frontend
    fecha_limite:    `17/${String(planilla.periodo_mes).padStart(2,'0')}/${planilla.periodo_anio}`,
    descripcion:     `Aporte mensual INATEC — Período ${meses[planilla.periodo_mes - 1]} ${planilla.periodo_anio}`,
    base_legal:      'Ley 114, Decreto 40-94, Art. 24 Ley 539',
  })
}
