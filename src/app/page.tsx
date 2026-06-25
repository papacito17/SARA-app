import Link from "next/link";
import {
  BarChart3,
  ShoppingCart,
  Package,
  FileText,
  Building2,
  Shield,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── NAV ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <span className="font-display text-xl font-bold text-brand-800">
            SARA<span className="text-accent-DEFAULT text-sm font-medium ml-1">Sistema Administrativo</span>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">
              Iniciar sesión
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm">
              Registrarse gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-8 border border-white/20">
            <Zap className="w-4 h-4 text-accent-DEFAULT" />
            Cumple con las normas de la DGI Nicaragua
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-4">
            SARA
          </h1>
          <p className="text-blue-200 text-lg font-medium mb-4 tracking-wide uppercase">
            Sistema Automatizado de Registro Administrativo
          </p>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-10">
            Factura, compra, controla tu inventario y genera reportes listos
            para la DGI — todo desde un solo lugar, en línea y seguro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-accent-DEFAULT hover:bg-accent-dark text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>

      {/* ── MÓDULOS ── */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-accent-dark font-semibold text-sm uppercase tracking-widest mb-3">
              Módulos del sistema
            </p>
            <h2 className="font-display text-4xl font-bold text-slate-900">
              Todo lo que tu negocio necesita
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULOS.map((m) => (
              <div
                key={m.titulo}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <m.icon className="w-6 h-6 text-brand-700" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mb-2">
                  {m.titulo}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {m.descripcion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DGI COMPLIANCE ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-accent-dark font-semibold text-sm uppercase tracking-widest mb-3">
                Normativa DGI
              </p>
              <h2 className="font-display text-4xl font-bold text-slate-900 mb-6">
                Diseñado para cumplir con la DGI
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Generamos todos los reportes que la Dirección General de
                Ingresos exige: libro de ventas, libro de compras, declaración
                de IVA mensual y retenciones IR en la fuente.
              </p>
              <ul className="space-y-3">
                {CUMPLIMIENTO.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                {STATS.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="font-display text-4xl font-bold text-accent-DEFAULT mb-1">
                      {s.valor}
                    </div>
                    <div className="text-blue-200 text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIPOS EMPRESA ── */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900 mb-4">
            Para todo tipo de contribuyente
          </h2>
          <p className="text-slate-500 mb-12">
            SARA se adapta al régimen tributario de tu empresa
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIPOS.map((t) => (
              <div
                key={t.titulo}
                className="card text-center border-2 hover:border-brand-400 transition-colors"
              >
                <div className="text-4xl mb-4">{t.emoji}</div>
                <h3 className="font-display font-bold text-slate-900 mb-2">
                  {t.titulo}
                </h3>
                <p className="text-slate-500 text-sm">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-brand-900 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Shield className="w-12 h-12 text-accent-DEFAULT mx-auto mb-6" />
          <h2 className="font-display text-4xl font-bold mb-4">
            Empieza a facturar hoy
          </h2>
          <p className="text-blue-200 mb-8">
            Registro rápido, sin tarjeta de crédito. Tu información siempre
            segura y respaldada.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-accent-DEFAULT hover:bg-accent-dark text-white font-bold px-10 py-4 rounded-xl transition-colors text-base"
          >
            Crear mi cuenta gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-center text-sm">
        <p className="font-display font-bold text-white text-lg mb-1">SARA</p>
        <p className="text-slate-500 text-xs mb-2">Sistema Automatizado de Registro Administrativo</p>
        <p>Sistema Contable para Nicaragua · Cumple con normativas DGI</p>
        <p className="mt-4">© {new Date().getFullYear()} SARA. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

const MODULOS = [
  {
    icon: FileText,
    titulo: "Ventas & Facturación",
    descripcion:
      "Emite facturas numeradas, controla cobros, gestiona clientes y aplica IVA automáticamente.",
  },
  {
    icon: ShoppingCart,
    titulo: "Compras",
    descripcion:
      "Registra compras a proveedores, controla pagos y actualiza el inventario en tiempo real.",
  },
  {
    icon: Package,
    titulo: "Inventario",
    descripcion:
      "Control de existencias, alertas de stock mínimo, entradas y salidas por categoría.",
  },
  {
    icon: BarChart3,
    titulo: "Reportes DGI",
    descripcion:
      "Libro de ventas, libro de compras, declaración de IVA mensual y reporte de retenciones.",
  },
  {
    icon: Building2,
    titulo: "Información de Empresa",
    descripcion:
      "Gestiona los datos de tu empresa, logo, RUC y datos del representante legal.",
  },
  {
    icon: Shield,
    titulo: "Seguridad & Respaldo",
    descripcion:
      "Datos cifrados, acceso por usuario y contraseña, respaldo automático en la nube.",
  },
];

const CUMPLIMIENTO = [
  "Formato de factura según disposición DGI",
  "IVA 15% automático por producto",
  "Libro de ventas mensual exportable",
  "Libro de compras mensual exportable",
  "Reporte de retenciones IR 2%",
  "Exportación PDF y Excel para presentar en renta",
];

const STATS = [
  { valor: "15%", label: "IVA automático" },
  { valor: "2%", label: "IR retención fuente" },
  { valor: "100%", label: "En línea y seguro" },
  { valor: "DGI", label: "Formato compatible" },
];

const TIPOS = [
  {
    emoji: "🧑‍💼",
    titulo: "Persona Natural",
    desc: "Comerciantes independientes con RUC y cédula de identidad.",
  },
  {
    emoji: "🏪",
    titulo: "Cuota Fija",
    desc: "Pequeños negocios acogidos al régimen simplificado de cuota fija.",
  },
  {
    emoji: "🏢",
    titulo: "Persona Jurídica",
    desc: "Sociedades anónimas, cooperativas y cualquier entidad legal registrada.",
  },
];
