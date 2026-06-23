import type { SaleReportItem } from '../hooks/useSalesReports'

const PRINTER_DEVICE_KEY = 'pos_bluetooth_printer_id'
const PRINTER_NAME_KEY = 'pos_bluetooth_printer_name'
const BLUETOOTH_ENABLED_KEY = 'pos_bluetooth_enabled'

const ESC = 0x1b
const GS = 0x1d

const COMMON_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ee4-8fa7-748edf6b5689',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
]

const COMMON_WRITE_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
]

type BluetoothRemote = {
  device: BluetoothDevice
  characteristic: BluetoothRemoteGATTCharacteristic
}

let cachedRemote: BluetoothRemote | null = null

export const isBluetoothSupported = (): boolean =>
  typeof navigator !== 'undefined' && 'bluetooth' in navigator

export const isBluetoothEnabled = (): boolean =>
  localStorage.getItem(BLUETOOTH_ENABLED_KEY) === 'true'

export const setBluetoothEnabled = (enabled: boolean): void => {
  localStorage.setItem(BLUETOOTH_ENABLED_KEY, String(enabled))
}

export const getSavedPrinterName = (): string | null =>
  localStorage.getItem(PRINTER_NAME_KEY)

export const disconnectPrinter = (): void => {
  if (cachedRemote?.device.gatt?.connected) {
    cachedRemote.device.gatt.disconnect()
  }
  cachedRemote = null
}

const findWritableCharacteristic = async (server: BluetoothRemoteGATTServer) => {
  for (const serviceUuid of COMMON_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(serviceUuid)
      for (const charUuid of COMMON_WRITE_CHAR_UUIDS) {
        try {
          const characteristic = await service.getCharacteristic(charUuid)
          if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
            return characteristic
          }
        } catch {
          continue
        }
      }
    } catch {
      continue
    }
  }

  const services = await server.getPrimaryServices()
  for (const service of services) {
    const characteristics = await service.getCharacteristics()
    const writable = characteristics.find(
      c => c.properties.write || c.properties.writeWithoutResponse
    )
    if (writable) return writable
  }

  throw new Error('No se encontró característica de escritura en la impresora')
}

export const connectPrinter = async (): Promise<BluetoothDevice> => {
  if (!isBluetoothSupported()) {
    throw new Error('Web Bluetooth no está disponible. Use Chrome o Edge con HTTPS.')
  }

  const device = await navigator.bluetooth!.requestDevice({
    acceptAllDevices: true,
    optionalServices: COMMON_SERVICE_UUIDS,
  })

  if (!device.gatt) throw new Error('El dispositivo no soporta GATT')

  const server = await device.gatt.connect()
  const characteristic = await findWritableCharacteristic(server)

  cachedRemote = { device, characteristic }
  localStorage.setItem(PRINTER_DEVICE_KEY, device.id)
  localStorage.setItem(PRINTER_NAME_KEY, device.name ?? 'Impresora')

  device.addEventListener('gattserverdisconnected', () => {
    cachedRemote = null
  })

  return device
}

export const reconnectPrinter = async (): Promise<boolean> => {
  if (!isBluetoothSupported()) return false
  const savedId = localStorage.getItem(PRINTER_DEVICE_KEY)
  if (!savedId) return false

  try {
    const devices = await navigator.bluetooth!.getDevices()
    const device = devices.find(d => d.id === savedId)
    if (!device?.gatt) return false

    const server = await device.gatt.connect()
    const characteristic = await findWritableCharacteristic(server)
    cachedRemote = { device, characteristic }
    return true
  } catch {
    return false
  }
}

export const isPrinterConnected = (): boolean =>
  !!cachedRemote?.device.gatt?.connected

const encodeText = (text: string): Uint8Array => {
  const encoder = new TextEncoder()
  return encoder.encode(text)
}

