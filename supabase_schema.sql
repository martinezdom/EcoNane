-- ============================================================
-- SQL SCHEMA PARA ECONANE EN SUPABASE
-- Copia y pega este contenido en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. Tabla de Configuración de la Web (Promociones, Precios, Packs, Productos, PIN, Datos Fiscales)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  promotion JSONB NOT NULL,
  experiences JSONB NOT NULL,
  packs JSONB NOT NULL,
  products JSONB DEFAULT '[]',
  business_info JSONB DEFAULT '{}',
  admin_pin TEXT NOT NULL DEFAULT 'econane2026',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla ya existe, añadir columnas si no estuvieran:
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS products JSONB DEFAULT '[]';

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

-- 3. Tabla de Ventas y Tickets / Facturas Simplificadas y Nominativas (TPV y Contabilidad)
CREATE TABLE IF NOT EXISTS public.sales_tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  sequence INTEGER NOT NULL,
  year INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  client_nif TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  is_nominative BOOLEAN DEFAULT false,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  iva_rate NUMERIC(5, 2) NOT NULL DEFAULT 21,
  iva_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_note TEXT DEFAULT '',
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'efectivo',
  status TEXT NOT NULL DEFAULT 'valido',
  cancelled_reason TEXT DEFAULT '',
  cancelled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT DEFAULT '',
  email_sent BOOLEAN DEFAULT false,
  view_token TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migraciones seguras para tablas ya creadas:
ALTER TABLE public.sales_tickets ADD COLUMN IF NOT EXISTS client_address TEXT DEFAULT '';
ALTER TABLE public.sales_tickets ADD COLUMN IF NOT EXISTS is_nominative BOOLEAN DEFAULT false;
ALTER TABLE public.sales_tickets ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.sales_tickets ADD COLUMN IF NOT EXISTS discount_note TEXT DEFAULT '';
ALTER TABLE public.sales_tickets ADD COLUMN IF NOT EXISTS view_token TEXT DEFAULT '';

-- 4. Habilitar Seguridad por Filas (Row Level Security - RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_tickets ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Lectura y Escritura Públicas para la Web y Panel
CREATE POLICY "Permitir lectura publica en site_settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Permitir actualizacion publica en site_settings" ON public.site_settings
  FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica en client_sessions" ON public.client_sessions
  FOR SELECT USING (true);

CREATE POLICY "Permitir insercion y gestion publica en client_sessions" ON public.client_sessions
  FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica en sales_tickets" ON public.sales_tickets
  FOR SELECT USING (true);

CREATE POLICY "Permitir insercion y gestion publica en sales_tickets" ON public.sales_tickets
  FOR ALL USING (true);

-- 6. Crear el Bucket de Almacenamiento para las Fotos de Ecografías
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

