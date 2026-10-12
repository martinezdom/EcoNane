export async function onRequestPost(context) {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  try {
    const body = await request.json()
    const { appointment, businessInfo } = body

    if (!appointment) {
      return new Response(
        JSON.stringify({ error: 'Faltan los datos de la reserva' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const escapeHtml = (str) => {
      if (!str) return ''
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }

    const cleanCode = escapeHtml(appointment.bookingCode || 'ECO-CITA')
    const cleanClientName = escapeHtml(appointment.clientName || 'Mamá')
    const cleanClientPhone = escapeHtml(appointment.clientPhone || '')
    const cleanClientEmail = escapeHtml(appointment.clientEmail || '').trim()
    const cleanDate = escapeHtml(appointment.date || '')
    const cleanTime = escapeHtml(appointment.time || '')
    const cleanService = escapeHtml(appointment.serviceTitle || 'Sesión de Ecografía Emocional')
    const cleanDuration = escapeHtml(appointment.serviceDuration || '45')
    const cleanPrice = escapeHtml(appointment.servicePrice || '')
    const cleanWeek = escapeHtml(appointment.gestationWeek || '')
    const cleanNotes = escapeHtml(appointment.notes || '')

    const biz = businessInfo || {}
    const cleanBizName = escapeHtml(biz.name || 'EcoNane Ecografías Emocionales')
    const cleanBizAddress = escapeHtml(biz.address || 'Carrer Colón, 114')
    const cleanBizCity = escapeHtml(biz.city || 'La Vila Joiosa, Alicante')
    const cleanBizPhone = escapeHtml(biz.phone || '+34 644 18 98 56')

    const resendApiKey = env?.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY no está configurada en variables de entorno. Envío simulado.')
      return new Response(
        JSON.stringify({ success: true, simulated: true, message: 'Modo desarrollo: RESEND_API_KEY no configurada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Email template for Client
    const clientHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Cita Confirmada en EcoNane!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fcf9f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2e2825; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fcf9f6; padding: 25px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 28px; overflow: hidden; border: 1px solid #ebdcd5; box-shadow: 0 4px 20px rgba(90, 62, 54, 0.06);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c4c38 0%, #5a3e36 100%); padding: 35px 25px; text-align: center; color: #ffffff;">
              <span style="display: inline-block; background-color: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                ¡RESERVA CONFIRMADA!
              </span>
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; font-family: Georgia, serif; letter-spacing: -0.5px;">
                ${cleanBizName}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">
                Código de Cita: <strong style="font-family: monospace; letter-spacing: 1px; color: #f9d8cb;">${cleanCode}</strong>
              </p>
            </td>
          </tr>

          <!-- Welcome message -->
          <tr>
            <td style="padding: 30px 30px 15px 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #5a3e36; font-family: Georgia, serif;">
                ¡Hola, ${cleanClientName}! ❤️
              </h2>
              <p style="margin: 0; font-size: 14px; color: #574f4b; line-height: 1.6;">
                Tu cita para conocer la carita de tu bebé ya está confirmada en nuestro centro. Estamos deseando vivir este momento tan especial junto a ti y tu familia.
              </p>
            </td>
          </tr>

          <!-- Appointment Summary Card -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fbf7f4; border: 1px solid #f2e2da; border-radius: 20px; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px dashed #e6d3c9;">
                    <span style="font-size: 11px; color: #8c7b74; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Servicio Seleccionado</span>
                    <div style="font-size: 16px; font-weight: 700; color: #5a3e36; margin-top: 2px;">
                      ${cleanService}
                    </div>
                    <div style="font-size: 12px; color: #736761;">
                      Duración aproximada: ${cleanDuration} minutos ${cleanPrice ? `· ${cleanPrice}` : ''}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 12px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="vertical-align: top;">
                          <span style="font-size: 11px; color: #8c7b74; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Fecha</span>
                          <div style="font-size: 15px; font-weight: 700; color: #2e2825; margin-top: 2px;">
                            📅 ${cleanDate}
                          </div>
                        </td>
                        <td width="50%" style="vertical-align: top;">
                          <span style="font-size: 11px; color: #8c7b74; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Hora de Cita</span>
                          <div style="font-size: 15px; font-weight: 700; color: #2e2825; margin-top: 2px;">
                            ⏰ ${cleanTime}
                          </div>
                        </td>
                      </tr>
                      ${cleanWeek ? `
                      <tr>
                        <td colspan="2" style="padding-top: 10px;">
                          <span style="font-size: 11px; color: #8c7b74; text-transform: uppercase; font-weight: 700;">Etapa:</span>
                          <span style="font-size: 13px; color: #5a3e36; font-weight: 600;">🤰 ${cleanWeek}</span>
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Location & Tips -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #5a3e36; font-weight: 700;">
                📍 Dónde estamos
              </h3>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #574f4b;">
                <strong>${cleanBizName}</strong><br>
                ${cleanBizAddress}, ${cleanBizCity}<br>
                Teléfono: ${cleanBizPhone}
              </p>
              <a href="https://maps.google.com/?q=${encodeURIComponent(cleanBizAddress + ', ' + cleanBizCity)}" target="_blank" style="display: inline-block; font-size: 12px; color: #b86248; font-weight: 700; text-decoration: underline;">
                Ver en Google Maps →
              </a>
            </td>
          </tr>

          <!-- Tips Card -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fdf5f2; border-left: 4px solid #b86248; border-radius: 12px; padding: 14px 18px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #823824; font-weight: 700;">
                  💡 Consejos para el día de tu ecografía:
                </h4>
                <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #61463e; line-height: 1.6;">
                  <li><strong>Hidratación:</strong> Bebe agua con normalidad en los días previos. Un buen nivel de líquido ayuda a que las fotos salgan más nítidas.</li>
                  <li><strong>Un toque dulce:</strong> Si tu médico no te lo desaconseja, tomar un zumo o algo dulce 15 minutos antes anima al bebé a moverse.</li>
                  <li><strong>Acompañantes:</strong> ¡Ven acompañada de tu pareja, hijos o familiares! Nuestra sala está adaptada para que todos disfruten.</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- WhatsApp Contact Button -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="https://wa.me/34644189856?text=${encodeURIComponent('Hola Mireia, tengo una duda sobre mi cita ' + cleanCode)}" target="_blank" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 25px; border-radius: 25px; box-shadow: 0 2px 10px rgba(37,211,102,0.3);">
                Escribir por WhatsApp si tienes cualquier duda
              </a>
            </td>
          </tr>

          <!-- Footer Legal -->
          <tr>
            <td style="background-color: #f7ede8; padding: 20px 30px; text-align: center; font-size: 11px; color: #8c7b74; border-top: 1px solid #ebdcd5;">
              <p style="margin: 0 0 6px 0;">
                ${cleanBizName} · ${cleanBizAddress}, ${cleanBizCity}
              </p>
              <p style="margin: 0; line-height: 1.4;">
                Servicio lúdico y emocional no diagnóstico. No sustituye controles obstétricos oficiales. De conformidad con el RGPD, tratamos sus datos únicamente para gestionar su reserva.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

    // 2. Email template for Clinic (Mireia)
    const clinicHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #333; line-height: 1.5; padding: 20px;">
  <div style="max-width: 550px; background: #fff; border: 1px solid #ddd; border-radius: 16px; padding: 20px;">
    <h2 style="color: #7c4c38; margin-top: 0;">🗓️ Nueva Cita Web en EcoNane</h2>
    <p>Se ha registrado una nueva reserva desde la página web:</p>
    
    <div style="background: #fdf8f5; border: 1px solid #f2ded5; border-radius: 12px; padding: 15px; margin: 15px 0;">
      <p style="margin: 4px 0;"><strong>Código:</strong> ${cleanCode}</p>
      <p style="margin: 4px 0;"><strong>Clienta:</strong> ${cleanClientName}</p>
      <p style="margin: 4px 0;"><strong>Teléfono:</strong> <a href="tel:${cleanClientPhone}">${cleanClientPhone}</a></p>
      ${cleanClientEmail ? `<p style="margin: 4px 0;"><strong>Email:</strong> ${cleanClientEmail}</p>` : ''}
      <hr style="border: none; border-top: 1px dashed #ddd; margin: 10px 0;">
      <p style="margin: 4px 0;"><strong>Fecha:</strong> ${cleanDate}</p>
      <p style="margin: 4px 0;"><strong>Hora:</strong> ${cleanTime} (${cleanDuration} min)</p>
      <p style="margin: 4px 0;"><strong>Servicio:</strong> ${cleanService} ${cleanPrice ? `(${cleanPrice})` : ''}</p>
      ${cleanWeek ? `<p style="margin: 4px 0;"><strong>Semana:</strong> ${cleanWeek}</p>` : ''}
      ${cleanNotes ? `<p style="margin: 4px 0;"><strong>Notas / Mensaje:</strong> ${cleanNotes}</p>` : ''}
    </div>

    <div style="margin-top: 20px;">
      <a href="https://wa.me/${cleanClientPhone.replace(/\D/g, '')}?text=${encodeURIComponent('¡Hola ' + cleanClientName + '! Te escribo de EcoNane sobre tu cita para el día ' + cleanDate + ' a las ' + cleanTime + '.')}" 
         style="display: inline-block; background: #25d366; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
        Abrir chat de WhatsApp con la clienta
      </a>
    </div>
  </div>
</body>
</html>
`

    // Send to Clinic
    const emailPromises = []

    emailPromises.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'EcoNane Reservas <info@econane.es>',
          to: ['info@econane.es'],
          subject: `🗓️ NUEVA RESERVA WEB: ${cleanClientName} · ${cleanDate} ${cleanTime}`,
          html: clinicHtml
        })
      })
    )

    // Send to Client if email provided
    if (cleanClientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanClientEmail)) {
      emailPromises.push(
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'EcoNane Ecografías <info@econane.es>',
            reply_to: 'info@econane.es',
            to: [cleanClientEmail],
            subject: `¡Cita Confirmada en EcoNane! ❤️ ${cleanDate} a las ${cleanTime}`,
            html: clientHtml
          })
        })
      )
    }

    const responses = await Promise.all(emailPromises)
    const allOk = responses.every(r => r.ok)

    return new Response(
      JSON.stringify({ success: allOk }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error procesando la confirmación de la cita', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  })
}
