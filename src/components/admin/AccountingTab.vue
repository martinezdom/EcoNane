<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSiteData } from '@/composables/useSiteData'
import type { SaleTicket, PaymentMethod } from '@/types'
import {
  Printer,
  Download,
  Plus,
  Receipt,
  Search,
  Check,
  X,
  Mail,
  Send,
  Eye,
  AlertTriangle,
  Trash2
} from '@lucide/vue'

const emit = defineEmits<{
  (e: 'notify', message: string): void
}>()

const {
  salesTickets,
  businessInfo,
  createSaleTicket,
  cancelSaleTicket,
  deleteSaleTicket,
  sendTicketEmail,
  getWhatsAppTicketShareUrl,
  exportTicketsToCSV
} = useSiteData()

const accountingPeriod = ref<'today' | 'month' | 't1' | 't2' | 't3' | 't4' | 'year' | 'all' | 'custom'>('month')
const customDateFrom = ref('')
const customDateTo = ref('')
const accountingSearch = ref('')
const selectedPaymentMethodFilter = ref<'all' | PaymentMethod>('all')

const ticketToCancel = ref<SaleTicket | null>(null)
const cancellationReason = ref('')
const isCancelling = ref(false)
const resendingTicketId = ref<string | null>(null)

// Modal para registrar facturas anteriores / históricas (recuperación o venta manual)
const showManualTicketModal = ref(false)
const manualTicketForm = ref({
  sequence: 1,
  year: new Date().getFullYear(),
  date: new Date().toISOString().slice(0, 10),
  time: '18:00',
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  clientNif: '',
  concept: 'Ecografía 5D Emocional',
  amount: 45,
  paymentMethod: 'efectivo' as PaymentMethod,
  notes: ''
})

function openManualTicketModal(presetSeq?: number) {
  const currentYear = new Date().getFullYear()
  let targetSeq = presetSeq || 1
  if (!presetSeq) {
    const existingSeqs = salesTickets.value
      .filter(t => t.year === currentYear)
      .map(t => t.sequence || 0)
    for (let i = 1; i <= Math.max(...existingSeqs, 0) + 1; i++) {
      if (!existingSeqs.includes(i)) {
        targetSeq = i
        break
      }
    }
  }

  manualTicketForm.value = {
    sequence: targetSeq,
    year: currentYear,
    date: new Date().toISOString().slice(0, 10),
    time: '18:00',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientNif: '',
    concept: 'Ecografía 5D Emocional',
    amount: 45,
    paymentMethod: 'efectivo',
    notes: 'Registro de factura simplificada anterior'
  }
  showManualTicketModal.value = true
}

async function handleSaveManualTicket() {
  if (!manualTicketForm.value.clientName.trim()) {
    alert('Por favor indica el nombre de la clienta.')
    return
  }
  if (!manualTicketForm.value.amount || manualTicketForm.value.amount <= 0) {
    alert('Por favor indica un importe válido mayor que 0.')
    return
  }

  const series = businessInfo.value.ticketSeries || 'FS'
  const customSeq = Number(manualTicketForm.value.sequence) || 1
  const customYear = Number(manualTicketForm.value.year) || new Date().getFullYear()
  const customNum = `${series}-${customYear}-${String(customSeq).padStart(4, '0')}`

  try {
    await createSaleTicket({
      clientName: manualTicketForm.value.clientName.trim(),
      clientPhone: manualTicketForm.value.clientPhone.trim(),
      clientEmail: manualTicketForm.value.clientEmail.trim(),
      clientNif: manualTicketForm.value.clientNif.trim(),
      customDate: manualTicketForm.value.date,
      customTime: manualTicketForm.value.time,
      customSequence: customSeq,
      customTicketNumber: customNum,
      paymentMethod: manualTicketForm.value.paymentMethod,
      notes: manualTicketForm.value.notes,
      items: [
        {
          id: `item-${Date.now()}`,
          title: manualTicketForm.value.concept.trim() || 'Servicio EcoNane',
          unitPrice: manualTicketForm.value.amount,
          quantity: 1,
          totalPrice: manualTicketForm.value.amount,
          ivaPercent: 21
        }
      ]
    })
    showManualTicketModal.value = false
    emit('notify', `Factura ${customNum} registrada correctamente.`)
  } catch (err: any) {
    alert('Error al registrar factura: ' + (err?.message || err))
  }
}

