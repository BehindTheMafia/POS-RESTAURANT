interface BluetoothDevice extends EventTarget {
  id: string
  name?: string
  gatt?: BluetoothRemoteGATTServer
}

interface BluetoothRemoteGATTServer {
  connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  properties: {
    write: boolean
    writeWithoutResponse: boolean
  }
  writeValue(data: BufferSource): Promise<void>
  writeValueWithoutResponse(data: BufferSource): Promise<void>
}

interface Bluetooth {
  requestDevice(options?: {
    acceptAllDevices?: boolean
    optionalServices?: string[]
  }): Promise<BluetoothDevice>
  getDevices(): Promise<BluetoothDevice[]>
}

interface Navigator {
  bluetooth?: Bluetooth
}
