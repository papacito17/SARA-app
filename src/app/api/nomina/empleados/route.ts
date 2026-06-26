import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase   = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const empresaId = searchParams.get('empresa_id')
  const estado    = searchParams.get('estado') || 'activo'

  if (!empresaId) return NextResponse.json({ error: 'empresa_id requerido' }, { status: 400 })

  let query = supabase
    .from('empleados')
    .select(`
      *,
      cargo:cargos(id, nombre, departamento)
    `)
    .eq('empresa_id', empresaId)
    .order('primer_apellido')

  if (estado !== 'todos') {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('empleados')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Crear registro de prestaciones sociales inicial
  await supabase.from('prestaciones_sociales').insert({
    empresa_id:  body.empresa_id,
    empleado_id: data.id,
  })

  return NextResponse.json(data, { status: 201 })
}
