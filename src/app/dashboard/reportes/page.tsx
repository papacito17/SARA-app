"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { formatCurrency, nombreMes } from "@/lib/utils";
import { BarChart3, Download, Eye, FileSpreadsheet, Loader2, X } from "lucide-react";
import { toast } from "sonner";

/* ─── tipos ──────────────────────────────────────────────── */
interface MesData {
  mes: number; anio: number;
  ventas: number; ivaVentas: number;
  compras: number; ivaCompras: number;
  totalFacturas: number; totalCompras: number;
}

interface VentaRow { numero_factura: string; fecha_emision: string; cliente_nombre: string; cliente_ruc: string; subtotal: number; iva_total: number; total: number; }
interface CompraRow { numero_compra: string; fecha_compra: string; proveedor_nombre: string; proveedor_ruc: string; subtotal: number; iva_total: number; total: number; tipo_proveedor: string; }
interface DatosReporte { ventas?: VentaRow[]; compras?: CompraRow[]; empresa: { nombre: string; ruc: string }; mes: number; anio: number; }

/* ─── estilos xlsx-js-style ──────────────────────────────── */
const THIN = { style: "thin", color: { rgb: "CBD5E0" } };
const BORDER = { top: THIN, bottom: THIN, left: THIN, right: THIN };
const S_HDR = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Calibri" }, fill: { patternType: "solid", fgColor: { rgb: "1B3A5C" } }, alignment: { horizontal: "center", vertical: "center" }, border: BORDER };
const S_SUBHDR = { font: { bold: true, sz: 10, name: "Calibri" }, fill: { patternType: "solid", fgColor: { rgb: "2E6DA4" }, }, alignment: { horizontal: "left", vertical: "center" }, border: BORDER };
const S_EVEN = { font: { sz: 9, name: "Calibri" }, fill: { patternType: "solid", fgColor: { rgb: "EBF5FB" } }, alignment: { vertical: "center" }, border: BORDER };
const S_ODD  = { font: { sz: 9, name: "Calibri" }, fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } }, alignment: { vertical: "center" }, border: BORDER };
const S_TOT  = { font: { bold: true, sz: 9, name: "Calibri" }, fill: { patternType: "solid", fgColor: { rgb: "D4E6F1" } }, alignment: { horizontal: "right", vertical: "center" }, border: BORDER };
const S_TITL = { font: { bold: true, sz: 13, name: "Calibri", color: { rgb: "1B3A5C" } }, alignment: { horizontal: "center", vertical: "center" } };
const S_SUB  = { font: { sz: 10, name: "Calibri", color: { rgb: "555555" } }, alignment: { horizontal: "center", vertical: "center" } };

function styleSheet(ws: Record<string, unknown>, totalRows: number, totalCols: number, headerRow = 0) {
  for (let R = 0; R <= totalRows; R++) {
    for (let C = 0; C < totalCols; C++) {
      const addr = `${String.fromCharCode(65 + C)}${R + 1}`;
      if (!(ws as Record<string, unknown>)[addr] || typeof (ws as Record<string, unknown>)[addr] !== "object") continue;
      const cell = (ws as Record<string, Record<string, unknown>>)[addr];
      if (R === headerRow) cell.s = S_HDR;
      else if (R % 2 === 0) cell.s = S_EVEN;
      else cell.s = S_ODD;
    }
  }
}