const concatBytes = (...chunks: Uint8Array[]): Uint8Array => {
  const total = chunks.reduce((sum, c) => sum + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}

export type EscPosTicketOptions = {
  restaurantName?: string | null
  commercialName?: string | null
  currency?: string
  ticketMessage?: string
  ticketSize?: '58mm' | '80mm'
  title?: string
}

export const buildEscPosTicket = (
  sale: SaleReportItem,
  options: EscPosTicketOptions = {}
): Uint8Array => {
  const currency = options.currency ?? 'C$'
  const msg = options.ticketMessage ?? '¡Gracias por visitarnos!'
  const title = options.title ?? 'Ticket'
  const width = options.ticketSize === '58mm' ? 32 : 48
  const line = '-'.repeat(width)
  const mesaName = sale.orders?.mesa?.nombre === 'Mostrador'
    ? 'Mostrador'
    : (sale.orders?.mesa?.nombre || 'N/A')

  const lines: string[] = [
    options.restaurantName || 'PRIMEWINGS POS',
    options.commercialName || '',
    line,
    `${title}: #${sale.orders?.id?.slice(0, 8) || sale.id.slice(0, 8)}`,
    `Fecha: ${new Date(sale.fecha).toLocaleString('es-NI')}`,
    `Mesa: ${mesaName}`,
    `Cajero: ${sale.cajero?.nombre || 'Sistema'}`,
    `Cliente: ${sale.cliente || 'Consumidor Final'}`,
    line,
  ]

  for (const item of sale.orders?.order_items ?? []) {
    const name = item.product?.nombre ?? 'Producto'
    const total = (item.precio_unitario * item.cantidad).toFixed(2)
    lines.push(`${name} x${item.cantidad}`)
    lines.push(`${' '.repeat(Math.max(1, width - total.length - currency.length - 1))}${currency} ${total}`)
  }

  lines.push(
    line,
    `Subtotal: ${currency} ${Number(sale.subtotal).toFixed(2)}`,
  )

  if (sale.descuento > 0) {
    lines.push(`Descuento: -${currency} ${Number(sale.descuento).toFixed(2)}`)
  }

  lines.push(
    `Impuestos: ${currency} ${Number(sale.impuestos).toFixed(2)}`,
    `TOTAL: ${currency} ${Number(sale.total).toFixed(2)}`,
    line,
    'Metodos de pago:',
  )

  for (const p of sale.payments) {
    const note = p.nota ? ` (${p.nota})` : ''
    const ref = p.referencia ? ` Ref:${p.referencia}` : ''
    lines.push(
      `${p.payment_method?.nombre ?? 'Pago'}: ${currency} ${Number(p.monto).toFixed(2)}${note}${ref}`
    )
  }

  lines.push(line, msg, '\n\n\n')

  const text = lines.filter(Boolean).join('\n')
  const init = new Uint8Array([ESC, 0x40])
  const cut = new Uint8Array([GS, 0x56, 0x00])
  return concatBytes(init, encodeText(text), cut)
}

const writeInChunks = async (
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array,
  chunkSize = 100
) => {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk)
    } else {
      await characteristic.writeValue(chunk)
    }
    await new Promise(r => setTimeout(r, 20))
  }
}

export const printEscPos = async (data: Uint8Array): Promise<void> => {
  if (!cachedRemote?.device.gatt?.connected) {
    const reconnected = await reconnectPrinter()
    if (!reconnected) throw new Error('Impresora no conectada. Empareje en Configuración.')
  }

  if (!cachedRemote) throw new Error('Sin impresora emparejada')

  await writeInChunks(cachedRemote.characteristic, data)
}

export const printTestPage = async (): Promise<void> => {
  const test = buildEscPosTicket({
    id: 'test',
    fecha: new Date().toISOString(),
    estado: 'completada',
    subtotal: 10,
    descuento: 0,
    impuestos: 1.5,
    total: 11.5,
    inventory_processed: true,
    cliente: 'Prueba',
    cajero_id: null,
    cajero: { id: '1', nombre: 'Sistema' },
    orders: {
      id: 'test-order',
      mesa_id: null,
      mesero_id: null,
      mesa: { id: '1', nombre: 'Mostrador', numero: 0 },
      mesero: null,
      order_items: [{
        id: '1',
        cantidad: 1,
        precio_unitario: 10,
        subtotal: 10,
        product: { id: '1', nombre: 'Producto de prueba', category_id: null, categories: null },
      }],
    },
    payments: [{ id: '1', monto: 11.5, referencia: null, nota: null, payment_method: { id: '1', nombre: 'Efectivo' } }],
  } as SaleReportItem, { title: 'Prueba', restaurantName: 'PRIMEWINGS POS' })

  await printEscPos(test)
}
