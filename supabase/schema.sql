-- =====================================================
-- SCRIPT DE CREACIÓN DE TABLAS - VISOR CEMENTERIO
-- Centro Sagrado Ancestral o Cementerio Indígena de Otavalo
-- =====================================================
-- IMPORTANTE: Ejecutar ANTES del seed.sql si las tablas
-- no existen en tu base de datos de Supabase.
-- =====================================================

-- =====================================================
-- 1. TABLA: bloques_geom
-- =====================================================
-- Almacena los bloques/sectores del cementerio.
-- Los IDs deben coincidir con GeoServer para el mapeo correcto.

CREATE TABLE IF NOT EXISTS bloques_geom (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    sector VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_bloques_codigo ON bloques_geom(codigo);
CREATE INDEX IF NOT EXISTS idx_bloques_sector ON bloques_geom(sector);

-- Habilitar RLS (Row Level Security) - Lectura pública
ALTER TABLE bloques_geom ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Lectura pública de bloques" 
    ON bloques_geom FOR SELECT 
    USING (true);


-- =====================================================
-- 2. TABLA: nichos
-- =====================================================
-- Almacena cada nicho individual del cementerio.
-- Estados posibles: 'disponible', 'ocupado', 'reservado'

CREATE TABLE IF NOT EXISTS nichos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'ocupado', 'reservado')),
    bloques_geom_id INTEGER REFERENCES bloques_geom(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_nichos_codigo ON nichos(codigo);
CREATE INDEX IF NOT EXISTS idx_nichos_estado ON nichos(estado);
CREATE INDEX IF NOT EXISTS idx_nichos_bloque ON nichos(bloques_geom_id);

-- Habilitar RLS
ALTER TABLE nichos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Lectura pública de nichos" 
    ON nichos FOR SELECT 
    USING (true);


-- =====================================================
-- 3. TABLA: fallecidos
-- =====================================================
-- Datos personales de los difuntos registrados.

CREATE TABLE IF NOT EXISTS fallecidos (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cedula VARCHAR(15) UNIQUE,
    fecha_defuncion DATE,
    responsable VARCHAR(150),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_fallecidos_cedula ON fallecidos(cedula);
CREATE INDEX IF NOT EXISTS idx_fallecidos_nombres ON fallecidos(nombres);
CREATE INDEX IF NOT EXISTS idx_fallecidos_apellidos ON fallecidos(apellidos);

-- Habilitar RLS
ALTER TABLE fallecidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Lectura pública de fallecidos" 
    ON fallecidos FOR SELECT 
    USING (true);


-- =====================================================
-- 4. TABLA: fallecido_nicho (Tabla intermedia)
-- =====================================================
-- Relaciona fallecidos con nichos (muchos a muchos).
-- Permite historial de ocupación de nichos.

CREATE TABLE IF NOT EXISTS fallecido_nicho (
    id SERIAL PRIMARY KEY,
    fallecido_id INTEGER NOT NULL REFERENCES fallecidos(id) ON DELETE CASCADE,
    nicho_id INTEGER NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fallecido_id, nicho_id)
);

-- Índices para joins rápidos
CREATE INDEX IF NOT EXISTS idx_fn_fallecido ON fallecido_nicho(fallecido_id);
CREATE INDEX IF NOT EXISTS idx_fn_nicho ON fallecido_nicho(nicho_id);

-- Habilitar RLS
ALTER TABLE fallecido_nicho ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Lectura pública de fallecido_nicho" 
    ON fallecido_nicho FOR SELECT 
    USING (true);


-- =====================================================
-- 5. FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_nichos_updated_at ON nichos;
CREATE TRIGGER update_nichos_updated_at
    BEFORE UPDATE ON nichos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fallecidos_updated_at ON fallecidos;
CREATE TRIGGER update_fallecidos_updated_at
    BEFORE UPDATE ON fallecidos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- FIN DEL SCRIPT DE TABLAS
-- =====================================================
