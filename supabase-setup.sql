-- =============================================
-- SUPABASE SETUP — Rumbo Norte Real Estate
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- =============================================

-- 1. Tabla de inmuebles
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Datos principales
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL CHECK (property_type IN ('piso', 'casa', 'local', 'garaje', 'oficina', 'terreno', 'atico', 'duplex', 'estudio')),
  operation TEXT NOT NULL CHECK (operation IN ('venta', 'alquiler')),
  price NUMERIC(12,2) NOT NULL,

  -- Ubicación
  zone TEXT NOT NULL,
  address TEXT,

  -- Características
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  sqm NUMERIC(8,2),
  floor TEXT,
  has_elevator BOOLEAN DEFAULT false,
  has_garage BOOLEAN DEFAULT false,
  has_terrace BOOLEAN DEFAULT false,
  has_pool BOOLEAN DEFAULT false,
  has_ac BOOLEAN DEFAULT false,
  has_storage BOOLEAN DEFAULT false,
  energy_rating TEXT,

  -- Imágenes (array de URLs públicas de Supabase Storage)
  images TEXT[] DEFAULT '{}',

  -- Estado y visibilidad
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'sold', 'rented')),
  is_visible BOOLEAN NOT NULL DEFAULT true
);

-- 2. Índices
CREATE INDEX idx_properties_public ON properties (is_visible, status, operation, property_type, zone);
CREATE INDEX idx_properties_price ON properties (price);

-- 3. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 4. Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Público: solo puede leer inmuebles visibles
CREATE POLICY "Public can view visible properties"
  ON properties FOR SELECT
  USING (is_visible = true);

-- Admin autenticado: acceso completo
CREATE POLICY "Admin full access"
  ON properties FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- STORAGE: Crear bucket "property-images"
-- =============================================
-- Esto se hace desde el Dashboard de Supabase:
-- 1. Ir a Storage > Create new bucket
-- 2. Nombre: property-images
-- 3. Public bucket: Sí (activar)
--
-- Luego configurar las policies en el bucket:
--
-- Policy de lectura pública (ya incluida al ser public bucket)
--
-- Policy de escritura para autenticados:
-- CREATE POLICY "Auth upload property images"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
--
-- Policy de eliminación para autenticados:
-- CREATE POLICY "Auth delete property images"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');
--
-- =============================================
-- ADMIN USER: Crear desde Supabase Dashboard
-- =============================================
-- 1. Ir a Authentication > Users > Add User
-- 2. Email: admin@rumbo-norte.es (o el que prefieras)
-- 3. Password: (tu contraseña segura)
-- 4. Confirmar email: Sí
