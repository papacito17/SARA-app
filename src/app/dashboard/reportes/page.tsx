"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { formatCurrency, nombreMes } from "@/lib/utils";
import { BarChart3, Download, FileSpreadsheet } from "lucide-react";

interface MesData {
  mes: number; anio: number;
  ventas: number; ivaVentas: number;
  compras: number; ivaCompras: number;
}

export default function ReportesPage() {
  const [meses, setMeses] = useState<MesData[]>([]);
  const [loading, setLoading] = useState(true);

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
      const ids = [en?.id, ej?.id].filter(Boolean) as string[];

      const now = new Date();
      const resultados: MesData[] = [];

      // Cargar los 6 meses en paralelo
      const promises = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mes = d.getMonth() + 1;
        const anio = d.getFullYear();
        const firstDay = `${anio}-${String(mes).padStart(2, "0")}-01`;
        const lastDay = new Date(anio, mes, 0).toISOString().split("T")[0];

        if (!ids.length) return Promise.resolve({ mes, anio, ventas: 0, ivaVentas: 0, compras: 0, ivaCompras: 0 });

        return Promise.all([
          supabase.from("facturas").select("total, iva_total").in("empresa_id", ids).gte("fecha_emision", firstDay).lte("fecha_emision", lastDay).neq("estado", "anulada"),
          supabase.from("compras").select("total, iva_total").in("empresa_id", ids).gte("fecha_compra", firstDay).lte("fecha_compra", lastDay).neq("estado", "anulada"),
        ]).then(([{ data: fac }, { data: com }]) => ({
          mes, anio,
          ventas:    fac?.reduce((s, f) => s + Number(f.total), 0) ?? 0,
          ivaVentas: fac?.reduce((s, f) => s + Number(f.iva_total), 0) ?? 0,
          compras:   com?.reduce((s, c) => s + Number(c.total), 0) ?? 0,
          ivaCompras:com?.reduce((s, c) => s + Number(c.iva_total), 0) ?? 0,
        }));
      });

      const datos = await Promise.all(promises);
      setMeses(datos);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900">Reportes DGI</h1>
        <p className="text-slate-500 text-sm mt-1">Libros contables y declaraciones para la Dirección General de Ingresos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {REPORTES.map((r) => (
          <div key={r.titulo} className="card hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${r.iconBg}`}>
              <r.icon className={`w-6 h-6 ${r.iconColor}`} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{r.titulo}</h3>
            <p className="text-slate-500 text-sm mb-4">{r.desc}</p>
            <button className="flex items-center gap-2 text-brand-700 hover:text-brand-900 text-sm font-medium">
              <Download className="w-4 h-4" />{r.accion}
            </button>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-display text-lg font-bold text-slate-900">Resumen Mensual de IVA</h2>
          <p className="text-slate-500 text-sm mt-1">Base para la declaración mensual ante la DGI</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="table-header">Período</th>
                  <th className="table-header">Total Ventas</th>
                  <th className="table-header">IVA Débito</th>
                  <th className="table-header">Total Compras</th>
                  <th className="table-header">IVA Crédito</th>
                  <th className="table-header">IVA a Pagar</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => {
                  const ivaPagar = m.ivaVentas - m.ivaCompras;
                  return (
                    <tr key={`${m.anio}-${m.mes}`} className="hover:bg-slate-50">
                      <td className="table-cell font-medium">{nombreMes(m.mes)} {m.anio}</td>
                      <td className="table-cell">{formatCurrency(m.ventas)}</td>
                      <td className="table-cell text-blue-700 font-medium">{formatCurrency(m.ivaVentas)}</td>
                      <td className="table-cell">{formatCurrency(m.compras)}</td>
                      <td className="table-cell text-purple-700 font-medium">{formatCurrency(m.ivaCompras)}</td>
                      <td className={`table-cell font-bold ${ivaPagar >= 0 ? "text-red-700" : "text-green-700"}`}>
                        {formatCurrency(Math.abs(ivaPagar))}{ivaPagar < 0 && " (crédito)"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Información para declaración DGI</p>
            <p>El IVA débito (ventas) menos el IVA crédito (compras) es el IVA neto a pagar. Si el resultado es negativo, tienes un saldo a favor que puedes acreditar en el siguiente período. La declaración debe realizarse los primeros 15 días del mes siguiente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const REPORTES = [
  { icon: FileSpreadsheet, titulo: "Libro de Ventas",       desc: "Registro mensual de todas las facturas emitidas con desglose de IVA.", accion: "Exportar Excel", iconBg: "bg-blue-100",   iconColor: "text-blue-700"   },
  { icon: FileSpreadsheet, titulo: "Libro de Compras",      desc: "Registro mensual de todas las compras con crédito fiscal IVA.",        accion: "Exportar Excel", iconBg: "bg-purple-100", iconColor: "text-purple-700" },
  { icon: Download,        titulo: "Declaración IVA",       desc: "Formulario de declaración de IVA listo para presentar a la DGI.",      accion: "Exportar PDF",   iconBg: "bg-green-100",  iconColor: "text-green-700"  },
  { icon: Download,        titulo: "Retenciones IR",        desc: "Reporte de retenciones en la fuente 2% realizadas en el período.",     accion: "Exportar PDF",   iconBg: "bg-amber-100",  iconColor: "text-amber-700"  },
  { icon: BarChart3,       titulo: "Estado de Resultados",  desc: "Utilidades y pérdidas del período seleccionado.",                      accion: "Ver reporte",    iconBg: "bg-rose-100",   iconColor: "text-rose-700"   },
  { icon: BarChart3,       titulo: "Inventario Valorado",   desc: "Valor total del inventario al precio de costo y venta.",               accion: "Exportar PDF",   iconBg: "bg-slate-100",  iconColor: "text-slate-700"  },
];
