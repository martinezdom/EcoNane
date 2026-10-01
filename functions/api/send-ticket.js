export async function onRequestPost(context) {
  const { request, env } = context

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  try {
    const body = await request.json()
    const { ticket, businessInfo } = body

    if (!ticket) {
      return new Response(
        JSON.stringify({ error: 'Faltan los datos del ticket' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ticket.clientEmail || !ticket.clientEmail.trim()) {
      return new Response(
        JSON.stringify({ error: 'El ticket no tiene un email de cliente destinatario' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(ticket.clientEmail.trim())) {
      return new Response(
        JSON.stringify({ error: 'El formato del email de la clienta no es válido' }),
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

    const cleanTicketNumber = escapeHtml(ticket.ticketNumber || 'FS-0001').slice(0, 50)
    const cleanDate = escapeHtml(ticket.date || new Date().toISOString().slice(0, 10))
    const cleanTime = escapeHtml(ticket.time || '12:00')
    const cleanClientName = escapeHtml(ticket.clientName || 'Cliente').slice(0, 100)
    const cleanClientNif = escapeHtml(ticket.clientNif || '').slice(0, 20)
    const cleanClientAddress = escapeHtml(ticket.clientAddress || '').slice(0, 200)
    const isNominative = Boolean(ticket.isNominative)
    const cleanPayment = escapeHtml(ticket.paymentMethod || 'Efectivo').toUpperCase()
    const cleanNotes = escapeHtml(ticket.notes || '').slice(0, 500)
    const viewToken = escapeHtml(ticket.viewToken || '')

    const biz = businessInfo || {}
    const cleanBizName = escapeHtml(biz.name || 'EcoNane Ecografía Emocional')
    const cleanBizLegal = escapeHtml(biz.legalName || 'EcoNane')
    const cleanBizNif = escapeHtml(biz.nif || '')
    const cleanBizAddress = escapeHtml(biz.address || 'Villajoyosa, Alicante')
    const cleanBizPhone = escapeHtml(biz.phone || '644189856')
    const cleanBizEmail = escapeHtml(biz.email || 'info@econane.es')

    const subtotalFormatted = Number(ticket.subtotal || 0).toFixed(2)
    const ivaRateFormatted = Number(ticket.ivaRate || 21).toFixed(0)
    const ivaAmountFormatted = Number(ticket.ivaAmount || 0).toFixed(2)
    const discountAmount = Number(ticket.discountAmount || 0)
    const discountFormatted = discountAmount.toFixed(2)
    const discountNote = escapeHtml(ticket.discountNote || '')
    const totalFormatted = Number(ticket.total || 0).toFixed(2)

    // Generar filas de la tabla de servicios
    const itemsRows = (ticket.items || [])
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f2e3d8; font-size: 14px; color: #2c1a12; font-weight: 600;">
            ${escapeHtml(item.title)}
            <div style="font-size: 11px; color: #8c5a47; font-weight: normal; margin-top: 2px;">
              Cant: ${Number(item.quantity || 1)} × ${Number(item.unitPrice || 0).toFixed(2)}€
            </div>
          </td>
          <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f2e3d8; font-size: 14px; color: #2c1a12; font-weight: bold;">
            ${Number(item.totalPrice || item.unitPrice || 0).toFixed(2)}€
          </td>
        </tr>
      `
      )
      .join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Ticket Digital - ${cleanTicketNumber}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fdfbf7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fdfbf7; padding: 25px 12px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 24px rgba(90, 56, 42, 0.08); border: 1px solid #f2e3d8; text-align: left;">
                
                <!-- Encabezado con marca EcoNane -->
                <tr>
                  <td style="background-color: #8c5a47; padding: 28px 32px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-family: Georgia, serif; font-weight: bold; letter-spacing: 0.5px;">EcoNane</h1>
                    <p style="margin: 4px 0 0 0; color: #fbf5ef; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">Ecografías 4D & 5D Emocionales</p>
                  </td>
                </tr>

                <!-- Cabecera del Ticket -->
                <tr>
                  <td style="padding: 30px 32px 10px 32px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                      <tr>
                        <td>
                          <span style="background-color: #fbf5ef; color: #8c5a47; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; border: 1px solid #f2e3d8;">
                            ${isNominative ? 'Factura Nominativa' : 'Factura Simplificada'}
                          </span>
                          <h2 style="margin: 8px 0 2px 0; font-size: 20px; font-weight: bold; color: #2c1a12;">
                            Nº ${cleanTicketNumber}
                          </h2>
                          <p style="margin: 0; font-size: 12px; color: #7c685f;">
                            Fecha: ${cleanDate} a las ${cleanTime}h
                          </p>
                        </td>
                        <td align="right" valign="top" style="font-size: 11px; color: #7c685f; line-height: 1.4;">
                          <strong style="color: #2c1a12;">${cleanBizLegal}</strong><br>
                          ${cleanBizNif ? `NIF: ${cleanBizNif}<br>` : ''}
                          ${cleanBizAddress}<br>
                          Tel: ${cleanBizPhone}
                        </td>
                      </tr>
                    </table>

                    <!-- Datos Clienta -->
                    <div style="background-color: #faf5f0; border-radius: 14px; padding: 12px 16px; margin-bottom: 24px; border: 1px solid #f2e3d8;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; color: #4a3429;">
                        <tr>
                          <td style="color: #8c5a47; font-weight: bold; width: 30%;">Clienta / Receptor:</td>
                          <td style="font-weight: 600; color: #2c1a12;">${cleanClientName}</td>
                        </tr>
                        ${cleanClientNif ? `
                        <tr>
                          <td style="color: #8c5a47; font-weight: bold; padding-top: 4px;">NIF / CIF:</td>
                          <td style="color: #2c1a12; padding-top: 4px;">${cleanClientNif}</td>
                        </tr>` : ''}
                        ${cleanClientAddress ? `
                        <tr>
                          <td style="color: #8c5a47; font-weight: bold; padding-top: 4px;">Domicilio Fiscal:</td>
                          <td style="color: #2c1a12; padding-top: 4px;">${cleanClientAddress}</td>
                        </tr>` : ''}
                        <tr>
                          <td style="color: #8c5a47; font-weight: bold; padding-top: 4px;">Método de Pago:</td>
                          <td style="color: #2c1a12; padding-top: 4px; font-weight: 600;">${cleanPayment}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Tabla de Líneas de Servicios -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                      <thead>
                        <tr>
                          <th align="left" style="font-size: 11px; text-transform: uppercase; color: #8c5a47; padding-bottom: 8px; border-bottom: 2px solid #8c5a47; letter-spacing: 0.5px;">Concepto / Sesión</th>
                          <th align="right" style="font-size: 11px; text-transform: uppercase; color: #8c5a47; padding-bottom: 8px; border-bottom: 2px solid #8c5a47; letter-spacing: 0.5px;">Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsRows}
                      </tbody>
                    </table>

                    <!-- Desglose de Totales e IVA -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                      ${discountAmount > 0 ? `
                      <tr>
                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #059669; font-weight: 600;">Descuento ${discountNote ? `(${discountNote})` : ''}:</td>
                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #059669; font-weight: bold; width: 90px;">-${discountFormatted}€</td>
                      </tr>` : ''}
                      <tr>
                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #7c685f;">Base Imponible:</td>
                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #2c1a12; width: 90px;">${subtotalFormatted}€</td>
                      </tr>
                      <tr>
                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #7c685f;">IVA (${ivaRateFormatted}%):</td>
                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #2c1a12; width: 90px;">${ivaAmountFormatted}€</td>
                      </tr>
                      <tr>
                        <td align="right" style="padding: 12px 0 4px 0; font-size: 16px; font-weight: bold; color: #8c5a47; border-top: 2px solid #f2e3d8;">TOTAL PAGADO:</td>
                        <td align="right" style="padding: 12px 0 4px 0; font-size: 20px; font-weight: bold; color: #8c5a47; border-top: 2px solid #f2e3d8; width: 90px;">${totalFormatted}€</td>
                      </tr>
                    </table>

                    ${cleanNotes ? `
                    <div style="background-color: #fdfbf7; border-left: 3px solid #8c5a47; padding: 10px 12px; font-size: 12px; color: #5a453b; margin-bottom: 24px;">
                      <strong>Notas:</strong> ${cleanNotes}
                    </div>` : ''}

                    ${viewToken ? `
                    <div style="text-align: center; margin: 24px 0 16px 0;">
                      <a href="https://econane.es/ticket/${cleanTicketNumber}?token=${viewToken}" target="_blank" style="background-color: #8c5a47; color: #ffffff; padding: 12px 26px; border-radius: 12px; font-size: 13px; font-weight: bold; text-decoration: none; display: inline-block;">
                        📄 Ver y Descargar Factura en PDF
                      </a>
                    </div>` : ''}

                    <!-- Mención de Ecografía No Diagnóstica -->
                    <div style="margin: 18px 0 10px 0; padding: 10px 14px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; font-size: 11px; color: #92400e; text-align: center; line-height: 1.4;">
                      <strong>Mención de Ecografía No Diagnóstica:</strong> Servicio de carácter lúdico y emocional; no sustituye ni tiene finalidad diagnóstica médica obstétrica.
                    </div>

                    <div style="text-align: center; padding: 16px 0 10px 0; border-top: 1px dashed #f2e3d8;">
                      <p style="margin: 0; font-size: 13px; font-weight: bold; color: #8c5a47;">
                        ¡Muchas gracias por confiar en EcoNane para un recuerdo tan especial! ❤️
                      </p>
                      <p style="margin: 6px 0 0 0; font-size: 10px; color: #9c8980; line-height: 1.4;">
                        Factura simplificada emitida de conformidad con el Real Decreto 1619/2012.
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 10px; color: #9c8980; line-height: 1.4;">
                        <strong>Protección de Datos:</strong> De conformidad con el RGPD y la LOPDGDD, EcoNane trata sus datos para la gestión contable y envío del comprobante de compra. No se cederán a terceros salvo obligación legal.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Pie de página -->
                <tr>
                  <td style="background-color: #faf5f0; padding: 16px 32px; text-align: center; font-size: 11px; color: #8c5a47;">
                    EcoNane · Villajoyosa (Alicante) · <a href="https://econane.es" style="color: #8c5a47; text-decoration: underline;">econane.es</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `

    if (!env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'RESEND_API_KEY no configurada aún en Cloudflare Pages. El ticket se guardó correctamente.',
          simulated: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const fromEmail = env.FROM_EMAIL || 'EcoNane <info@econane.es>'

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'EcoNane-TPV/1.0'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ticket.clientEmail.trim(),
        subject: `🧾 Tu ticket de EcoNane - Factura Simplificada ${cleanTicketNumber}`,
        html: emailHtml
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Error al enviar email vía Resend', details: resendData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error interno al procesar el ticket', message: error.message }),
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
