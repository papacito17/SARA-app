"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Building2, Lock, Hash, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, Settings,
} from "lucide-react";
import { DEPARTAMENTOS_NICARAGUA } from "@/types";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Consecutivo {
  id: string;
  tipo: string;
  ultimo: number;
  prefijo: string;
  digitos: number;
}

type Tab = "empresa" | "contrasena" | "serializacion";

// ─── Hook: datos de usuario y empresa ────────────────────────────────────────

function useSupabaseUser() {
  const [empresaId, setEmpresaId] = useState("");
  const [natural,   setNatural]   = useState<Record<string, string> | null>(null);
  const [juridica,  setJuridica]  = useState<Record<string, string> | null>(null);
  const [ready,     setReady]     = useState(false);

  const load = useCallback(async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: en }, { data: ej }] = await Promise.all([
      supabase.from("empresas_persona_natural").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("empresas_juridicas").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setNatural(en as Record<string, string> | null);
    setJuridica(ej as Record<string, string> | null);
    setEmpresaId((en as any)?.id ?? (ej as any)?.id ?? "");
    setReady(true);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { empresaId, natural, juridica, ready };
}

// ══════════════════════════════════════════════════════════════════════════════
// PESTAÑA 1 — Datos de empresa
// ══════════════════════════════════════════════════════════════════════════════

function TabEmpresa({
  natural, juridica,
}: {
  natural: Record<string, string> | null;
  juridica: Record<string, string> | null;
}) {
  const isJuridica = !!juridica;
  const empresa    = natural ?? juridica;

  // Persona Natural
  const [nombreCompleto, setNombreCompleto] = useState(natural?.nombre_completo ?? "");
  const [cedula,         setCedula]         = useState(natural?.numero_cedula ?? "");
  const [rucNat,         setRucNat]         = useState(natural?.numero_ruc ?? "");
  const [direccion,      setDireccion]      = useState(natural?.direccion ?? "");
  const [ciudad,         setCiudad]         = useState(natural?.ciudad ?? "");
  const [departamento,   setDepartamento]   = useState(natural?.departamento ?? "");
  const [telefono,       setTelefono]       = useState(natural?.telefono ?? "");
  const [correoNat,      setCorreoNat]      = useState(natural?.correo_electronico ?? "");
  const [webNat,         setWebNat]         = useState(natural?.sitio_web ?? "");

  // Persona Juridica
  const [nombreEmpresa,   setNombreEmpresa]   = useState(juridica?.nombre_empresa ?? "");
  const [nombreComercial, setNombreComercial] = useState(juridica?.nombre_comercial ?? "");
  const [rucJur,          setRucJur]          = useState(juridica?.numero_ruc ?? "");
  const [representante,   setRepresentante]   = useState(juridica?.nombre_representante_legal ?? "");
  const [direccionLegal,  setDireccionLegal]  = useState(juridica?.direccion_legal ?? "");
  const [correoJur,       setCorreoJur]       = useState(juridica?.correo_electronico ?? "");
  const [webJur,          setWebJur]          = useState(juridica?.sitio_web ?? "");

  const [loading, setLoading] = useState(false);

  async function guardar() {
    if (!empresa) return;
    setLoading(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    if (isJuridica) {
      const { error } = await supabase.from("empresas_juridicas").update({
        nombre_empresa:             nombreEmpresa,
        nombre_comercial:           nombreComercial,
        numero_ruc:                 rucJur,
        nombre_representante_legal: representante,
        direccion_legal:            direccionLegal,
        correo_electronico:         correoJur,
        sitio_web:                  webJur || null,
        updated_at:                 new Date().toISOString(),
      }).eq("id", empresa.id);
      if (error) { toast.error("Error: " + error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.from("empresas_persona_natural").update({
        nombre_completo:    nombreCompleto,
        numero_cedula:      cedula,
        numero_ruc:         rucNat,
        direccion,
        ciudad,
        departamento,
        telefono,
        correo_electronico: correoNat,
        sitio_web:          webNat || null,
        updated_at:         new Date().toISOString(),
      }).eq("id", empresa.id);
      if (error) { toast.error("Error: " + error.message); setLoading(false); return; }
    }

    toast.success("Datos de empresa actualizados");
    setLoading(false);
  }

  if (!empresa) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 font-medium">No se encontró información de empresa</p>
        <p className="text-slate-400 text-sm mt-1">
          Completa tu registro o contacta soporte
        </p>
      </div>
    );
  }

  const tipoLabel = isJuridica
    ? "Persona Jurídica"
    : natural?.tipo_empresa === "cuota_fija" ? "Cuota Fija" : "Persona Natural";

  return (
    <div className="space-y-6">
      {/* Badge tipo empresa */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">{tipoLabel}</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Estos datos aparecen en tus facturas y son los que la DGI tiene registrados
          </p>
        </div>
      </div>

      {/* Formulario Persona Natural / Cuota Fija */}
      {!isJuridica && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Nombre completo <span className="text-red-500">*</span></label>
            <input className="input" value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)}
              placeholder="Como aparece en la cédula" />
          </div>
          <div>
            <label className="label">Número de cédula <span className="text-red-500">*</span></label>
            <input className="input font-mono" value={cedula} onChange={e => setCedula(e.target.value)}
              placeholder="001-000000-0000X" />
            <p className="text-xs text-slate-400 mt-1">Formato: 001-000000-0000X</p>
          </div>
          <div>
            <label className="label">RUC <span className="text-red-500">*</span></label>
            <input className="input font-mono" value={rucNat} onChange={e => setRucNat(e.target.value)}
              placeholder="14 dígitos" maxLength={14} />
            <p className="text-xs text-slate-400 mt-1">14 dígitos sin guiones</p>
          </div>
          <div className="md:col-span-2">
            <label className="label">Dirección <span className="text-red-500">*</span></label>
            <input className="input" value={direccion} onChange={e => setDireccion(e.target.value)}
              placeholder="Dirección completa del negocio" />
          </div>
          <div>
            <label className="label">Ciudad</label>
            <input className="input" value={ciudad} onChange={e => setCiudad(e.target.value)} plac