const filteredTickets = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const todayStr = now.toISOString().slice(0, 10)
  const currentMonthStr = todayStr.slice(0, 7)

  return salesTickets.value.filter(ticket => {
    const ticketDate = ticket.date
    if (accountingPeriod.value === 'today') {
      if (ticketDate !== todayStr) return false
    } else if (accountingPeriod.value === 'month') {
      if (!ticketDate.startsWith(currentMonthStr)) return false
    } else if (accountingPeriod.value === 'all') {
      // Sin filtro de fecha
    } else if (accountingPeriod.value === 't1') {
      if (ticket.year !== currentYear) return false
      const m = ticketDate.slice(5, 7)
      if (!['01', '02', '03'].includes(m)) return false
    } else if (accountingPeriod.value === 't2') {
      if (ticket.year !== currentYear) return false
      const m = ticketDate.slice(5, 7)
      if (!['04', '05', '06'].includes(m)) return false
    } else if (accountingPeriod.value === 't3') {
      if (ticket.year !== currentYear) return false
      const m = ticketDate.slice(5, 7)
      if (!['07', '08', '09'].includes(m)) return false
    } else if (accountingPeriod.value === 't4') {
      if (ticket.year !== currentYear) return false
      const m = ticketDate.slice(5, 7)
      if (!['10', '11', '12'].includes(m)) return false
    } else if (accountingPeriod.value === 'year') {
      if (ticket.year !== currentYear) return false
    } else if (accountingPeriod.value === 'custom') {
      if (customDateFrom.value && ticketDate < customDateFrom.value) return false
      if (customDateTo.value && ticketDate > customDateTo.value) return false
    }

    if (selectedPaymentMethodFilter.value !== 'all') {
      if (ticket.paymentMethod !== selectedPaymentMethodFilter.value) return false
    }

    if (accountingSearch.value.trim()) {
      const q = accountingSearch.value.toLowerCase().trim()
      const matchNumber = ticket.ticketNumber.toLowerCase().includes(q)
      const matchClient = ticket.clientName.toLowerCase().includes(q)
      const matchEmail = (ticket.clientEmail || '').toLowerCase().includes(q)
      const matchPhone = (ticket.clientPhone || '').includes(q)
      if (!matchNumber && !matchClient && !matchEmail && !matchPhone) return false
    }

    return true
  })
})

const validFilteredTickets = computed(() => {
  return filteredTickets.value.filter(t => t.status === 'valido')
})

const totalRevenue = computed(() => {
  return validFilteredTickets.value.reduce((sum, t) => sum + t.total, 0)
})

const totalSubtotal = computed(() => {
  return validFilteredTickets.value.reduce((sum, t) => sum + t.subtotal, 0)
})

const totalIva = computed(() => {
  return validFilteredTickets.value.reduce((sum, t) => sum + t.ivaAmount, 0)
})

const revenueByPaymentMethod = computed(() => {
  const result: Record<PaymentMethod, number> = {
    efectivo: 0,
    tarjeta: 0,
    bizum: 0,
    transferencia: 0
  }
  for (const t of validFilteredTickets.value) {
    if (result[t.paymentMethod] !== undefined) {
      result[t.paymentMethod] += t.total
    }
  }
  return result
})

function promptCancelTicket(ticket: SaleTicket) {
  ticketToCancel.value = ticket
  cancellationReason.value = ''
}

async function confirmCancelTicket() {
  if (!ticketToCancel.value) return
  if (!cancellationReason.value.trim()) {
    alert('Por normativa de Hacienda (R.D. 1619/2012), es obligatorio indicar el motivo de la anulación.')
    return
  }

  isCancelling.value = true
  try {
    await cancelSaleTicket(ticketToCancel.value.id, cancellationReason.value)
    emit('notify', `Ticket ${ticketToCancel.value.ticketNumber} marcado como ANULADO.`)
    ticketToCancel.value = null
  } catch (err: any) {
    alert('Error al anular ticket: ' + (err?.message || err))
  } finally {
    isCancelling.value = false
  }
}

async function handleResendEmail(ticket: SaleTicket) {
  if (!ticket.clientEmail) {
    alert('Este ticket no tiene un email de clienta registrado.')
    return
  }
  resendingTicketId.value = ticket.id
  try {
    const res = await sendTicketEmail(ticket)
    if (res.success) {
      emit('notify', `Ticket reenviado exitosamente a ${ticket.clientEmail}`)
    } else {
      alert(`No se pudo enviar el correo: ${res.message}`)
    }
  } finally {
    resendingTicketId.value = null
  }
}

function handleExportCSV() {
  const periodLabel = accountingPeriod.value
  const filename = `econane-facturas-${periodLabel}-${new Date().toISOString().slice(0, 10)}.csv`
  exportTicketsToCSV(filteredTickets.value, filename)
  emit('notify', 'Archivo CSV descargado correctamente para el asesor.')
}

