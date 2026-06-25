"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface DetalleFactura {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_pct: number;
  subtotal: number;
  iva: number;
  total: number;
}

interface Factura {
  id: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  tipo_pago: string;
  estado: string;
  subtotal: number;
  descuento_total: number;
  iva_total: number;
  total: number;
  notas?: string;
  cliente_nombre?: string;
  cliente?: { nombre: string; ruc?: string; cedula?: string; direccion?: string; telefono?: string } | null;
  detalles?: DetalleFactura[];
}

interface Empresa {
  nombre: string;
  ruc: string;
  direccion: string;
  telefono?: string;
  correo: string;
  sitio_web?: string;
}

const BADGE: Record<string, string> = {
  emitida: "badge-info", pagada: "badge-success", borrador: "badge-gray", anulada: "badge-danger",
};

export default function FacturaDetallePage() {
  const params  = useParams();
  const router  = useRouter();

  const [factura,    setFactura]    = useState<Factura | null>(null);
  const [empresa,    setEmpresa]    = useState<Empresa | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: en }, { data: ej }] = await Promise.all([
        supabase.from("empresas_persona_natural").select("nombre_completo, numero_ruc, direccion, telefono, correo_electronico, sitio_web").eq("user_id", user.id).single(),
        supabase.from("empresas_juridicas").select("nombre_empresa, numero_ruc, direccion_legal, correo_electronico, sitio_web").eq("user_id", user.id).single(),
      ]);

      if (en) setEmpresa({ nombre: en.nombre_completo, ruc: en.numero_ruc, direccion: en.direccion, telefono: en.telefono, correo: en.correo_electronico, sitio_web: en.sitio_web });
      if (ej) setEmpresa({ nombre: ej.nombre_empresa, ruc: ej.numero_ruc, direccion: ej.direccion_legal, correo: ej.correo_electronico, sitio_web: ej.sitio_web });

      const { data: fac } = await supabase
        .from("facturas")
        .select("*, cliente:clientes(nombre, ruc, cedula, direccion, telefono), detalles:detalle_facturas(*)")
        .eq("id", params.id as string)
        .single();

      if (fac) setFactura(fac as unknown as Factura);
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleAnular() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    if (factura?.estado === "emitida") {
      const { data: detalles } = await supabase
        .from("detalle_facturas")
        .select("producto_id, cantidad")
        .eq("factura_id", factura.id);

      for (const d of detalles ?? []) {
        if (!d.producto_id) continue;
        const { data: prod } = await supabase.from("productos").select("stock_actual").eq("id", d.producto_id).single();
        const stockNuevo = Number(prod?.stock_actual ?? 0) + Number(d.cantidad);
        await supabase.from("productos").update({ stock_actual: stockNuevo }).eq("id", d.producto_id);

        const { data: lotes } = await supabase
          .from("lotes_inventario").select("*")
          .eq("producto_id", d.producto_id)
          .order("fecha_entrada", { ascending: false }).limit(1);

        if (lotes?.[0]) {
          await supabase.from("lotes_inventario")
            .update({ cantidad_restante: Number(lotes[0].cantidad_restante) + Number(d.cantidad) })
            .eq("id", lotes[0].id);
        }
      }
    }

    await supabase.from("facturas").update({ estado: "anulada" }).eq("id", factura!.id);
    toast.success("Factura anulada" + (factura?.estado === "emitida" ? " — stock restaurado" : ""));
    setConfirmDel(false);
    router.push("/dashboard/ventas");
  }

  // Abre ventana nueva con HTML de la factura y dispara impresión
  function handlePrint() {
    if (!factura || !empresa) return;

    const nombreCliente = factura.cliente?.nombre ?? factura.cliente_nombre ?? "Consumidor final";

    const filasDetalles = (factura.detalles ?? []).map((d, i) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#ffffff"}">
        <td style="padding:8px 12px;font-size:13px;color:#1e293b">${d.descripcion}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:center;color:#475569">${d.cantidad}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:right;color:#475569">${formatCurrency(d.precio_unitario)}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:right;color:#475569">${d.descuento_pct > 0 ? d.descuento_pct + "%" : "—"}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:right;color:#475569">${formatCurrency(d.iva)}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:right;font-weight:700;color:#1e293b">${formatCurrency(d.total)}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura ${factura.numero_factura}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1e293b; background: #fff; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .empresa-nombre { font-size: 22px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px; }
    .empresa-info { font-size: 12px; color: #64748b; line-height: 1.6; }
    .factura-num { font-size: 28px; font-weight: 800; color: #1d4ed8; text-align: right; }
    .factura-meta { font-size: 12px; color: #64748b; text-align: right; line-height: 1.8; margin-top: 4px; }
    .divider { border: none; border-top: 2.5px solid #1e3a8a; margin: 20px 0; }
    .section-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
    .cliente-nombre { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .cliente-info { font-size: 12px; color: #64748b; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    thead tr { background: #1e3a8a; }
    thead th { padding: 9px 12px; font-size: 11px; font-weight: 600; color: #fff; text-align: left; }
    thead th:not(:first-child) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    .totales { display: flex; justify-content: flex-end; margin-top: 8px; }
    .totales-box { width: 260px; }
    .totales-row { display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding: 4px 0; }
    .totales-final { display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; color: #1e3a8a; border-top: 2.5px solid #1e3a8a; padding-top: 8px; margin-top: 4px; }
    .notas { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .pie { margin-top: 32px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #dbeafe; color: #1d4ed8; }
    @page { size: A4; margin: 1.5cm; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="empresa-nombre">${empresa.nombre}</div>
      <div class="empresa-info">
        RUC: ${empresa.ruc}<br/>
        ${empresa.direccion}<br/>
        ${empresa.correo}
        ${empresa.sitio_web ? "<br/>" + empresa.sitio_web : ""}
      </div>
    </div>
    <div>
      <div class="factura-num">${factura.numero_factura}</div>
      <div class="factura-meta">
        Fecha: ${formatDate(factura.fecha_emision)}<br/>
        ${factura.fecha_vencimiento ? "Vence: " + formatDate(factura.fecha_vencimiento) + "<br/>" : ""}
        Pago: ${factura.tipo_pago.charAt(0).toUpperCase() + factura.tipo_pago.slice(1)}<br/>
        <span class="badge">${factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}</span>
      </div>
    </div>
  </div>

  <hr class="divider"/>

  <div style="margin-bottom:20px">
    <div class="section-label">Facturar a</div>
    <div class="cliente-nombre">${nombreCliente}</div>
    <div class="cliente-info">
      ${factura.cliente?.ruc ? "RUC: " + factura.cliente.ruc + "<br/>" : ""}
      ${factura.cliente?.cedula ? "Cédula: " + factura.cliente.cedula + "<br/>" : ""}
      ${factura.cliente?.direccion ? factura.cliente.direccion + "<br/>" : ""}
      ${factura.cliente?.telefono ? "Tel: " + factura.cliente.telefono : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left">Descripción</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:right">Precio</th>
        <th style="text-align:right">Desc.%</th>
        <th style="text-align:right">IVA</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${filasDetalles}</tbody>
  </table>

  <div class="totales">
    <div class="totales-box">
      <div class="totales-row"><span>Subtotal</span><span>${formatCurrency(factura.subtotal)}</span></div>
      ${Number(factura.descuento_total) > 0 ? `<div class="totales-row" style="color:#dc2626"><span>Descuento</span><span>- ${formatCurrency(factura.descuento_total)}</span></div>` : ""}
      <div class="totales-row"><span>IVA (15%)</span><span>${formatCurrency(factura.iva_total)}</span></div>
      <div class="totales-final"><span>TOTAL</span><span>${formatCurrency(factura.total)}</span></div>
    </div>
  </div>

  ${factura.notas ? `<div class="notas"><div class="section-label">Notas</div><p style="font-size:12px;color:#475569;margin-top:4px">${factura.notas}</p></div>` : ""}

  <div class="pie">
    Documento generado por SARA · Sistema Automatizado de Registro Administrativo<br/>
    Nicaragua · RUC: ${empresa.ruc} · ${empresa.correo}
  </div>

  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }</script>
</body>
</html>`;

    const ventana = window.open("", "_blank", "width=900,height=700");
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
    }
  }

  // Ticket térmico 80mm (también funciona para 58mm cambiando el ancho)
  function handlePrintTicket(ancho: 58 | 80 = 80) {
    if (!factura || !empresa) return;

    const nombreCliente = factura.cliente?.nombre ?? factura.cliente_nombre ?? "Consumidor final";
    const anchoMM  = ancho === 58 ? "56mm" : "78mm";
    const charWidth = ancho === 58 ? 28 : 38;

    const sep  = (c = "-") => `<div class="sep">${c.repeat(charWidth)}</div>`;
    const cols = (izq: string, der: string) => {
      const gap = Math.max(1, charWidth - izq.length - der.length);
      return `<div class="row"><span>${izq}</span><span>${der}</span></div>`;
    };
    const cortar = (txt: string, max: number) =>
      txt.length > max ? txt.slice(0, max - 2) + ".." : txt;

    const items = (factura.detalles ?? []).map(d => {
      const desc = cortar(d.descripcion, charWidth);
      const iva  = d.iva > 0 ? `<div class="iva">IVA: ${formatCurrency(d.iva)}</div>` : "";
      return `
        <div class="item-desc">${desc}</div>
        <div class="item-row">
          <span>${d.cantidad} x ${formatCurrency(d.precio_unitario)}</span>
          <span class="b">${formatCurrency(d.total)}</span>
        </div>
        ${iva}`;
    }).join(`<div class="sep-punteado">${"· ".repeat(Math.floor(charWidth / 2))}</div>`);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket ${factura.numero_factura}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #000;
      background: #fff;
      width: ${anchoMM};
      margin: 0 auto;
      padding: 4px 3px;
    }
    .c   { text-align: center; }
    .b   { font-weight: bold; }
    .xl  { font-size: 16px; font-weight: bold; text-align: center; }
    .lg  { font-size: 14px; font-weight: bold; text-align: center; }
    .md  { font-size: 13px; text-align: center; }
    .sm  { font-size: 10px; text-align: center; }
    .total-box { font-size: 18px; font-weight: bold; text-align: center; margin: 4px 0; }
    .sep { text-align: center; overflow: hidden; font-size: 11px; margin: 3px 0; }
    .sep-punteado { text-align: center; font-size: 10px; margin: 2px 0; color: #555; }
    .row { display: flex; justify-content: space-between; font-size: 12px; margin: 1px 0; }
    .item-desc { font-size: 12px; font-weight: bold; margin-top: 3px; }
    .item-row  { display: flex; justify-content: space-between; font-size: 12px; padding-left: 8px; }
    .iva       { font-size: 10px; color: #444; padding-left: 8px; }
    .bloque    { margin: 4px 0; }
    .lbl       { font-size: 10px; font-weight: bold; letter-spacing: 0.05em; }
    @page { size: ${ancho}mm auto; margin: 2mm 3mm; }
    @media print { body { width: 100%; } }
  </style>
</head>
<body>

  <!-- ENCABEZADO EMPRESA -->
  <div class="bloque">
    <div class="xl">${empresa.nombre}</div>
    ${empresa.ruc      ? `<div class="md">RUC: ${empresa.ruc}</div>` : ""}
    ${empresa.direccion ? `<div class="md">${empresa.direccion}</div>` : ""}
    ${empresa.correo   ? `<div class="md">${empresa.correo}</div>` : ""}
  </div>

  ${sep("=")}

  <!-- NÚMERO DE FACTURA -->
  <div class="bloque">
    <div class="xl">${factura.numero_factura}</div>
    <div class="md">${formatDate(factura.fecha_emision)}</div>
    <div class="md">Pago: ${factura.tipo_pago.charAt(0).toUpperCase() + factura.tipo_pago.slice(1)}</div>
  </div>

  ${sep("=")}

  <!-- CLIENTE -->
  <div class="bloque">
    <div class="lbl">CLIENTE</div>
    <div class="b">${nombreCliente}</div>
    ${factura.cliente?.cedula   ? `<div>Cédula: ${factura.cliente.cedula}</div>` : ""}
    ${factura.cliente?.ruc      ? `<div>RUC: ${factura.cliente.ruc}</div>` : ""}
    ${factura.cliente?.telefono ? `<div>Tel: ${factura.cliente.telefono}</div>` : ""}
  </div>

  ${sep()}

  <!-- ARTÍCULOS -->
  <div class="bloque">
    <div class="row b"><span>DESCRIPCION</span><span>TOTAL</span></div>
    ${sep()}
    ${items}
  </div>

  ${sep("=")}

  <!-- TOTALES -->
  <div class="bloque">
    ${cols("Subtotal:", formatCurrency(factura.subtotal))}
    ${Number(factura.descuento_total) > 0 ? cols("Descuento:", "- " + formatCurrency(factura.descuento_total)) : ""}
    ${cols("IVA (15%):", formatCurrency(factura.iva_total))}
  </div>

  ${sep("=")}
  <div class="total-box">TOTAL: ${formatCurrency(factura.total)}</div>
  ${sep("=")}

  <!-- NOTAS -->
  ${factura.notas ? `<div class="bloque"><div class="lbl">NOTA:</div><div>${factura.notas}</div></div>${sep()}` : ""}

  <!-- PIE -->
  <div class="bloque">
    <div class="sm">¡Gracias por su compra!</div>
    <div class="sm">${sep("·")}</div>
    <div class="sm">Generado por SARA · Nicaragua</div>
  </div>

<script>
  window.onload = function(){
    window.print();
    window.onafterprint = function(){ window.close(); };
  };
</script>
</body>
</html>`;

    const ventana = window.open("", "_blank", "width=420,height=700");
    if (ventana) {
      ventana.document.write(html);
      ventana.document.close();
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
    </div>
  );

  if (!factura) return (
    <div className="text-center py-20 text-slate-500">
      <p className="text-lg font-medium">Factura no encontrada</p>
      <Link href="/dashboard/ventas" className="btn-primary inline-flex mt-4">Volver a ventas</Link>
    </div>
  );

  const nombreCliente = factura.cliente?.nombre ?? factura.cliente_nombre ?? "Consumidor final";

  return (
    <>
      {/* Barra de acciones */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/ventas" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">{factura.numero_factura}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={BADGE[factura.estado] ?? "badge-gray"}>
                {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
              </span>
              <span className="text-slate-400 text-sm">{formatDate(factura.fecha_emision)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {factura.estado !== "anulada" && (
            <button onClick={() => setConfirmDel(true)} className="btn-ghost text-red-500 hover:text-red-700 flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Anular
            </button>
          )}
          {/* Ticket térmico 58mm */}
          <button
            onClick={() => handlePrintTicket(58)}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Imprimir ticket en rollo térmico de 58mm"
          >
            <Printer className="w-4 h-4" />
            Ticket 58mm
          </button>
          {/* Ticket térmico 80mm */}
          <button
            onClick={() => handlePrintTicket(80)}
            className="btn-secondary flex items-center gap-2 text-sm"
            title="Imprimir ticket en rollo térmico de 80mm"
          >
            <Printer className="w-4 h-4" />
            Ticket 80mm
          </button>
          {/* Factura A4 */}
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
            title="Imprimir factura formato A4"
          >
            <Printer className="w-4 h-4" /> Factura A4
          </button>
        </div>
      </div>

      {/* Vista previa de factura */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-brand-800">{empresa?.nombre ?? "Mi Empresa"}</h2>
            {empresa?.ruc      && <p className="text-slate-500 text-sm mt-0.5">RUC: {empresa.ruc}</p>}
            {empresa?.direccion && <p className="text-slate-500 text-sm">{empresa.direccion}</p>}
            {empresa?.correo   && <p className="text-slate-500 text-sm">{empresa.correo}</p>}
            {empresa?.sitio_web && <p className="text-slate-500 text-sm">{empresa.sitio_web}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold text-brand-700">{factura.numero_factura}</p>
            <p className="text-slate-500 text-sm mt-1">Fecha: {formatDate(factura.fecha_emision)}</p>
            {factura.fecha_vencimiento && <p className="text-slate-500 text-sm">Vence: {formatDate(factura.fecha_vencimiento)}</p>}
            <p className="text-slate-500 text-sm capitalize">Pago: {factura.tipo_pago}</p>
          </div>
        </div>

        <div className="border-t-2 border-brand-800 mb-6" />

        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Facturar a</p>
          <p className="font-semibold text-slate-900 text-lg">{nombreCliente}</p>
          {factura.cliente?.ruc      && <p className="text-slate-500 text-sm">RUC: {factura.cliente.ruc}</p>}
          {factura.cliente?.cedula   && <p className="text-slate-500 text-sm">Cédula: {factura.cliente.cedula}</p>}
          {factura.cliente?.direccion && <p className="text-slate-500 text-sm">{factura.cliente.direccion}</p>}
          {factura.cliente?.telefono  && <p className="text-slate-500 text-sm">Tel: {factura.cliente.telefono}</p>}
        </div>

        <table className="w-full mb-8">
          <thead>
            <tr className="bg-brand-800 text-white">
              <th className="text-left px-3 py-2 text-xs font-semibold">Descripción</th>
              <th className="text-center px-3 py-2 text-xs font-semibold">Cant.</th>
              <th className="text-right px-3 py-2 text-xs font-semibold">Precio</th>
              <th className="text-right px-3 py-2 text-xs font-semibold">Desc.%</th>
              <th className="text-right px-3 py-2 text-xs font-semibold">IVA</th>
              <th className="text-right px-3 py-2 text-xs font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.detalles?.map((d, i) => (
              <tr key={d.id} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                <td className="px-3 py-2 text-sm text-slate-800">{d.descripcion}</td>
                <td className="px-3 py-2 text-sm text-center text-slate-600">{d.cantidad}</td>
                <td className="px-3 py-2 text-sm text-right text-slate-600">{formatCurrency(d.precio_unitario)}</td>
                <td className="px-3 py-2 text-sm text-right text-slate-600">{d.descuento_pct > 0 ? `${d.descuento_pct}%` : "—"}</td>
                <td className="px-3 py-2 text-sm text-right text-slate-600">{formatCurrency(d.iva)}</td>
                <td className="px-3 py-2 text-sm text-right font-semibold text-slate-900">{formatCurrency(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatCurrency(factura.subtotal)}</span></div>
            {Number(factura.descuento_total) > 0 && (
              <div className="flex justify-between text-sm text-red-600"><span>Descuento</span><span>- {formatCurrency(factura.descuento_total)}</span></div>
            )}
            <div className="flex justify-between text-sm text-slate-600"><span>IVA (15%)</span><span>{formatCurrency(factura.iva_total)}</span></div>
            <div className="border-t-2 border-brand-800 pt-2 flex justify-between font-bold text-lg text-brand-800">
              <span>TOTAL</span><span>{formatCurrency(factura.total)}</span>
            </div>
          </div>
        </div>

        {factura.notas && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Notas</p>
            <p className="text-slate-600 text-sm">{factura.notas}</p>
          </div>
        )}

        <div className="border-t border-slate-100 mt-6 pt-4 text-center text-xs text-slate-400">
          <p>Documento generado por SARA · Sistema Automatizado de Registro Administrativo</p>
          <p className="mt-0.5">Nicaragua · RUC: {empresa?.ruc} · {empresa?.correo}</p>
        </div>
      </div>

      {/* Modal confirmar anulación */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-display font-bold text-slate-900 mb-2">¿Anular factura?</h3>
            <p className="text-slate-500 text-sm mb-2">{factura.numero_factura}</p>
            {factura.estado === "emitida" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs mb-4">
                ⚠️ Al anular se <strong>restaurará el stock</strong> en el inventario.
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleAnular} className="btn-danger flex-1">Sí, anular</button>
              <button onClick={() => setConfirmDel(false)} className="btn-secondary flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
