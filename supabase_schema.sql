-- ============================================================
-- SQL SCHEMA PARA ECONANE EN SUPABASE
-- Copia y pega este contenido en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. Tabla de Configuración de la Web (Promociones, Precios, Packs, PIN)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  promotion JSONB NOT NULL,
  experiences JSONB NOT NULL,
  packs JSONB NOT NULL,
  admin_pin TEXT NOT NULL DEFAULT 'econane2026',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Sesiones y Entregas de Fotos para Madres
CREATE TABLE IF NOT EXISTS public.client_sessions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  session_date TEXT NOT NULL,
  service_type TEXT NOT NULL,
  expiry_days INTEGER NOT NULL DEFAULT 120,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  note TEXT DEFAULT '',
  photos TEXT[] NOT NULL DEFAULT '{}',
  zip_url TEXT DEFAULT ''
);

-- 3. Habilitar Seguridad por Filas (Row Level Security - RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Lectura y Escritura Públicas para la Web y Panel
CREATE POLICY "Permitir lectura publica en site_settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Permitir actualizacion publica en site_settings" ON public.site_settings
  FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica en client_sessions" ON public.client_sessions
  FOR SELECT USING (true);

CREATE POLICY "Permitir insercion y gestion publica en client_sessions" ON public.client_sessions
  FOR ALL USING (true);

-- 5. Crear el Bucket de Almacenamiento para las Fotos de Ecografías
INSERT INTO storage.buckets (id, name, public)
VALUES ('ultrasound-photos', 'ultrasound-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para subir y ver fotos
CREATE POLICY "Permitir ver fotos publicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'ultrasound-photos');

CREATE POLICY "Permitir subir fotos desde panel" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ultrasound-photos');

CREATE POLICY "Permitir borrar fotos" ON storage.objects
  FOR DELETE USING (bucket_id = 'ultrasound-photos');
