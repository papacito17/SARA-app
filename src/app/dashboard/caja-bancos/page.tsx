'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, nombreMes } from '@/lib/utils'
import { Building2, Download, Eye, Loader2, PiggyBank, TrendingDown, TrendingUp, X } from 'lucide-react'
import { toast } from 'sonner'

/* ─── Tipos ────────────────────────────────────────────── */
interface CuentaCaja  { id: string; nombre: string; tipo: string; moneda: string; saldo_actual: number; saldo_inicial: number }
interface CuentaBanco { id: string; nombre: string; banco?: string; numero_cuenta?: string; tipo: string; moneda: string; saldo_actual: number }
interface MovCaja     { id: string; tipo: 'ingreso'|'egreso'; monto: number; descripcion: string; fecha: string; cuenta_caja?: { nombre: string; tipo: string } }
interface TxBanco     { id: string; tipo: string; monto: number; descripcion: string; fecha: string; referencia?: string; cuenta_banco?: { nombre: string; banco?: string } }

interface DatosCajaBancos {
  empresa: { nombre: string; ruc: string }
  mes: number; anio: number
  cuentasCaja: CuentaCaja[]
  cuentasBanco: CuentaBanco[]
  movimientosCaja: MovCaja[]
  transaccionesBanco: TxBanco[]
}

/* ─── Estilos Excel ─────────────────────────────────────── */
const THIN = { style: 'thin', color: { rgb: 'CBD5E0' } }
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN }
const S_HDR   = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10, name: 'Calibri' }, fill: { patternType: 'solid', fgColor: { rgb: '1B3A5C' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: BORDER }
const S_EVEN  = { font: { sz: 9, name: 'Calibri' }, fill: { patternType: 'solid', fgColor: { rgb: 'EBF5FB' } }, alignment: { vertical: 'center' }, border: BORDER }
const S_ODD   = { font: { sz: 9, name: 'Calibri' }, fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } }, alignment: { vertical: 'center' }, border: BORDER }
const S_TOT   = { font: { bold: true, sz: 9, name: 'Calibri' }, fill: { patternType: 'solid', fgColor: { rgb: 'D4E6F1' } }, alignment: { horizontal: 'right' }, border: BORDER }
const S_TITL  = { font: { bold: true, sz: 13, name: 'Calibri', color: { rgb: '1B3A5C' } }