/* ─── Preview: contenido según tipo ─────────────────────── */
function PreviewContent({ tipo, datos }: { tipo: string; datos: DatosReporte }) {
  const ventas = datos.ventas ?? [];
  const compras = datos.compras ?? [];

  if (tipo === "ingresos" || tipo === "ventas") {
    const baseIVA   = ventas.reduce((s, v) => s + v.subtotal, 0);
    const totalBruto = ventas.reduce((s, v) => s + v.total, 0);
    const resumen = [
      ["Base Imponible para IVA",           baseIVA],
      ["Ingresos gravados del mes (15%)",   baseIVA],
      ["Base Imponible PMD / Anticipo",     totalBruto],
      ["Ingresos brutos del mes",           totalBruto],
    ];
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {resumen.map(([label, val]) => (
            <div key={String(label)} className="bg-slate-50 rounded-lg p-3 flex justify-between items-center gap-4">
              <span className="text-xs text-slate-600">{String(label)}</span>
              <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">{formatCurrency(Number(val))}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 mb-2 text-sm">Facturas del período ({ventas.length})</h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead><tr className="bg-blue-800 text-white">
                {["N° Factura","Fecha","Cliente","Subtotal","IVA","Total"].map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {ventas.length === 0
                  ? <tr><td colSpan={6} className="text-center py-6 text-slate-400">Sin facturas en este período</td></tr>
                  : ventas.map((v, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                      <td className="px-3 py-1.5 font-mono">{v.numero_factura}</td>
                      <td className="px-3 py-1.5">{v.fecha_emision}</td>
                      <td className="px-3 py-1.5 max-w-[160px] truncate">{v.cliente_nombre}</td>
                      <td className="px-3 py-1.5 text-right">{formatCurrency(v.subtotal)}</td>
                      <td className="px-3 py-1.5 text-right text-blue-700">{formatCurrency(v.iva_total)}</td>
                      <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(v.total)}</td>
                    </tr>
                  ))}
                {ventas.length > 0 && (
                  <tr className="bg-blue-100 font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right text-xs text-slate-600">TOTALES</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(ventas.reduce((s,v)=>s+v.subtotal,0))}</td>
                    <td className="px-3 py-2 text-right text-blue-700">{formatCurrency(ventas.reduce((s,v)=>s+v.iva_total,0))}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(ventas.reduce((s,v)=>s+v.total,0))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (tipo === "credito") {
    return (
      <div>
        <p className="text-xs text-slate-500 mb-3">Crédito Fiscal IVA — Renglón 105</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead><tr className="bg-purple-800 text-white">
              {["RUC","Nombre / Razón Social","N° Documento","Fecha","Sin IVA","IVA","Renglón"].map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {compras.length === 0
                ? <tr><td colSpan={7} className="text-center py-6 text-slate-400">Sin compras con IVA en este período</td></tr>
                : compras.map((c, i) => {
                    const fp = c.fecha_compra?.split("-") ?? [];
                    const fecha = fp.length === 3 ? `${fp[2]}/${fp[1]}/${fp[0].slice(2)}` : c.fecha_compra;
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-purple-50" : "bg-white"}>
                        <td className="px-3 py-1.5 font-mono">{c.proveedor_ruc}</td>
                        <td className="px-3 py-1.5 max-w-[160px] truncate">{c.proveedor_nombre}</td>
                        <td className="px-3 py-1.5 font-mono">{c.numero_compra}</td>
                        <td className="px-3 py-1.5">{fecha}</td>
                        <td className="px-3 py-1.5 text-right">{formatCurrency(c.subtotal)}</td>
                        <td className="px-3 py-1.5 text-right text-purple-700">{formatCurrency(c.iva_total)}</td>
                        <td className="px-3 py-1.5 text-center">105</td>
                      </tr>
                    );
                  })}
              {compras.length > 0 && (
                <tr className="bg-purple-100 font-semibold">
                  <td colSpan={4} className="px-3 py-2 text-right text-xs text-slate-600">TOTALES</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(compras.reduce((s,c)=>s+c.subtotal,0))}</td>
                  <td className="px-3 py-2 text-right text-purple-700">{formatCurrency(compras.reduce((s,c)=>s+c.iva_total,0))}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tipo === "retenciones") {
    const naturales = compras.filter(c => c.tipo_proveedor === "natural");
    return (
      <div>
        <p className="text-xs text-slate-500 mb-3">Retenciones en la Fuente IR 2% — Código 22 · Personas naturales</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead><tr className="bg-amber-700 text-white">
              {["RUC","Nombre","N° Documento","Fecha","Base Imponible","IR 2%","Cód"].map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {naturales.length === 0
                ? <tr><td colSpan={7} className="text-center py-6 text-slate-400">Sin compras a personas naturales en este período</td></tr>
                : naturales.map((c, i) => {
                    const fp = c.fecha_compra?.split("-") ?? [];
                    const fecha = fp.length === 3 ? `${fp[2]}/${fp[1]}/${fp[0].slice(2)}` : c.fecha_compra;
                    const ir = +(c.subtotal * 0.02).toFixed(2);
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-amber-50" : "bg-white"}>
                        <td className="px-3 py-1.5 font-mono">{c.proveedor_ruc}</td>
                        <td className="px-3 py-1.5 max-w-[160px] truncate">{c.proveedor_nombre}</td>
                        <td className="px-3 py-1.5 font-mono">{c.numero_compra}</td>
                        <td className="px-3 py-1.5">{fecha}</td>
                        <td className="px-3 py-1.5 text-right">{formatCurrency(c.subtotal)}</td>
                        <td className="px-3 py-1.5 text-right text-amber-700 font-medium">{formatCurrency(ir)}</td>
                        <td className="px-3 py-1.5 text-center">22</td>
                      </tr>
                    );
                  })}
              {naturales.length > 0 && (
                <tr className="bg-amber-100 font-semibold">
                  <td colSpan={4} className="px-3 py-2 text-right text-xs text-slate-600">TOTALES</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(naturales.reduce((s,c)=>s+c.subtotal,0))}</td>
                  <td className="px-3 py-2 text-right text-amber-700">{formatCurrency(naturales.reduce((s,c)=>s+(c.subtotal*0.02),0))}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tipo === "libro_ventas") {
    return (
      <div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead><tr className="bg-green-800 text-white">
              {["Fecha","N° Factura","Cliente","RUC / Cédula","Subtotal","IVA 15%","Exento","Total"].map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {ventas.length === 0
                ? <tr><td colSpan={8} className="text-center py-6 text-slate-400">Sin facturas en este período</td></tr>
                : ventas.map((v, i) => {
                    const fp = v.fecha_emision?.split("-") ?? [];
                    const fecha = fp.length === 3 ? `${fp[2]}/${fp[1]}/${fp[0]}` : v.fecha_emision;
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-green-50" : "bg-white"}>
                        <td className="px-3 py-1.5">{fecha}</td>
                        <td className="px-3 py-1.5 font-mono">{v.numero_factura}</td>
                        <td className="px-3 py-1.5 max-w-[140px] truncate">{v.cliente_nombre}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{v.cliente_ruc}</td>
                        <td className="px-3 py-1.5 text-right">{formatCurrency(v.subtotal)}</td>
                        <td className="px-3 py-1.5 text-right text-green-700">{formatCurrency(v.iva_total)}</td>
                        <td className="px-3 py-1.5 text-right">C$0.00</td>
                        <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(v.total)}</td>
                      </tr>
                    );
                  })}
              {ventas.length > 0 && (
                <tr className="bg-green-100 font-semibold">
                  <td colSpan={4} className="px-3 py-2 text-right text-xs text-slate-600">TOTALES</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(ventas.reduce((s,v)=>s+v.subtotal,0))}</td>
                  <td className="px-3 py-2 text-right text-green-700">{formatCurrency(ventas.reduce((s,v)=>s+v.iva_total,0))}</td>
                  <td className="px-3 py-2 text-right">C$0.00</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(ventas.reduce((s,v)=>s+v.total,0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (tipo === "libro_compras") {
    return (
      <div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead><tr className="bg-teal-800 text-white">
              {["Fecha","N° Comprobante","Proveedor","RUC","Sin IVA","IVA","Total","IR 2%","Tipo"].map(h => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {compras.length === 0
                ? <tr><td colSpan={9} className="text-center py-6 text-slate-400">Sin compras en este período</td></tr>
                : compras.map((c, i) => {
                    const fp = c.fecha_compra?.split("-") ?? [];
                    const fecha = fp.length === 3 ? `${fp[2]}/${fp[1]}/${fp[0]}` : c.fecha_compra;
                    const ir = c.tipo_proveedor === "natural" ? +(c.subtotal * 0.02).toFixed(2) : 0;
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-teal-50" : "bg-white"}>
                        <td className="px-3 py-1.5">{fecha}</td>
                        <td className="px-3 py-1.5 font-mono">{c.numero_compra}</td>
                        <td className="px-3 py-1.5 max-w-[140px] truncate">{c.proveedor_nombre}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{c.proveedor_ruc}</td>
                        <td className="px-3 py-1.5 text-right">{formatCurrency(c.subtotal)}</td>
                        <td className="px-3 py-1.5 text-right text-teal-700">{formatCurrency(c.iva_total)}</td>
                        <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(c.total)}</td>
                        <td className="px-3 py-1.5 text-right text-amber-700">{ir > 0 ? formatCurrency(ir) : "—"}</td>
                        <td className="px-3 py-1.5">{c.tipo_proveedor === "natural" ? "Natural" : "Jurídica"}</td>
                      </tr>
                    );
                  })}
              {compras.length > 0 && (
                <tr className="bg-teal-100 font-semibold">
                  <td colSpan={4} className="px-3 py-2 text-right text-xs text-slate-600">TOTALES</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(compras.reduce((s,c)=>s+c.subtotal,0))}</td>
                  <td className="px-3 py-2 text-right text-teal-700">{formatCurrency(compras.reduce((s,c)=>s+c.iva_total,0))}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(compras.reduce((s,c)=>s+c.total,0))}</td>
                  <td className="px-3 py-2 text-right text-amber-700">{formatCurrency(compras.filter(c=>c.tipo_proveedor==="natural").reduce((s,c)=>s+(c.subtotal*0.02),0))}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Página Principal ───────────────────────────────────── */
export default function ReportesPage() {
  const [meses,   setMeses]   = useState<MesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [descargando,     setDescargando]     = useState<string | null>(null);
  const [loadingPreview,  setLoadingPreview]  = useState<string | null>(null);
  const [preview,         setPreview]         = useState<{ tipo: string; label: string; datos: DatosReporte } | null>(null);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: en }, { data: ej }] = await Promise.all([
        supabase.from("empresas_persona_natural").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("empresas_juridicas").select("id").eq("user_id", user.id).maybeSingle(),
      ]);
      const ids = [en?.id, ej?.id].filter(Boolean) as string[];

      const now = new Date();
      const promises = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mes = d.getMonth() + 1;
        const anio = d.getFullYear();
        const firstDay = `${anio}-${String(mes).padStart(2,"0")}-01`;
        const lastDay  = new Date(anio, mes, 0).toISOString().split("T")[0];
        if (!ids.length) return Promise.resolve({ mes, anio, ventas:0, ivaVentas:0, compras:0, ivaCompras:0, totalFacturas:0, totalCompras:0 });

        return Promise.all([
          supabase.from("facturas").select("total, iva_total").in("empresa_id", ids).gte("fecha_emision", firstDay).lte("fecha_emision", lastDay).eq("estado","emitida"),
          supabase.from("compras").select("total, iva_total").in("empresa_id", ids).gte("fecha_compra", firstDay).lte("fecha_compra", lastDay).eq("estado","recibida"),
        ]).then(([{ data: fac }, { data: com }]) => ({
          mes, anio,
          ventas:        fac?.reduce((s,f) => s + Number(f.total), 0) ?? 0,
          ivaVentas:     fac?.reduce((s,f) => s + Number(f.iva_total), 0) ?? 0,
          compras:       com?.reduce((s,c) => s + Number(c.total), 0) ?? 0,
          ivaCompras:    com?.reduce((s,c) => s + Number(c.iva_total), 0) ?? 0,
          totalFacturas: fac?.length ?? 0,
          totalCompras:  com?.length ?? 0,
        }));
      });

      setMeses(await Promise.all(promises));
      setLoading(false);
    }
    load();
  }, []);

  async function fetchDatos(tipo: string): Promise<DatosReporte> {
    const res = await fetch(`/api/reportes/dgi?tipo=${tipo}&mes=${mesSeleccionado}&anio=${anioSeleccionado}`);
    if (!res.ok) throw new Error("Error al obtener datos");
    return res.json();
  }

  async function previsual