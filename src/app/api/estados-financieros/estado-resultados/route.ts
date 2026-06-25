// src/app/api/estados-financieros/estado-resultados/route.ts
// SARA - API Estado de Resultados
// NIIF PYMES Sección 5 | LCT art. 43-54 | Formulario IR 106

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcularEstadoResultados } from '@/lib/estados-financieros'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get('empresa_id')
    const fechaInicio = searchParams.get('fecha_inicio')
    const fechaFin = searchParams.get('fecha_fin')
    const comparativo = searchParams.get('comparativo') === 'true'

    if (!empresaId || !fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Parámetros requeridos: empresa_id, fecha_inicio, fecha_fin' }, { status: 400 })
    }

    // Verificar acceso a la empresa
    const { data: acceso } = await supabase
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('usuario_id', user.id)
      .eq('empresa_id', empresaId)
      .single()

    if (!acceso) return NextResponse.json({ error: 'Sin acceso a esta empresa' }, { status: 403 })

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)

    // Período comparativo: mismo rango del año anterior
    let inicioAnt: Date | undefined
    let finAnt: Date | undefined
    if (comparativo) {
      inicioAnt = new Date(inicio)
      inicioAnt.setFullYear(inicioAnt.getFullYear() - 1)
      finAnt = new Date(fin)
      finAnt.setFullYear(finAnt.getFullYear() - 1)
    }

    const resultado = await calcularEstadoResultados(
      supabase, empresaId, inicio, fin, inicioAnt, finAnt
    )

    // Obtener datos de la empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('nombre, ruc, actividad_economica')
      .eq('id', empresaId)
      .single()

    return NextResponse.json({
      empresa,
      periodo: { inicio: fechaInicio, fin: fechaFin },
      periodoAnterior: comparativo ? {
        inicio: inicioAnt?.toISOString().split('T')[0],
        fin: finAnt?.toISOString().split('T')[0]
      } : null,
      ...resultado,
      metadatos: {
        norma: 'NIIF PYMES Sección 5',
        referencia_fiscal: 'LCT Art. 43-54, Formulario DGI 106',
        moneda: 'Córdobas (C$)',
        generado_en: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error estado resultados:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { empresa_id, fecha_inicio, fecha_fin, notas } = body

    const resultado = await calcularEstadoResultados(
      supabase,
      empresa_id,
      new Date(fecha_inicio),
      new Date(fecha_fin)
    )

    // Guardar snapshot del estado
    const { data, error } = await supabase
      .from('estados_financieros')
      .insert({
        empresa_id,
        tipo_estado: 'estado_resultados',
        fecha_inicio,
        fecha_fin,
        datos_json: { filas: resultado.filas },
        total_ingresos: resultado.totales.ventas_netas,
        total_gastos: resultado.totales.ventas_netas - resultado.totales.utilidad_neta,
        utilidad_neta: resultado.totales.utilidad_neta,
        generado_por: user.id,
        notas,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id, ...resultado }, { status: 201 })
  } catch (error) {
    console.error('Error guardando estado resultados:', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
