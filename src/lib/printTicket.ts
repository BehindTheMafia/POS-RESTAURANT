import type { SaleReportItem } from '../hooks/useSalesReports'
import { supabase } from './supabase'
import {
  buildEscPosTicket,
  isBluetoothEnabled,
  isBluetoothSupported,
  printEscPos,
  reconnectPrinter,
} from './bluetoothPrinter'

type PrintTicketOptions = {
  restaurantName?: string | null
  commercialName?: string | null
  currency?: string
  ticketMessage?: string
  ticketSize?: '58mm' | '80mm'
  title?: string
  forceBrowser?: boolean
}

const printViaBrowser = (
  sale: SaleReportItem,
  options: PrintTicketOptions = {}
) => {
  const currency = options.currency ?? 'C$'
  const msg = options.ticketMessage ?? '¡Gracias por visitarnos!'
  const ticketSize = options.ticketSize ?? '80mm'
  const title = options.title ?? 'Ticket'
  const mesaName = sale.orders?.mesa?.nombre === 'Mostrador'
    ? 'Mostrador'
    : (sale.orders?.mesa?.nombre || 'N/A')

  const itemsHtml = (sale.orders?.order_items ?? []).map(item => `
    <tr>
      <td style="padding: 3px 0;">${item.product?.nombre ?? 'Producto'} x ${item.cantidad}</td>
      <td style="text-align: right; padding: 3px 0;">${currency} ${(item.precio_unitario * item.cantidad).toFixed(2)}</td>
    </tr>
  `).join('')

  const paymentsHtml = sale.payments.map(p => {
    const note = p.nota ? ` (${p.nota})` : ''
    const ref = p.referencia ? ` Ref: ${p.referencia}` : ''
    return `<div>${p.payment_method?.nombre ?? 'Pago'}: ${currency} ${Number(p.monto).toFixed(2)}${note}${ref}</div>`
  }).join('')

  const printWindow = window.open('', '_blank', 'width=350,height=600')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>${title} #${sale.orders?.id?.slice(0, 8) || sale.id.slice(0, 8)}</title>
        <style>
          @page { size: auto; margin: 0mm; }
          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #000; padding: 15px; width: ${ticketSize === '58mm' ? '200px' : '280px'}; margin: 0 auto; }
          .text-center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .title { font-size: 16px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          .footer { margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="text-center title">${options.restaurantName || 'PRIMEWINGS POS'}</div>
        <div class="text-center">${options.commercialName || ''}</div>
        <div class="divider"></div>
        <div><b>${title}:</b> #${sale.orders?.id?.slice(0, 8) || sale.id.slice(0, 8)}</div>
        <div><b>Fecha:</b> ${new Date(sale.fecha).toLocaleDateString()} ${new Date(sale.fecha).toLocaleTimeString()}</div>
        <div><b>Mesa:</b> ${mesaName}</div>
        <div><b>Cajero:</b> ${sale.cajero?.nombre || 'Sistema'}</div>
        <div><b>Cliente:</b> ${sale.cliente || 'Consumidor Final'}</div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #000;">Detalle</th>
              <th style="text-align: right; border-bottom: 1px solid #000;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="divider"></div>
        <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${currency} ${Number(sale.subtotal).toFixed(2)}</span></div>
        ${sale.descuento > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Descuento:</span><span>-${currency} ${Number(sale.descuento).toFixed(2)}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between;"><span>Impuestos:</span><span>${currency} ${Number(sale.impuestos).toFixed(2)}</span></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;"><span>TOTAL:</span><span>${currency} ${Number(sale.total).toFixed(2)}</span></div>
        <div class="divider"></div>
        <div><b>Métodos de pago:</b></div>
        ${paymentsHtml}
        <div class="divider"></div>
        <div class="text-center footer">${msg}</div>
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

export const printSaleTicket = async (
  sale: SaleReportItem,
  options: PrintTicketOptions = {}
) => {
  if (
    !options.forceBrowser &&
    isBluetoothSupported() &&
    isBluetoothEnabled()
  ) {
    try {
      const connected = await reconnectPrinter()
      if (connected) {
        const escPos = buildEscPosTicket(sale, options)
        await printEscPos(escPos)
        return
      }
    } catch {
      // fallback to browser print
    }
  }

  printViaBrowser(sale, options)
}

export const fetchSaleForPrint = async (saleId: string) => {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id, fecha, estado, subtotal, descuento, impuestos, total, inventory_processed, cliente, cajero_id,
      cajero:users!sales_cajero_id_fkey(id, nombre),
      orders(
        id, mesa_id, mesero_id,
        mesa:tables_restaurant(id, nombre, numero),
        mesero:users(id, nombre),
        order_items(
          id, cantidad, precio_unitario, subtotal,
          product:products(id, nombre, category_id, categories:categories(id, nombre))
        )
      ),
      payments(id, monto, referencia, nota, payment_method:payment_methods(id, nombre))
    `)
    .eq('id', saleId)
    .single()

  if (error) throw error
  return data as unknown as SaleReportItem
}
