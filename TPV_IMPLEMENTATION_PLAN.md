# Plan de Implementación: Módulo TPV Digital y Contabilidad para EcoNane

Diseñar e implementar un sistema de **TPV Digital (Caja rápida)**, **Facturación simplificada con envío de ticket por correo** y **Contabilidad e Informes fiscales (diario, mensual, trimestral y anual con exportación a Excel)** integrado en `/admin`.

---

## 1. Arquitectura y Componentes

### 1.1 Modelo de Datos (`src/types/index.ts`)
- **`TicketItem`**: Línea de producto/servicio (`title`, `quantity`, `unitPrice`, `totalPrice`, `ivaPercent`).
- **`SaleTicket`**: Ticket / Factura Simplificada completa:
  - `id`: Identificador único.
  - `ticketNumber`: Serie correlativa legal (ej: `FS-2026-0001`).
  - `date`, `time`: Fecha y hora de emisión.
  - `clientName`, `clientEmail`, `clientPhone`, `clientNif` (opcional).
  - `items`: Lista de servicios/packs incluidos.
  - `subtotal` (Base imponible), `ivaAmount` (Cuota IVA 21%), `total`.
  - `paymentMethod`: `efectivo` | `tarjeta` | `bizum` | `transferencia`.
  - `status`: `valido` | `anulado`.
  - `notes`: Notas internas.
  - `emailSent`: Estado del envío por correo.
- **`BusinessInfo`**: Datos fiscales del negocio (Razón Social, NIF/CIF, Dirección, Serie de facturación, etc.) configurables en el panel.

### 1.2 Persistencia y Base de Datos (`src/composables/useSiteData.ts` & `supabase_schema.sql`)
- Nueva tabla en Supabase: `public.sales_tickets` con RLS habilitado y políticas de acceso.
- Almacenamiento local fallback en `localStorage` (`econane_sales_tickets`, `econane_business_info`) y sincronización reactiva bidireccional con Supabase.
- Métodos en `useSiteData`:
  - `createSaleTicket(data)`: Genera el número correlativo automático sin saltos, calcula base imponible e IVA, y persiste en Supabase.
  - `cancelSaleTicket(id, reason)`: Anula un ticket manteniendo la integridad correlativa para Hacienda.
  - `updateBusinessInfo(info)`: Guarda los datos de facturación.
  - `exportTicketsToCSV(filteredTickets)`: Descarga el archivo para el gestor protegido contra inyección CSV.

### 1.3 Envío de Tickets por Email (`functions/api/send-ticket.js`)
- Endpoint serverless de Cloudflare Functions usando la API de Resend (`RESEND_API_KEY`).
- Plantilla HTML profesional corporativa de ticket digital EcoNane con:
  - Cabecera con logo y datos fiscales de EcoNane.
  - Número de ticket y fecha/hora.
  - Datos de la clienta.
  - Desglose de servicios, Base Imponible, IVA 21% y Total.
  - Medio de pago empleado.
  - Pie de página con política legal y agradecimiento.
- Prevención de inyección HTML y validación estricta de remitente y destinatario.

### 1.4 Interfaz de Usuario en `/admin` (`AdminDashboardView.vue`)
- **Pestaña "TPV / Cobro Rápido"**:
  - Botones táctiles grandes con los servicios y packs activos de EcoNane (con sus precios).
  - Selector de método de pago de un solo clic (`Efectivo`, `Tarjeta`, `Bizum`).
  - Posibilidad de buscar/autocompletar clienta de las entregas de fotos o escribir nombre y email.
  - Desglose instantáneo en pantalla: Base Imponible + IVA 21% = Total.
  - Botón principal: **"Cobrar y Enviar Ticket"** (registra la venta, envía el email y muestra modal con opciones de WhatsApp / Ver ticket / Imprimir).
- **Pestaña "Contabilidad e Informes"**:
  - **Tarjetas resumen**: Total cobrado, Base imponible, Total IVA 21%, desgloses por Efectivo, Tarjeta y Bizum.
  - **Filtros rápidos**:
    - **Hoy** (Arqueo / Cierre de caja diario).
    - **Este Mes**.
    - **Por Trimestres**: T1 (Ene-Mar), T2 (Abr-Jun), T3 (Jul-Sep), T4 (Oct-Dic) para el modelo 303 de IVA.
    - **Anual** o rango de fechas personalizado.
  - **Tabla de facturación**: Listado correlativo con búsqueda, estado, reenvío de email, anulación y visualización.
  - **Botón "Exportar a Excel / CSV para Asesor"**: Genera un archivo con las columnas exactas que pide la gestoría.
- **En Pestaña "Seguridad y Datos"**:
  - Configuración de datos fiscales del emisor (Nombre/Razón Social, NIF, Dirección fiscal, Teléfono, Serie).

---

## 2. Medidas de Seguridad
1. **Validación estricta de tipos y sanitización**:
   - `escapeHtml` para evitar XSS en el correo y en la interfaz.
   - `sanitizeCsvCell` para evitar ataques de inyección de fórmulas CSV (`=`, `+`, `-`, `@`).
2. **Integridad correlativa**: El generador de números calcula el siguiente correlativo garantizando que no haya duplicados ni saltos.
3. **Imputación inmutable**: Los tickets no se borran silenciosamente; se marcan como anulados con fecha y motivo para cumplir la Ley Antifraude y el Reglamento de Facturación (RD 1619/2012).
4. **Protección de API Keys**: La clave de Resend se mantiene en el entorno del servidor (Cloudflare Functions), nunca expuesta en el frontend.

---

## 3. Fases de Ejecución
1. Actualizar `src/types/index.ts` con los tipos fiscales y de tickets.
2. Actualizar `supabase_schema.sql` con la tabla `sales_tickets`.
3. Actualizar `src/composables/useSiteData.ts` con la lógica contable, correlatividad, persistencia y exportación.
4. Crear `functions/api/send-ticket.js` con la plantilla HTML del ticket y envío vía Resend.
5. Desarrollar las interfaces en `src/views/AdminDashboardView.vue` (Pestañas TPV y Contabilidad).
6. Compilar y verificar con `npm run build` sin errores.
