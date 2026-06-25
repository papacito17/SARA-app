// src/app/api/estados-financieros/cambios-patrimonio/route.ts
// SARA - API Estado de Cambios en el Patrimonio
// NIIF PYMES Sección 6

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSaldoCuentas } from '@/lib/estados-financieros'

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
      return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 })
    }

    const { data: acceso } = await supabase
      .from('usuarios_empresa')
      .select('empresa_id')
      .eq('usuario_id', user.id)
      .eq('empresa_id', empresaId)
      .single()

    if (!acceso) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    const inicioHist = new Date('2000-01-01')

    // Saldos al inicio del período (histórico hasta fecha_inicio - 1 día)
    const diaAntes = new Date(inicio.getTime() - 86400000)

    const [
      capitalInicio, capitalMovimiento, capitalFin,
      reservaInicio, reservaMovimiento, reservaFin,
      utilRetInicio, utilRetMovimiento, utilRetFin,
      utilEjercicio,
    ] = await Promise.all([
      getSaldoCuentas(supabase, empresaId, ['3.1.1'], inicioHist, diaAntes, true),
      getSaldoCuentas(supabase, empresaId, ['3.1.1'], inicio, fin),
      getSaldoCuentas(supabase, empresaId, ['3.1.1'], inicioHist, fin, true),
      getSaldoCuentas(supabase, empresaId, ['3.1.2'], inicioHist, diaAntes, true),
      getSaldoCuentas(supabase, empresaId, ['3.1.2'], inicio, fin),
      getSaldoCuentas(supabase, empresaId, ['3.1.2'], inicioHist, fin, true),
      getSaldoCuentas(supabase, empresaId, ['3.2.1'], inicioHist, diaAntes, true),
      getSaldoCuentas(supabase, empresaId, ['3.2.1'], inicio, fin),
      getSaldoCuentas(supabase, empresaId, ['3.2.1'], inicioHist, fin, true),
      getSaldoCuentas(supabase, empresaId, ['3.2.2'], inicio, fin),
    ])

    const totalInicio = capitalInicio + reservaInicio + utilRetInicio
    const totalFin = capitalFin + reservaFin + utilRetFin + utilEjercicio

    const { data: empresa } = await supabase
      .from('empresas')
      .select('nombre, ruc')
      .eq('id', empresaId)
      .single()

    return NextResponse.json({
      empresa,
      periodo: { inicio: fechaInicio, fin: fechaFin },
      columnas: [
        'Capital Social',
        'Reserva Legal (25% - Cód. Comercio)',
        'Utilidades Retenidas',
        'Utilidad del Ejercicio',
        'TOTAL'
      ],
      filas: [
        {
          concepto: 'Saldo al inicio del período',
          capital: -capitalInicio,
          reserva: -reservaInicio,
          utilidades_retenidas: -utilRetInicio,
          utilidad_ejercicio: 0,
          total: -totalInicio,
        },
        {
          concepto: 'Aportes de Capital',
          capital: -capitalMovimiento,
          reserva: 0,
          utilidades_retenidas: 0,
          utilidad_ejercicio: 0,
          total: -capitalMovimiento,
        },
        {
          concepto: 'Constitución de Reserva Legal',
          capital: 0,
          reserva: -reservaMovimiento,
          utilidades_retenidas: 0,
          utilidad_ejercicio: 0,
          total: -reservaMovimiento,
        },
        {
          concepto: 'Aplicación de Utilidades Retenidas',
          capital: 0,
          reserva: 0,
          utilidades_retenidas: -utilRetMovimiento,
          utilidad_ejercicio: 0,
          total: -utilRetMovimiento,
        },
        {
          concepto: 'Utilidad / (Pérdida) Neta del Período',
          capital: 0,
          reserva: 0,
          utilidades_retenidas: 0,
          utilidad_ejercicio: -utilEjercicio,
          total: -utilEjercicio,
          esResultado: true,
        },
        {
          concepto: 'Saldo al final del período',
          capital: -capitalFin,
          reserva: -reservaFin,
          utilidades_retenidas: -utilRetFin,
          utilidad_ejercicio: -utilEjercicio,
          total: -totalFin,
          esTotal: true,
        },
      ],
      totales: {
        patrimonio_inicio: -totalInicio,
        patrimonio_fin: -totalFin,
        variacion: (-totalFin) - (-totalInicio),
      },
      metadatos: {
        norma: 'NIIF PYMES Sección 6',
        nota_reserva: 'Reserva Legal: 25% de la utilidad neta según Código de Comercio de Nicaragua',
        generado_en: new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error('Error cambios patrimonio:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
