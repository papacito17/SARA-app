// src/app/api/estados-financieros/flujo-efectivo/route.ts
// SARA - API Flujo de Efectivo (Método Indirecto)
// NIIF PYMES Sección 7

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcularFlujoEfectivo } from '@/lib/estados-financieros'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get('empresa_id')
    const fechaInicio = searchParams.get('fecha_inicio')
    const fechaFin = searchParams.get('fecha_fin')

    if (!empresaId || !fechaInicio || !fechaFin) {
      return NextResponse.json({ error: 'Parámetros requeridos: empresa_id, fecha_inicio, fecha_fin' }, { status: 400 })
    }

    const { data: acceso } = await supabase
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('usuario_id', user.id)
      .eq('empresa_id', empresaId)
      .single()

    if (!acceso) return NextResponse.json({ error: 'Sin acceso a esta empresa' }, { status: 403 })

    const resultado = await calcularFlujoEfectivo(
      supabase, empresaId, new Date(fechaInicio), new Date(fechaFin)
    )

    const { data: empresa } = await supabase
      .from('empresas')
      .select('nombre, ruc')
      .eq('id', empresaId)
      .single()

    // Alerta de conciliación (debe ser 0)
    const conciliado = Math.abs(resultado.totales.conciliacion) < 0.01

    return NextResponse.json({
      empresa,
      periodo: { inicio: fechaInicio, fin: fechaFin },
      ...resultado,
      conciliado,
      alerta_conciliacion: !conciliado
        ? `Diferencia de conciliación: C$ ${resultado.totales.conciliacion.toFixed(2)}`
        : null,
      metadatos: {
        metodo: 'Indirecto',
        norma: 'NIIF PYMES Sección 7',
        generado_en: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error flujo efectivo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
