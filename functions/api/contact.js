export async function onRequestPost(context) {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  try {
    const body = await request.json()
    const { nombre, email, telefono, semana, servicio, horario, mensaje, turnstileToken } = body

    if (!nombre || !telefono) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios (nombre o teléfono)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const verifyResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `secret=${encodeURIComponent(env.TURNSTILE_SECRET_KEY)}&response=${encodeURIComponent(turnstileToken)}`
        }
      )
      const verifyData = await verifyResponse.json()
      if (!verifyData.success) {
        return new Response(
          JSON.stringify({ error: 'Verificación de seguridad inválida o caducada' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
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

    const cleanNombre = escapeHtml(nombre)
    const cleanEmail = escapeHtml(email || 'No proporcionado')
    const cleanTelefono = escapeHtml(telefono)
    const cleanSemana = escapeHtml(semana || 'No especificada')
    const cleanServicio = escapeHtml(servicio || 'Eco 4D / 5D')
    const cleanHorario = escapeHtml(horario || 'Flexible')
    const cleanMensaje = escapeHtml(mensaje || 'Sin notas adicionales')

    if (!env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ success: true, warning: 'RESEND_API_KEY no configurada aún en Cloudflare' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const destinationEmail = env.DESTINATION_EMAIL || 'naneecografias@gmail.com'
    const fromEmail = env.FROM_EMAIL || 'EcoNane Web <web@econane.es>'

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'EcoNane-Web/1.0'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: destinationEmail,
        subject: `👶 Nueva solicitud de cita [${cleanServicio}] - ${cleanNombre}`,
        html: `
          <div style="margin: 0; padding: 0; background-color: #fdfbf7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 100%;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fdfbf7; padding: 20px 10px;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(90, 56, 42, 0.08); border: 1px solid #f2e3d8; text-align: left;">
                    <tr>
                      <td style="background-color: #8c5a47; padding: 26px 32px;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-family: Georgia, serif; font-weight: 700;">EcoNane</h1>
                        <p style="margin: 4px 0 0 0; color: #f6efe9; font-size: 13px;">Nueva solicitud de cita desde econane.es</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 32px; color: #4a3429;">
                        <h2 style="margin-top: 0; margin-bottom: 20px; color: #2c1a12; font-size: 17px; font-weight: 700;">Detalles de la Cita</h2>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; width: 35%; font-weight: 700; color: #8c5a47; font-size: 12px; text-transform: uppercase;">Mamá / Familia</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; color: #2c1a12; font-size: 14px; font-weight: 600;">${cleanNombre}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; font-weight: 700; color: #8c5a47; font-size: 12px; text-transform: uppercase;">Teléfono Móvil</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; color: #2c1a12; font-size: 14px;"><a href="tel:${cleanTelefono}" style="color: #8c5a47; font-weight: bold; text-decoration: none;">${cleanTelefono}</a></td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; font-weight: 700; color: #8c5a47; font-size: 12px; text-transform: uppercase;">Semana Gestación</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; color: #2c1a12; font-size: 14px;">${cleanSemana}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; font-weight: 700; color: #8c5a47; font-size: 12px; text-transform: uppercase;">Servicio Deseado</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; color: #2c1a12; font-size: 14px;"><span style="background-color: #fbf5ef; color: #8c5a47; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700;">${cleanServicio}</span></td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; font-weight: 700; color: #8c5a47; font-size: 12px; text-transform: uppercase;">Preferencia Horaria</td>
                            <td style="padding: 10px 0; border-bottom: 1px solid #f6efe9; color: #2c1a12; font-size: 14px;">${cleanHorario}</td>
                          </tr>
                        </table>
                        <h3 style="margin-bottom: 8px; color: #2c1a12; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #8c5a47;">Comentarios / Notas:</h3>
                        <div style="background-color: #fdfbf7; border-left: 4px solid #8c5a47; padding: 14px 16px; border-radius: 0 10px 10px 0; color: #4a3429; font-size: 13px; line-height: 1.5; font-style: italic;">${cleanMensaje}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #faf5f0; padding: 16px 32px; text-align: center; font-size: 12px; color: #8c5a47;">
                        EcoNane · Villajoyosa, Alicante · <a href="https://econane.es" style="color: #8c5a47; text-decoration: underline;">econane.es</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </div>
        `
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Error al enviar el email vía Resend', details: resendData }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
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