async function handleDeleteSingleTicket(ticket: SaleTicket) {
  const confirmDelete = confirm(
    `¿Deseas eliminar definitivamente la factura ${ticket.ticketNumber} (${ticket.clientName} - ${ticket.total.toFixed(2)} €)?\n\n` +
    `⚠️ Esta acción solo debe usarse para tickets de prueba. Se eliminará de la base de datos.`
  )
  if (!confirmDelete) return

  await deleteSaleTicket(ticket.id)
  emit('notify', `Factura ${ticket.ticketNumber} eliminada correctamente.`)
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function handlePrintTicket(ticket: SaleTicket) {
  const printWindow = window.open('', '_blank', 'width=600,height=750')
  if (!printWindow) return

  const biz = businessInfo.value
  const itemsHtml = ticket.items.map(it => `
    <tr>
      <td style="padding: 7px 0; border-bottom: 1px dashed #e2d9d2;">${Number(it.quantity || 1)}x ${escapeHtml(it.title)}</td>
      <td style="padding: 7px 0; text-align: right; border-bottom: 1px dashed #e2d9d2; font-weight: bold;">${it.totalPrice.toFixed(2)} €</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Factura-${escapeHtml(ticket.ticketNumber)}</title>
        <style>
          @page { size: auto; margin: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px; color: #3b2c28; margin: 0; padding: 15mm 20mm; line-height: 1.5;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #5a3e36; padding-bottom: 15px; }
          .logo { font-size: 22px; font-weight: bold; color: #5a3e36; letter-spacing: -0.5px; }
          .sub { font-size: 11px; color: #7a635d; margin-top: 4px; }
          .meta-box { background: #faf7f5; border: 1px solid #ebdcd5; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .totals { margin-top: 15px; border-top: 2px solid #5a3e36; padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .grand-total { font-size: 17px; font-weight: bold; color: #5a3e36; border-top: 1px dashed #ccc; padding-top: 6px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #9c8a84; border-top: 1px solid #e2d9d2; padding-top: 12px; }
          .badge-anulado { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-weight: bold; margin-bottom: 10px; }
          .badge-type { display: inline-block; background: #f5ebe6; color: #5a3e36; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
          @media print {
            body { margin: 0 !important; padding: 15mm 20mm !important; }
            button, .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${escapeHtml(biz.name || 'EcoNane Ecografías Emocionales')}</div>
          <div style="margin-top: 4px;">
            <span class="badge-type">${ticket.isNominative ? 'Factura Nominativa' : 'Factura Simplificada'}</span>
          </div>
          <div class="sub">
            ${biz.legalName ? escapeHtml(biz.legalName) + '<br>' : ''}
            ${biz.nif ? 'NIF/CIF: ' + escapeHtml(biz.nif) + '<br>' : ''}
            ${biz.address ? escapeHtml(biz.address) + ', ' + escapeHtml(biz.postalCode) + ' ' + escapeHtml(biz.city) + '<br>' : ''}
            ${biz.phone ? 'Tel: ' + escapeHtml(biz.phone) + ' | ' : ''}${biz.email ? escapeHtml(biz.email) : ''}
          </div>
        </div>

        ${ticket.status === 'anulado' ? '<div style="text-align: center;"><span class="badge-anulado">TICKET ANULADO - ' + escapeHtml(ticket.cancelledReason || '') + '</span></div>' : ''}

        <div class="meta-box">
          <div class="meta-row"><span><strong>Nº ${ticket.isNominative ? 'Factura' : 'Ticket'}:</strong></span><span>${escapeHtml(ticket.ticketNumber)}</span></div>
          <div class="meta-row"><span><strong>Fecha y Hora:</strong></span><span>${escapeHtml(ticket.date)} - ${escapeHtml(ticket.time)}</span></div>
          <div class="meta-row"><span><strong>Clienta / Receptor:</strong></span><span>${escapeHtml(ticket.clientName)}</span></div>
          ${ticket.clientNif ? '<div class="meta-row"><span><strong>NIF/CIF:</strong></span><span>' + escapeHtml(ticket.clientNif) + '</span></div>' : ''}
          ${ticket.clientAddress ? '<div class="meta-row"><span><strong>Domicilio Fiscal:</strong></span><span>' + escapeHtml(ticket.clientAddress) + '</span></div>' : ''}
          <div class="meta-row"><span><strong>Forma de Pago:</strong></span><span style="text-transform: uppercase; font-weight: bold;">${escapeHtml(ticket.paymentMethod)}</span></div>
        </div>

        <table>
          <thead>
            <tr style="border-bottom: 1.5px solid #5a3e36; text-align: left; font-size: 11px; color: #7a635d;">
              <th style="padding-bottom: 6px;">CONCEPTO</th>
              <th style="text-align: right; padding-bottom: 6px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          ${ticket.discountAmount && ticket.discountAmount > 0 ? '<div class="total-row" style="color: #059669; font-weight: 500;"><span>Descuento aplicado (' + escapeHtml(ticket.discountNote || 'Promoción') + '):</span><span>-' + ticket.discountAmount.toFixed(2) + ' €</span></div>' : ''}
          <div class="total-row"><span>Base Imponible:</span><span>${ticket.subtotal.toFixed(2)} €</span></div>
          <div class="total-row"><span>IVA (${ticket.ivaRate}%):</span><span>${ticket.ivaAmount.toFixed(2)} €</span></div>
          <div class="total-row grand-total"><span>TOTAL PAGADO:</span><span>${ticket.total.toFixed(2)} €</span></div>
        </div>

        <div style="margin-top: 15px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 10px; color: #92400e; text-align: center; line-height: 1.4;">
          <strong>Mención de Ecografía No Diagnóstica:</strong> Servicio de carácter lúdico y emocional; no sustituye ni tiene finalidad diagnóstica médica obstétrica.
        </div>

        <div style="margin-top: 8px; font-size: 10px; color: #78716c; text-align: center; line-height: 1.3;">
          <strong>RGPD / LOPDGDD:</strong> EcoNane trata sus datos para la gestión contable y emisión del comprobante. No se cederán a terceros salvo obligación legal.
        </div>

        <div class="footer">
          Factura simplificada emitida de conformidad con el Real Decreto 1619/2012.<br>
          ${escapeHtml(biz.name || 'EcoNane')} ${biz.nif ? '· CIF/NIF: ' + escapeHtml(biz.nif) : ''}<br>
          ¡Muchísimas gracias por confiar en EcoNane para un momento tan mágico!
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 22px; font-weight: bold; background: #5a3e36; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: 14px;">🖨️ Imprimir / Guardar en PDF</button>
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch (e) {}
  }, 300)
}

function handlePrintDailyClose() {
  const printWindow = window.open('', '_blank', 'width=650,height=800')
  if (!printWindow) return

  const biz = businessInfo.value
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayTickets = salesTickets.value.filter(t => t.date === todayStr && t.status === 'valido')
  
  const totalDay = todayTickets.reduce((sum, t) => sum + t.total, 0)
  const totalSub = todayTickets.reduce((sum, t) => sum + t.subtotal, 0)
  const totalIvaAmt = todayTickets.reduce((sum, t) => sum + t.ivaAmount, 0)
  
  const cashTotal = todayTickets.filter(t => t.paymentMethod === 'efectivo').reduce((sum, t) => sum + t.total, 0)
  const cardTotal = todayTickets.filter(t => t.paymentMethod === 'tarjeta').reduce((sum, t) => sum + t.total, 0)
  const bizumTotal = todayTickets.filter(t => t.paymentMethod === 'bizum').reduce((sum, t) => sum + t.total, 0)
  const transferTotal = todayTickets.filter(t => t.paymentMethod === 'transferencia').reduce((sum, t) => sum + t.total, 0)

  const cashCount = todayTickets.filter(t => t.paymentMethod === 'efectivo').length
  const cardCount = todayTickets.filter(t => t.paymentMethod === 'tarjeta').length
  const bizumCount = todayTickets.filter(t => t.paymentMethod === 'bizum').length
  const transferCount = todayTickets.filter(t => t.paymentMethod === 'transferencia').length

  const rowsHtml = todayTickets.map(t => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${escapeHtml(t.time)}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-family: monospace; font-weight: bold;">${escapeHtml(t.ticketNumber)}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${escapeHtml(t.clientName)}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-transform: uppercase;">${escapeHtml(t.paymentMethod)}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${t.total.toFixed(2)} €</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Cierre-Caja-${escapeHtml(todayStr)}</title>
        <style>
          @page { size: auto; margin: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px; color: #292524; margin: 0; padding: 15mm 20mm; line-height: 1.5;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .header { text-align: center; border-bottom: 2px solid #5a3e36; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: bold; color: #5a3e36; }
          .date { font-size: 14px; font-weight: 600; color: #78716c; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 12px; }
          .card-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #78716c; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .highlight { font-size: 16px; font-weight: bold; color: #5a3e36; border-top: 1px dashed #d6d3d1; padding-top: 6px; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { text-align: left; background: #f5f5f4; padding: 6px 8px; font-size: 11px; text-transform: uppercase; color: #57534e; }
          .signature-box { margin-top: 35px; border-top: 1px solid #d6d3d1; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #78716c; }
          .signature-line { width: 220px; border-top: 1px solid #78716c; margin-top: 40px; text-align: center; padding-top: 4px; }
          @media print {
            body { margin: 0 !important; padding: 15mm 20mm !important; }
            button, .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${escapeHtml(biz.name || 'EcoNane')} - Cierre de Caja Diario (Arqueo)</div>
          <div class="date">Fecha: ${escapeHtml(todayStr)} · Hora de cierre: ${new Date().toTimeString().slice(0, 5)}</div>
          <div style="font-size: 11px; color: #78716c; margin-top: 4px;">${escapeHtml(biz.legalName || 'EcoNane')} · NIF: ${escapeHtml(biz.nif || 'En trámite')}</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Desglose por Forma de Cobro</div>
            <div class="row"><span>Efectivo en metálico (${cashCount} op.):</span><strong>${cashTotal.toFixed(2)} €</strong></div>
            <div class="row"><span>Tarjeta / Datáfono (${cardCount} op.):</span><strong>${cardTotal.toFixed(2)} €</strong></div>
            <div class="row"><span>Bizum (${bizumCount} op.):</span><strong>${bizumTotal.toFixed(2)} €</strong></div>
            <div class="row"><span>Transferencia (${transferCount} op.):</span><strong>${transferTotal.toFixed(2)} €</strong></div>
            <div class="row highlight"><span>TOTAL RECAUDADO:</span><span>${totalDay.toFixed(2)} €</span></div>
          </div>

          <div class="card">
            <div class="card-title">Resumen Fiscal (IVA 21%)</div>
            <div class="row"><span>Tickets válidos emitidos:</span><strong>${todayTickets.length}</strong></div>
            <div class="row"><span>Base Imponible total:</span><strong>${totalSub.toFixed(2)} €</strong></div>
            <div class="row"><span>Cuota IVA (21%):</span><strong>${totalIvaAmt.toFixed(2)} €</strong></div>
            <div class="row highlight"><span>TOTAL FACTURADO:</span><span>${totalDay.toFixed(2)} €</span></div>
          </div>
        </div>

        <div style="margin-top: 15px;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #57534e; margin-bottom: 6px;">
            Operaciones del Día (${todayTickets.length} ventas)
          </div>
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Nº Ticket</th>
                <th>Clienta</th>
                <th>Cobro</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #999;">No hay operaciones registradas en el día de hoy.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="signature-box">
          <div>
            <p><strong>Control de Efectivo en Cajón:</strong></p>
            <p>Efectivo teórico del día: ${cashTotal.toFixed(2)} €</p>
            <p>Efectivo real contado físicamente: ____________ €</p>
            <p>Diferencia de caja (+ / -): ____________ €</p>
          </div>
          <div>
            <div class="signature-line">Firma del Responsable de Caja</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 22px; font-weight: bold; background: #5a3e36; color: #fff; border: none; border-radius: 8px; cursor: pointer;">🖨️ Imprimir Hoja de Arqueo</button>
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch (e) {}
  }, 300)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Contabilidad, Caja e IVA</h2>
        <p class="text-sm text-brand-brown/80">
          Arqueos de caja diarios, desglose de IVA (21%) para la gestoría y registro fiscal según RD 1619/2012.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
        <button
          type="button"
          @click="openManualTicketModal()"
          class="w-full sm:w-auto flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-brand-pink-light/80 bg-white px-4 py-2.5 text-xs font-bold text-brand-brown-dark shadow-xs transition-all hover:bg-brand-cream active:scale-95"
          title="Registrar manualmente un ticket anterior (ej. FS-2026-0001, FS-2026-0002)"
        >
          <Plus class="h-3.5 w-3.5 text-brand-brown" />
          <span>Registrar Factura Anterior</span>
        </button>

        <button
          type="button"
          @click="handlePrintDailyClose"
          class="w-full sm:w-auto flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-brand-brown/20 bg-brand-brown px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-brown-dark active:scale-95"
          title="Imprimir resumen de cierre de caja (arqueo) del día para cuadrar efectivo y datáfono"
        >
          <Printer class="h-3.5 w-3.5" />
          <span>Imprimir Cierre Diario</span>
        </button>

        <button
          type="button"
          @click="handleExportCSV"
          class="w-full sm:w-auto flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-800 active:scale-95"
        >
          <Download class="h-4 w-4" />
          <span>Descargar Excel / CSV</span>
        </button>
      </div>
    </div>

    <!-- Period Selector Toolbar -->
    <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-4 shadow-sm sm:p-5">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70 mr-1">Período:</span>

        <button
          v-for="p in [
            { id: 'month', label: 'Este Mes' },
            { id: 'today', label: 'Hoy (Cierre)' },
            { id: 'all', label: 'Todos los Tickets' },
            { id: 't4', label: '4º Trimestre (T4)' },
            { id: 't3', label: '3º Trimestre (T3)' },
            { id: 't2', label: '2º Trimestre (T2)' },
            { id: 't1', label: '1º Trimestre (T1)' },
            { id: 'year', label: 'Año Completo' },
            { id: 'custom', label: 'Personalizado' }
          ]"
          :key="p.id"
          type="button"
          @click="accountingPeriod = (p.id as any)"
          :class="[
            'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
            accountingPeriod === p.id
              ? 'bg-brand-brown text-white shadow-sm'
              : 'bg-brand-cream/40 text-brand-brown-dark hover:bg-brand-pink-light/30'
          ]"
        >
          {{ p.label }}
        </button>
      </div>

      <!-- Custom Date Range Pickers -->
      <div v-if="accountingPeriod === 'custom'" class="mt-4 flex flex-wrap items-center gap-3 border-t border-brand-pink-light/20 pt-3">
        <div class="flex items-center gap-2">
          <span class="text-xs text-brand-brown/80 font-medium">Desde:</span>
          <input
            v-model="customDateFrom"
            type="date"
            class="rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-1.5 text-xs font-medium text-brand-brown-dark focus:border-brand-pink focus:outline-none"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-brand-brown/80 font-medium">Hasta:</span>
          <input
            v-model="customDateTo"
            type="date"
            class="rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-1.5 text-xs font-medium text-brand-brown-dark focus:border-brand-pink focus:outline-none"
          />
        </div>
      </div>

      <!-- Filters Row: Payment Method & Search -->
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-pink-light/20 pt-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-brand-brown/70">Forma de Cobro:</span>
          <select
            v-model="selectedPaymentMethodFilter"
            class="rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-1.5 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las formas</option>
            <option value="efectivo">Solo Efectivo</option>
            <option value="tarjeta">Solo Tarjeta</option>
            <option value="bizum">Solo Bizum</option>
            <option value="transferencia">Solo Transferencia</option>
          </select>
        </div>

        <div class="relative w-full sm:w-72">
          <Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-brown/60" />
          <input
            v-model="accountingSearch"
            type="text"
            placeholder="Buscar ticket, clienta, teléfono..."
            class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 pl-8 pr-3 py-1.5 text-xs text-brand-brown-dark placeholder:text-brand-brown/50 focus:border-brand-pink focus:bg-white focus:outline-none"
          />
        </div>
      </div>
    </div>

    <!-- KPI Metrics Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total Facturado -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Total Facturado</span>
          <span class="rounded-full bg-brand-cream p-2 text-brand-brown">
            <Receipt class="h-4 w-4" />
          </span>
        </div>
        <div class="mt-3 font-serif text-2xl font-bold text-brand-brown-dark">
          {{ totalRevenue.toFixed(2) }} €
        </div>
        <div class="mt-1 text-xs text-brand-brown/70">
          {{ validFilteredTickets.length }} facturas válidas
        </div>
      </div>

      <!-- Base Imponible -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Base Imponible</span>
          <span class="rounded-full bg-brand-cream p-2 text-brand-brown">
            <Receipt class="h-4 w-4" />
          </span>
        </div>
        <div class="mt-3 font-serif text-2xl font-bold text-brand-brown-dark">
          {{ totalSubtotal.toFixed(2) }} €
        </div>
        <div class="mt-1 text-xs text-brand-brown/70">
          Ingresos netos antes de impuestos
        </div>
      </div>

      <!-- IVA 21% -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">IVA Repercutido (21%)</span>
          <span class="rounded-full bg-emerald-100 p-2 text-emerald-800 font-bold text-xs">
            21%
          </span>
        </div>
        <div class="mt-3 font-serif text-2xl font-bold text-emerald-800">
          {{ totalIva.toFixed(2) }} €
        </div>
        <div class="mt-1 text-xs text-brand-brown/70">
          Cuota para modelo 303 (Trimestral)
        </div>
      </div>

      <!-- Desglose por Cobro -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm">
        <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Por Forma de Pago</span>
        <div class="mt-3 space-y-1 text-xs">
          <div class="flex justify-between">
            <span class="text-brand-brown/80 font-medium">💵 Efectivo:</span>
            <span class="font-mono font-bold">{{ revenueByPaymentMethod.efectivo.toFixed(2) }} €</span>
          </div>
          <div class="flex justify-between">
            <span class="text-brand-brown/80 font-medium">💳 Datáfono:</span>
            <span class="font-mono font-bold">{{ revenueByPaymentMethod.tarjeta.toFixed(2) }} €</span>
          </div>
          <div class="flex justify-between">
            <span class="text-brand-brown/80 font-medium">📱 Bizum:</span>
            <span class="font-mono font-bold">{{ revenueByPaymentMethod.bizum.toFixed(2) }} €</span>
          </div>
          <div class="flex justify-between">
            <span class="text-brand-brown/80 font-medium">🏦 Transferencia:</span>
            <span class="font-mono font-bold">{{ revenueByPaymentMethod.transferencia.toFixed(2) }} €</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sales Tickets Table -->
    <div class="rounded-3xl border border-brand-pink-light/40 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-brand-pink-light/20 p-5 flex items-center justify-between">
        <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Historial de Facturación</h3>
        <span class="text-xs font-semibold text-brand-brown/70">
          Mostrando {{ filteredTickets.length }} ticket(s)
        </span>
      </div>

      <div v-if="filteredTickets.length === 0" class="p-12 text-center space-y-3">
        <Receipt class="h-10 w-10 text-brand-brown/30 mx-auto" />
        <p class="text-sm font-semibold text-brand-brown-dark">No se encontraron tickets en este período o con los filtros seleccionados.</p>
        <p v-if="salesTickets.length > 0" class="text-xs text-brand-brown/70">
          Hay {{ salesTickets.length }} ticket(s) registrado(s) en total en el sistema (por ejemplo, en otros meses).
        </p>
        <div v-if="salesTickets.length > 0 && accountingPeriod !== 'all'" class="pt-2">
          <button
            type="button"
            @click="accountingPeriod = 'all'"
            class="inline-flex items-center gap-1.5 rounded-xl bg-brand-brown px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-brown-dark cursor-pointer transition-all active:scale-95"
          >
            Ver todos los tickets registrados ({{ salesTickets.length }})
          </button>
        </div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-brand-cream/30 text-[11px] uppercase tracking-wider text-brand-brown-dark font-bold border-b border-brand-pink-light/20">
            <tr>
              <th class="py-3 px-4">Nº Factura</th>
              <th class="py-3 px-4">Fecha / Hora</th>
              <th class="py-3 px-4">Clienta</th>
              <th class="py-3 px-4">Servicios</th>
              <th class="py-3 px-4">Pago</th>
              <th class="py-3 px-4 text-right">Base</th>
              <th class="py-3 px-4 text-right">IVA (21%)</th>
              <th class="py-3 px-4 text-right">Total</th>
              <th class="py-3 px-4 text-center">Estado</th>
              <th class="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-pink-light/20">
            <tr
              v-for="t in filteredTickets"
              :key="t.id"
              :class="[
                'hover:bg-brand-cream/20 transition-colors',
                t.status === 'anulado' ? 'opacity-60 bg-rose-50/30' : ''
              ]"
            >
              <td class="py-3.5 px-4 font-mono font-bold text-brand-brown-dark whitespace-nowrap">
                {{ t.ticketNumber }}
              </td>
              <td class="py-3.5 px-4 whitespace-nowrap text-brand-brown">
                <div>{{ t.date }}</div>
                <div class="text-[10px] text-brand-brown/60">{{ t.time }}</div>
              </td>
              <td class="py-3.5 px-4">
                <div class="font-bold text-brand-brown-dark">{{ t.clientName }}</div>
                <div v-if="t.clientEmail" class="text-[11px] text-brand-brown/70 truncate max-w-xs">{{ t.clientEmail }}</div>
                <div v-if="t.clientPhone" class="text-[10px] text-brand-brown/60">{{ t.clientPhone }}</div>
              </td>
              <td class="py-3.5 px-4 max-w-xs truncate text-brand-brown-dark">
                <span v-for="(it, iIdx) in t.items" :key="it.id">
                  {{ it.quantity }}x {{ it.title }}<span v-if="iIdx < t.items.length - 1">, </span>
                </span>
              </td>
              <td class="py-3.5 px-4 uppercase font-semibold text-brand-brown whitespace-nowrap">
                <span class="rounded-lg bg-brand-cream/60 px-2 py-1 text-[11px]">
                  {{ t.paymentMethod }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-right font-mono text-brand-brown whitespace-nowrap">
                {{ t.subtotal.toFixed(2) }} €
              </td>
              <td class="py-3.5 px-4 text-right font-mono text-brand-brown whitespace-nowrap">
                {{ t.ivaAmount.toFixed(2) }} €
              </td>
              <td class="py-3.5 px-4 text-right font-serif font-bold text-sm text-brand-brown-dark whitespace-nowrap">
                {{ t.total.toFixed(2) }} €
              </td>
              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <span
                  v-if="t.status === 'valido'"
                  class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
                >
                  Válido
                </span>
                <span
                  v-else
                  class="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800"
                  :title="t.cancelledReason"
                >
                  Anulado
                </span>
              </td>
              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1.5">
                  <!-- Print / View -->
                  <button
                    type="button"
                    @click="handlePrintTicket(t)"
                    class="rounded-lg border border-brand-pink-light/60 p-1.5 text-brand-brown hover:bg-brand-cream cursor-pointer"
                    title="Imprimir / Ver Ticket"
                  >
                    <Printer class="h-3.5 w-3.5" />
                  </button>

                  <!-- Re-send Email -->
                  <button
                    v-if="t.clientEmail"
                    type="button"
                    @click="handleResendEmail(t)"
                    :disabled="resendingTicketId === t.id"
                    class="rounded-lg border border-brand-pink-light/60 p-1.5 text-brand-brown hover:bg-brand-cream cursor-pointer disabled:opacity-50"
                    title="Reenviar por Email"
                  >
                    <Mail class="h-3.5 w-3.5" />
                  </button>

                  <!-- WhatsApp -->
                  <a
                    :href="getWhatsAppTicketShareUrl(t)"
                    target="_blank"
                    class="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                    title="Enviar por WhatsApp"
                  >
                    <Send class="h-3.5 w-3.5" />
                  </a>

                  <!-- Online Link -->
                  <a
                    v-if="t.viewToken"
                    :href="'/ticket/' + t.ticketNumber + '?token=' + t.viewToken"
                    target="_blank"
                    class="rounded-lg border border-brand-pink-light/60 p-1.5 text-brand-brown hover:bg-brand-cream cursor-pointer"
                    title="Ver Comprobante Online"
                  >
                    <Eye class="h-3.5 w-3.5" />
                  </a>

                  <!-- Cancel Ticket -->
                  <button
                    v-if="t.status === 'valido'"
                    type="button"
                    @click="promptCancelTicket(t)"
                    class="rounded-lg border border-amber-200 p-1.5 text-amber-700 hover:bg-amber-50 cursor-pointer"
                    title="Anular Ticket"
                  >
                    <AlertTriangle class="h-3.5 w-3.5" />
                  </button>

                  <!-- Delete Ticket (for test tickets) -->
                  <button
                    type="button"
                    @click="handleDeleteSingleTicket(t)"
                    class="rounded-lg border border-brand-pink-light/40 p-1.5 text-brand-brown/40 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Eliminar Factura de Prueba"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: ANULAR TICKET -->
    <div
      v-if="ticketToCancel"
      @click.self="ticketToCancel = null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div class="relative w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center gap-3 border-b border-rose-100 pb-3">
          <div class="rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle class="h-5 w-5" />
          </div>
          <div>
            <h3 class="font-serif text-lg font-bold text-brand-brown-dark">
              Anular Ticket {{ ticketToCancel.ticketNumber }}
            </h3>
            <p class="text-xs text-brand-brown/70">
              Clienta: {{ ticketToCancel.clientName }} ({{ ticketToCancel.total.toFixed(2) }} €)
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-bold text-brand-brown-dark">
            Motivo obligatorio de la anulación (Hacienda RD 1619/2012) *:
          </label>
          <textarea
            v-model="cancellationReason"
            rows="3"
            placeholder="Ej: Error en importe, devolución acordada con la clienta..."
            class="w-full rounded-xl border border-rose-200 bg-rose-50/20 p-3 text-xs text-brand-brown-dark focus:border-rose-400 focus:outline-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-brand-pink-light/20">
          <button
            type="button"
            @click="ticketToCancel = null"
            :disabled="isCancelling"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-brand-brown-dark hover:bg-brand-cream cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="confirmCancelTicket"
            :disabled="isCancelling || !cancellationReason.trim()"
            class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
          >
            {{ isCancelling ? 'Anulando...' : 'Confirmar Anulación' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: REGISTRAR FACTURA ANTERIOR / HISTÓRICA -->
    <div
      v-if="showManualTicketModal"
      @click.self="showManualTicketModal = false"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div class="relative w-full max-w-lg rounded-3xl border border-brand-pink-light/40 bg-white p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-brand-pink-light/30 pb-3">
          <div>
            <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Registrar Factura Anterior</h3>
            <p class="text-xs text-brand-brown/70">
              Añade facturas emitidas antes o manualmente para incluirlas en el libro de contabilidad.
            </p>
          </div>
          <button
            type="button"
            @click="showManualTicketModal = false"
            class="rounded-full p-2 text-brand-brown/50 hover:text-brand-brown hover:bg-brand-cream transition-colors cursor-pointer"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Nº Secuencia & Año -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Nº Secuencia:</label>
              <div class="flex items-center gap-2">
                <span class="rounded-xl bg-brand-cream px-3 py-2 font-mono font-bold text-brand-brown text-xs border border-brand-pink-light/40">
                  {{ businessInfo.ticketSeries || 'FS' }}-{{ manualTicketForm.year }}-
                </span>
                <input
                  v-model.number="manualTicketForm.sequence"
                  type="number"
                  min="1"
                  placeholder="1"
                  class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 font-mono font-bold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                />
              </div>
              <span class="text-[10px] text-brand-brown/60">Ejemplo: 1 para FS-2026-0001, 2 para FS-2026-0002</span>
            </div>

            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Año de Emisión:</label>
              <input
                v-model.number="manualTicketForm.year"
                type="number"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 font-mono font-bold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
          </div>

          <!-- Fecha y Hora -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Fecha:</label>
              <input
                v-model="manualTicketForm.date"
                type="date"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Hora:</label>
              <input
                v-model="manualTicketForm.time"
                type="time"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
          </div>

          <!-- Clienta & Teléfono -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Clienta / Familia *:</label>
              <input
                v-model="manualTicketForm.clientName"
                type="text"
                placeholder="Ej: Tatiana Martínez"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Teléfono (opcional):</label>
              <input
                v-model="manualTicketForm.clientPhone"
                type="tel"
                placeholder="612 345 678"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
          </div>

          <!-- Email & NIF -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Email (opcional):</label>
              <input
                v-model="manualTicketForm.clientEmail"
                type="email"
                placeholder="correo@ejemplo.com"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">NIF / CIF (opcional):</label>
              <input
                v-model="manualTicketForm.clientNif"
                type="text"
                placeholder="12345678Z"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
          </div>

          <!-- Concepto -->
          <div>
            <label class="block font-bold text-brand-brown-dark mb-1">Concepto / Servicio *:</label>
            <input
              v-model="manualTicketForm.concept"
              type="text"
              placeholder="Ej: Ecografía 5D Emocional"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
            />
          </div>

          <!-- Importe & Forma de Pago -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Importe Total (€ IVA incl.) *:</label>
              <div class="relative">
                <input
                  v-model.number="manualTicketForm.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="45.00"
                  class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 font-mono font-bold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                />
                <span class="absolute right-3 top-2 font-bold text-brand-brown/60">€</span>
              </div>
              <span class="text-[10px] text-brand-brown/60">
                Base: {{ (manualTicketForm.amount / 1.21).toFixed(2) }} € · IVA (21%): {{ (manualTicketForm.amount - (manualTicketForm.amount / 1.21)).toFixed(2) }} €
              </span>
            </div>

            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Forma de Pago:</label>
              <select
                v-model="manualTicketForm.paymentMethod"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta (Datáfono)</option>
                <option value="bizum">Bizum</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          <!-- Observaciones -->
          <div>
            <label class="block font-bold text-brand-brown-dark mb-1">Notas / Observaciones:</label>
            <input
              v-model="manualTicketForm.notes"
              type="text"
              placeholder="Opcional..."
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-brand-pink-light/30 pt-3">
          <button
            type="button"
            @click="showManualTicketModal = false"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-brand-brown/80 hover:bg-brand-cream cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleSaveManualTicket"
            class="flex items-center gap-1.5 rounded-xl bg-brand-brown px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-brown-dark active:scale-95 cursor-pointer"
          >
            <Check class="h-4 w-4" />
            <span>Guardar Factura</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
