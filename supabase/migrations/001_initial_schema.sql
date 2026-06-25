-- ============================================================
-- FACTURA-NIC: Sistema Contable para Nicaragua
-- Migración inicial - Ejecutar en Supabase SQL Editor
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLA: empresas_persona_natural ────────────────────────
CREATE TABLE IF NOT EXISTS empresas_persona_natural (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_empresa        TEXT NOT NULL CHECK (tipo_empresa IN ('persona_natural','cuota_fija')),
  nombre_completo     TEXT NOT NULL,
  numero_cedula       TEXT NOT NULL,
  numero_ruc          TEXT NOT NULL,
  direccion           TEXT NOT NULL,
  ciudad              TEXT NOT NULL,
  departamento        TEXT NOT NULL,
  correo_electronico  TEXT NOT NULL,
  telefono            TEXT NOT NULL,
  sitio_web           TEXT,
  logo_url            TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLA: empresas_juridicas ───────────────────────────────
CREATE TABLE IF NOT EXISTS empresas_juridicas (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_empresa               TEXT NOT NULL DEFAULT 'persona_juridica',
  nombre_empresa             TEXT NOT NULL,
  nombre_comercial           TEXT NOT NULL,
  numero_ruc                 TEXT NOT NULL CHECK (LENGTH(REPLACE(numero_ruc,'-','')) = 14),
  nombre_representante_legal TEXT NOT NULL,
  direccion_legal            TEXT NOT NULL,
  correo_electronico         TEXT NOT NULL,
  sitio_web                  TEXT,
  logo_url                   TEXT,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLA: clientes ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id   UUID NOT NULL,
  nombre       TEXT NOT NULL,
  ruc          TEXT,
  cedula       TEXT,
  direccion    TEXT,
  telefono     TEXT,
  correo       TEXT,
  tipo         TEXT NOT NULL DEFAULT 'contado' CHECK (tipo IN ('contado','credito')),
  limite_credito NUMERIC(12,2) DEFAULT 0,
  activo       BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLA: proveedores ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nombre     TEXT NOT NULL,
  ruc        TEXT,
  direccion  TEXT,
  telefono   TEXT,
  correo     TEXT,
  contacto   TEXT,
  activo     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLA: categorias ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL,
  nombre      TEXT NOT NULL,
  descripcion TEXT
);

-- ─── TABLA: productos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id     UUID NOT NULL,
  codigo         TEXT NOT NULL,
  nombre         TEXT NOT NULL,
  descripcion    TEXT,
  categoria_id   UUID REFERENCES categorias(id),
  unidad_medida  TEXT NOT NULL DEFAULT 'unidad',
  precio_compra  NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_venta   NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_actual   NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_minimo   NUMERIC(12,2) NOT NULL DEFAULT 0,
  aplica_iva     BOOLEAN DEFAULT TRUE,
  activo         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLA: facturas ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facturas (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id         UUID NOT NULL,
  numero_factura     TEXT NOT NULL,
  cliente_id         UUID REFERENCES clientes(id),
  fecha_emision      DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento  DATE,
  tipo_pago          TEXT NOT NULL DEFAULT 'contado' CHECK (tipo_pago IN ('contado','credito','transferencia','cheque')),
  estado             TEXT NOT NULL DEFAULT 'emitida' CHECK (estado IN ('borrador','emitida','pagada','anulada')),
  subtotal           NUMERIC(12,2) NOT NULL DEFAULT 0,
  descuento_total    NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva_total          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total              NUMERIC(12,2) NOT NULL DEFAULT 0,
  notas              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLA: detalle_facturas ──────────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_facturas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factura_id      UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  producto_id     UUID REFERENCES productos(id),
  descripcion     TEXT NOT NULL,
  cantidad        NUMERIC(12,4) NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  descuento_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal        NUMERIC(12,2) NOT NULL,
  iva             NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL
);

-- ─── TABLA: compras ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compras (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id        UUID NOT NULL,
  numero_compra     TEXT NOT NULL,
  proveedor_id      UUID REFERENCES proveedores(id),
  fecha_compra      DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  tipo_pago         TEXT NOT NULL DEFAULT 'contado' CHECK (tipo_pago IN ('contado','credito','transferencia','cheque')),
  estado            TEXT NOT NULL DEFAULT 'recibida' CHECK (estado IN ('borrador','recibida','pagada','anulada')),
  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva_total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL DEFAULT 0,
  notas             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLA: detalle_compras ───────────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_compras (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id       UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  producto_id     UUID REFERENCES productos(id),
  descripcion     TEXT NOT NULL,
  cantidad        NUMERIC(12,4) NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  iva             NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL
);

-- ─── TABLA: movimientos_inventario ───────────────────────────
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id   UUID NOT NULL,
  producto_id  UUID NOT NULL REFERENCES productos(id),
  tipo         TEXT NOT NULL CHECK (tipo IN ('entrada','salida','ajuste')),
  cantidad     NUMERIC(12,4) NOT NULL,
  referencia   TEXT,  -- factura_id o compra_id
  notas        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLA: consecutivos ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS consecutivos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id  UUID NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('factura','compra')),
  ultimo      INTEGER NOT NULL DEFAULT 0,
  prefijo     TEXT NOT NULL DEFAULT 'F',
  UNIQUE(empresa_id, tipo)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE empresas_persona_natural ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas_juridicas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias               ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_facturas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_compras          ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario   ENABLE ROW LEVEL SECURITY;
ALTER TABLE consecutivos             ENABLE ROW LEVEL SECURITY;

-- Políticas: el usuario solo ve datos de su propia empresa

CREATE POLICY "usuario_empresa_natural" ON empresas_persona_natural
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "usuario_empresa_juridica" ON empresas_juridicas
  FOR ALL USING (auth.uid() = user_id);

-- Para clientes, proveedores, etc. la empresa_id debe pertenecer al usuario
-- Función auxiliar
CREATE OR REPLACE FUNCTION get_empresa_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM empresas_persona_natural WHERE user_id = auth.uid()
  UNION
  SELECT id FROM empresas_juridicas WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "clientes_by_empresa" ON clientes
  FOR ALL USING (empresa_id IN (SELECT get_empresa_ids()));

CREATE POLICY "proveedores_by_empresa" ON proveedores
  FOR ALL USING (empresa_id IN (SELECT get_empresa_ids()));

CREATE POLICY "categorias_by_empresa" ON categorias
  FOR ALL USING (empresa_id IN (SELECT get_empresa_ids()));

CREATE POLICY "productos_by_empresa" ON productos
  FOR ALL USING (empresa_id IN (SELECT get_empresa_ids()));

CREATE POLICY "facturas_by_empresa" ON facturas
  FOR ALL USING (empresa_id IN (SELECT get_empresa_ids()));

CREATE POLICY "detalle_facturas_policy" ON detalle_facturas
  FOR ALL USING (
    factura_id IN (SELECT id FROM facturas WHERE empresa_id IN (SELECT get_empresa_ids()))
  );

CREATE POLICY "compras_by_empresa" ON compras
  FOR ALL USING (empresa_id IN (SELECT get_empresa_ids()));

CREATE POLICY "detalle_compras_policy" ON detalle_compras
  FOR ALL USING (
    compra_id IN (SELECT id FROM compras WHERE empresa_id IN (SELECT get_empresa_ids()))
  );

CREATE POLICY "movimientos_by_empresa" ON movimientos_inventario
  FOR ALL USING (empresa_id IN (SELECT get_empresa_ids()));

CREATE POLICY "consecutivos_by_empresa" ON consecutivos
  FOR ALL USING (empresa_id IN (SELECT get_empresa_ids()));

-- ─── FUNCIÓN: actualizar stock al facturar ────────────────────
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'emitida' AND OLD.estado = 'borrador' THEN
    UPDATE productos p
    SET stock_actual = stock_actual - df.cantidad
    FROM detalle_facturas df
    WHERE df.factura_id = NEW.id AND df.producto_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_stock_venta
  AFTER UPDATE ON facturas
  FOR EACH ROW EXECUTE FUNCTION actualizar_stock_venta();

-- ─── FUNCIÓN: actualizar stock al comprar ─────────────────────
CREATE OR REPLACE FUNCTION actualizar_stock_compra()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'recibida' AND OLD.estado = 'borrador' THEN
    UPDATE productos p
    SET stock_actual = stock_actual + dc.cantidad
    FROM detalle_compras dc
    WHERE dc.compra_id = NEW.id AND dc.producto_id = p.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_stock_compra
  AFTER UPDATE ON compras
  FOR EACH ROW EXECUTE FUNCTION actualizar_stock_compra();
