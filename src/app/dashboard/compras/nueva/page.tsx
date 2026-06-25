"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Save, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { IVA_NICARAGUA } from "@/types";
import type { Proveedor, Producto } from "@/types";

interface Linea {
  producto_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  aplica_iva: boolean;
}

export default function NuevaCompraPage() {
  const router = useRouter();

  const [saving,      setSaving]     = useState(false);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos,   setProductos]  = useState<Producto[]>([]);
  const [empresaId,   setEmpresaId]  = useState("");

  const [proveedorId, setProveedorId] = useState("");
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split("T")[0]);
  const [tipoPago,    setTipoPago]    = useState("contado");
  const [notas,       setNotas]       = useState("");
  const [lineas,      setLineas]      = useState<Linea[]>([lineaVacia()]);

  // Búsqueda de productos por línea
  const [busquedas, setBusquedas] = useState<string[]>([""]);
  const [mostrarDropdown, setMostrarDropdown] = useState<number | null>(null);

  function lineaVacia(): Linea {
    return { producto_id: "", descripcion: "", cantidad: 1, precio_unitario: 0, aplica_iva: true };
  }

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: en }, { data: ej }] = await Promise.all([
        supabase.from("empresas_persona_natural").select("id").eq("user_id", user.id).single(),
        supabase.from("empresas_juridicas").select("id").eq("user_id", user.id).single(),
      ]);
      const eId = en?.id ?? ej?.id ?? "";
      setEmpresaId(eId);

      if (eId) {
        const [{ data: prov }, { data: prod }] = await Promise.all([
          supabase.from("proveedores").select("*").eq("empresa_id", eId).eq("activo", true).order("nombre"),
          supabase.from("productos").select("*").eq("empresa_id", eId).eq("activo", true).order("nombre"),
        ]);
        setProveedores((prov as Proveedor[]) ?? []);
        setProductos((prod as Producto[]) ?? []);
      }
    }
    load();
  }, []);

  function productosFiltrados(idx: number) {
    const b = busquedas[idx]?.toLowerCase() ?? "";
    if (!b) return productos;
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(b) ||
      p.codigo.toLowerCase().includes(b)
    );
  }

  function seleccionarProducto(idx: number, prod: Producto) {
    setLineas(prev => prev.map((l, i) => i === idx
      ? { ...l, producto_id: prod.id, descripcion: prod.nombre, precio_unitario: prod.precio_compra, aplica_iva: prod.aplica_iva }
      : l
    ));
    const nuevasBusquedas = [...busquedas];
    nuevasBusquedas[idx] = prod.nombre;
    setBusquedas(nuevasBusquedas);
    setMostrarDropdown(null);
  }

  function updateLinea(idx: number, key: keyof Linea, val: string | number | boolean) {
    setLineas(prev => prev.map((l, i) => i === idx ? { ...l, [key]: val } : l));
  }

  function agregarLinea() {
    setLineas(prev => [...prev, lineaVacia()]);
    setBusquedas(prev => [...prev, ""]);
  }

  function eliminarLinea(idx: number) {
    if (lineas.length === 1) return;
    setLineas(prev => prev.filter((_, i) => i !== idx));
    setBusquedas(prev => prev.filter((_, i) => i !== idx));
  }

  const calcLinea = (l: Linea) => {
    const sub = l.cantidad * l.precio_unitario;
    const iva = l.aplica_iva ? sub * IVA_NICARAGUA : 0;
    return { sub, iva, total: sub + iva };
  };

  const subtotal = lineas.reduce((s, l) => s + calcLinea(l).sub, 0);
  const ivaTotal = lineas.reduce((s, l) => s + calcLinea(l).iva, 0);
  const total    = subtotal + ivaTotal;

  async function handleSave(estado: "borrador" | "recibida") {
    if (!empresaId) { toast.error("Configura tu empresa primero."); return; }

    const lineasConProducto = lineas.filter(l => l.producto_id || l.descripcion);
    if (!lineasConProducto.length) { toast.error("Agrega al menos un artículo."); return; }

    setSaving(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    // Consecutivo
    const { data: cons } = await supabase.from("consecutivos").select("*").eq("empresa_id", empresaId).eq("tipo", "compra").single();
    let numeroCompra = "C-000001";
    if (cons) {
      const nuevo = cons.ultimo + 1;
      const digitos = cons.digitos ?? 6;
      numeroCompra = `${cons.prefijo ?? "C"}-${String(nuevo).padStart(digitos, "0")}`;
      await supabase.from("consecutivos").update({ ultimo: nuevo }).eq("id", cons.id);
    } else {
      await supabase.from("consecutivos").insert({ empresa_id: empresaId, tipo: "compra", ultimo: 1, prefijo: "C", digitos: 6 });
    }

    // Insertar compra
    const { data: compra, error } = await supabase.from("compras").insert({
      empresa_id:    empresaId,
      numero_compra: numeroCompra,
      proveedor_id:  proveedorId || null,
      fecha_compra:  fechaCompra,
      tipo_pago:     tipoPago,
      estado,
      subtotal,
      iva_total:     ivaTotal,
      total,
      notas:         notas || null,
    }).select().single();

    if (error || !compra) { toast.error(`Error al guardar: ${error?.message}`); setSaving(false); return; }

    // Insertar detalles
    const detalles = lineas.map(l => {
      const { sub, iva, total: tot } = calcLinea(l);
      return { compra_id: compra.id, producto_id: l.producto_id || null, descripcion: l.descripcion, cantidad: l.cantidad, precio_unitario: l.precio_unitario, iva, total: tot };
    });
    await supabase.from("detalle_compras").insert(detalles);

    // ── FIFO: actualizar stock e insertar lotes si estado = recibida ──
    if (estado === "recibida") {
      for (const l of lineas) {
        if (!l.producto_id || l.cantidad <= 0) continue;

        // 1. Actualizar stock_actual del producto
        const { data: prod } = await supabase.from("productos").select("stock_actual").eq("id", l.producto_id).single();
        const stockNuevo = Number(prod?.stock_actual ?? 0) + Number(l.cantidad);
        await supabase.from("productos").update({
          stock_actual:  stockNuevo,
          precio_compra: l.precio_unitario, // actualizar último precio de compra
        }).eq("id", l.producto_id);

        // 2. Crear lote FIFO con la fecha de compra y costo unitario
        await supabase.from("lotes_inventario").insert({
          empresa_id:         empresaId,
          producto_id:        l.producto_id,
          compra_id:          compra.id,
          fecha_entrada:      fechaCompra,
          cantidad_inicial:   l.cantidad,
          cantidad_restante:  l.cantidad,
          costo_unitario:     l.precio_unitario,
        });

        // 3. Registrar movimiento
        await supabase.from("movimientos_inventario").insert({
          empresa_id:  empresaId,
          producto_id: l.producto_id,
          tipo:        "entrada",
          cantidad:    l.cantidad,
          referencia:  compra.id,
          notas:       `Compra ${numeroCompra}`,
        });
      }
    }

    toast.success(`Compra ${numeroCompra} ${estado === "recibida" ? "recibida — inventario actualizado" : "guardada como borrador"}`);
    router.push("/dashboard/compras");
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/compras" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Nueva Compra</h1>
          <p className="text-slate-500 text-sm mt-1">Registra una compra a proveedor — actualiza el inventario automáticamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">

          {/* Datos generales */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-4">Datos de la compra</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Proveedor</label>
                <select className="input" value={proveedorId} onChange={e => setProveedorId(e.target.value)}>
                  <option value="">Sin proveedor</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo de pago</label>
                <select className="input" value={tipoPago} onChange={e => setTipoPago(e.target.value)}>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="label">Fecha de compra</label>
                <input type="date" className="input" value={fechaCompra} onChange={e => setFechaCompra(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Artículos con búsqueda */}
          <div className="card">
            <h2 className="font-semibold text-slate-900 mb-1">Artículos comprados</h2>
            <p className="text-slate-400 text-xs mb-4">Busca por nombre o código. Al recibir la compra el stock se actualiza automáticamente (método FIFO).</p>
            <div className="space-y-3">
              {lineas.map((l, idx) => (
                <div key={idx} className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
                  <div className="grid grid-cols-12 gap-2">
                    {/* Búsqueda de producto */}
                    <div className="col-span-12 md:col-span-5 relative">
                      <label className="label text-xs">Producto del inventario</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          className="input text-sm pl-8"
                          placeholder="Buscar producto..."
                          value={busquedas[idx] ?? ""}
                          onChange={e => {
                            const b = [...busquedas]; b[idx] = e.target.value;
                            setBusquedas(b);
                            setMostrarDropdown(idx);
                            if (!e.target.value) updateLinea(idx, "producto_id", "");
                          }}
                          onFocus={() => setMostrarDropdown(idx)}
                          onBlur={() => setTimeout(() => setMostrarDropdown(null), 200)}
                        />
                      </div>
                      {mostrarDropdown === idx && productosFiltrados(idx).length > 0 && (
                        <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                          {productosFiltrados(idx).map(p => (
                            <button key={p.id} type="button"
                              className="w-full text-left px-3 py-2 hover:bg-brand-50 text-sm border-b border-slate-50 last:border-0"
                              onMouseDown={() => seleccionarProducto(idx, p)}
                            >
                              <span className="font-medium">{p.nombre}</span>
                              <span className="text-slate-400 ml-2 text-xs">{p.codigo}</span>
                              <span className="float-right text-slate-500 text-xs">Stock: {p.stock_actual}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Descripción libre */}
                    <div className="col-span-12 md:col-span-3">
                      <label className="label text-xs">Descripción</label>
                      <input type="text" className="input text-sm" value={l.descripcion}
                        onChange={e => updateLinea(idx, "descripcion", e.target.value)} placeholder="Descripción" />
                    </div>

                    {/* Cantidad */}
                    <div className="col-span-4 md:col-span-1">
                      <label className="label text-xs">Cant.</label>
                      <input type="number" className="input text-sm" min="0" step="0.01" value={l.cantidad}
                        onChange={e => updateLinea(idx, "cantidad", parseFloat(e.target.value) || 0)} />
                    </div>

                    {/* Precio */}
                    <div className="col-span-4 md:col-span-2">
                      <label className="label text-xs">Precio C$</label>
                      <input type="number" className="input text-sm" min="0" step="0.01" value={l.precio_unitario}
                        onChange={e => updateLinea(idx, "precio_unitario", parseFloat(e.target.value) || 0)} />
                    </div>

                    {/* IVA + eliminar */}
                    <div className="col-span-4 md:col-span-1 flex items-end justify-between pb-1">
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input type="checkbox" className="w-3.5 h-3.5" checked={l.aplica_iva}
                          onChange={e => updateLinea(idx, "aplica_iva", e.target.checked)} />
                        IVA
                      </label>
                      <button type="button" onClick={() => eliminarLinea(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-slate-700">
                    Total línea: {formatCurrency(calcLinea(l).total)}
                  </div>
                </div>
              ))}
              <button type="button" onClick={agregarLinea} className="flex items-center gap-2 text-brand-700 text-sm font-medium">
                <Plus className="w-4 h-4" /> Agregar artículo
              </button>
            </div>
          </div>

          <div className="card">
            <label className="label">Notas</label>
            <textarea className="input resize-none" rows={2} value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>

        {/* Resumen */}
        <div>
          <div className="card sticky top-6">
            <h2 className="font-semibold text-slate-900 mb-4">Resumen</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>IVA (15%)</span><span>{formatCurrency(ivaTotal)}</span></div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-lg text-slate-900">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-xs mb-4">
              <p className="font-semibold mb-1">📦 Método FIFO</p>
              <p>Al <strong>Recibir</strong> la compra, el stock se suma al inventario y se crea un lote con el costo de compra para el cálculo FIFO.</p>
            </div>
            <div className="space-y-3">
              <button disabled={saving} onClick={() => handleSave("recibida")} className="btn-primary w-full flex items-center justify-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Recibir compra</>}
              </button>
              <button disabled={saving} onClick={() => handleSave("borrador")} className="btn-secondary w-full">Guardar borrador</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
