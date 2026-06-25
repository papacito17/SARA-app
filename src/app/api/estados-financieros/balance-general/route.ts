// src/app/api/estados-financieros/balance-general/route.ts
// SARA - API Balance General (Estado de Situación Financiera)
// NIIF PYMES Sección 4 | LCT Nicaragua

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calcularBalanceGeneral } from '@/lib/estados-financieros'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get('empresa_id')
    const fechaCorte = searchParams.get('fecha_corte')
    const comparativo = searchParams.get('comparativo') === 'true'

    if (!empresaId || !fechaCorte) {
      return NextResponse.json({ error: 'Parámetros requeridos: empresa_id, fecha_corte' }, { status: 400 })
    }

    const { data: acceso } = await supabase
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('usuario_id', user.id)
      .eq('empresa_id', empresaId)
      .single()

    if (!acceso) return NextResponse.json({ error: 'Sin acceso a esta empresa' }, { status: 403 })

    const corte = new Date(fechaCorte)
    let corteAnterior: Date | undefined
    if (comparativo) {
      corteAnterior = new Date(corte)
      corteAnterior.setFullYear(corteAnterior.getFullYear() - 1)
    }

    const resultado = await calcularBalanceGeneral(supabase, empresaId, corte, corteAnterior)

    const { data: empresa } = await supabase
      .from('empresas')
      .select('nombre, ruc, actividad_economica')
      .eq('id', empresaId)
      .single()

    // Verificar cuadre contable (Activos = Pasivos + Patrimonio)
    const cuadrado = Math.abs(resultado.totales.diferencia_cuadre) < 0.01

    return NextResponse.json({
      empresa,
      fecha_corte: fechaCorte,
      fechaCorteAnterior: corteAnterior?.toISOString().split('T')[0],
      ...resultado,
      cuadrado,
      alerta_cuadre: !cuadrado ? `Diferencia de C$ ${resultado.totales.diferencia_cuadre.toFixed(2)} - Revisar asientos contables` : null,
      metadatos: {
        norma: 'NIIF PYMES Sección 4',
        referencia_fiscal: 'LCT Art. 103-110, Ley 562 Art. 69',
        moneda: 'Córdobas (C$)',
        generado_en: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error balance general:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { empresa_id, fecha_corte, notas } = body

    const resultado = await calcularBalanceGeneral(supabase, empresa_id, new Date(fecha_corte))

    const { data, error } = await supabase
      .from('estados_financieros')
      .insert({
        empresa_id,
        tipo_estado: 'balance_general',
        fecha_inicio: fecha_corte,
        fecha_fin: fecha_corte,
        datos_json: resultado,
        total_activos: resultado.totales.total_activos,
        total_pasivos: resultado.totales.total_pasivos,
        total_patrimonio: resultado.totales.total_patrimonio,
        generado_por: user.id,
        notas,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id, ...resultado }, { status: 201 })
  } catch (error) {
    console.error('Error guardando balance general:', error)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
