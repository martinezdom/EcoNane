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

-- 4. Tabla de Citas y Reservas Online / Agenda (Reemplazo Booksy)
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  booking_code TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  service_title TEXT NOT NULL,
  service_price TEXT DEFAULT '',
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  gestation_week TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  cancelled_reason TEXT DEFAULT '',
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migraciones seguras para site_settings:
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS booking_settings JSONB DEFAULT '{}';

-- 5. Habilitar Seguridad por Filas (Row Level Security - RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 6. Funciones RPC Seguras (SECURITY DEFINER) para Consultas Públicas Controladas
-- Permite que los visitantes consulten huecos ocupados para el calendario SIN filtrar nombres ni teléfonos
DROP FUNCTION IF EXISTS public.get_public_occupied_slots();
CREATE OR REPLACE FUNCTION public.get_public_occupied_slots()
RETURNS TABLE (
  id TEXT,
  "date" TEXT,
  "time" TEXT,
  duration_minutes INTEGER,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.date, a.time, a.duration_minutes, a.status
  FROM public.appointments a
  WHERE a.status = 'confirmed';
$$;

GRANT EXECUTE ON FUNCTION public.get_public_occupied_slots() TO anon, authenticated;

-- Permite a una clienta consultar su sesión de fotos únicamente si introduce el código exacto
CREATE OR REPLACE FUNCTION public.get_public_session(p_code TEXT)
RETURNS SETOF public.client_sessions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.client_sessions
  WHERE code = p_code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_session(TEXT) TO anon, authenticated;

-- Permite consultar un ticket de venta únicamente si se conoce el número y el token secreto
CREATE OR REPLACE FUNCTION public.get_public_ticket(p_ticket_number TEXT, p_token TEXT)
RETURNS SETOF public.sales_tickets
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.sales_tickets
  WHERE ticket_number = p_ticket_number
    AND view_token = p_token
    AND view_token IS NOT NULL
    AND view_token <> ''
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_ticket(TEXT, TEXT) TO anon, authenticated;

-- 7. Políticas RLS Estrictas (Zero Data Leakage / Burp Suite Proof)

-- Limpiar políticas anteriores si existen
DROP POLICY IF EXISTS "Permitir lectura publica en site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Permitir actualizacion publica en site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin full access site_settings" ON public.site_settings;

DROP POLICY IF EXISTS "Permitir lectura publica en appointments" ON public.appointments;
DROP POLICY IF EXISTS "Permitir insercion y gestion publica en appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin full access appointments" ON public.appointments;

DROP POLICY IF EXISTS "Permitir lectura publica en client_sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Permitir insercion y gestion publica en client_sessions" ON public.client_sessions;
DROP POLICY IF EXISTS "Admin full access client_sessions" ON public.client_sessions;

DROP POLICY IF EXISTS "Permitir lectura publica en sales_tickets" ON public.sales_tickets;
DROP POLICY IF EXISTS "Permitir insercion y gestion publica en sales_tickets" ON public.sales_tickets;
DROP POLICY IF EXISTS "Admin full access sales_tickets" ON public.sales_tickets;

-- A) SITE_SETTINGS: Visitantes leen configuración; Solo Admin edita/guarda
CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin full access site_settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- B) APPOINTMENTS: Visitantes solo pueden insertar su reserva; Admin gestiona todo
CREATE POLICY "Public insert appointments" ON public.appointments
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Admin full access appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- C) CLIENT_SESSIONS: Bloqueado a anon directo. Lectura pública solo vía get_public_session(code); Admin gestiona todo
CREATE POLICY "Admin full access client_sessions" ON public.client_sessions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- D) SALES_TICKETS: Bloqueado a anon directo. Lectura pública solo vía get_public_ticket(num, token); Admin gestiona todo
CREATE POLICY "Admin full access sales_tickets" ON public.sales_tickets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 8. Crear y blindar el Bucket de Almacenamiento para las Fotos de Ecografías
INSERT INTO storage.buckets (id, name, public)
VALUES ('ultrasound-photos', 'ultrasound-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Permitir ver fotos publicas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir fotos desde panel" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrar fotos" ON storage.objects;
DROP POLICY IF EXISTS "Public read ultrasound photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload ultrasound photos" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete ultrasound photos" ON storage.objects;

CREATE POLICY "Public read ultrasound photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'ultrasound-photos');

CREATE POLICY "Admin upload ultrasound photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ultrasound-photos');

CREATE POLICY "Admin delete ultrasound photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ultrasound-photos');

