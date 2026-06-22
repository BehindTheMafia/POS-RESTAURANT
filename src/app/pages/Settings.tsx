import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings as SettingsIcon, Save, Upload, Eye, EyeOff,
  Building2, Palette, Printer, CreditCard, Building, Key, RefreshCw
} from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useSales } from '../../hooks/useSales';
import { useAuthContext } from '../AuthContext';
import {
  connectPrinter,
  disconnectPrinter,
  getSavedPrinterName,
  isBluetoothEnabled,
  isBluetoothSupported,
  isPrinterConnected,
  printTestPage,
  reconnectPrinter,
  setBluetoothEnabled,
} from '../../lib/bluetoothPrinter'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/button'
import { toast } from 'sonner'
import {
  ACCENT_PRESETS,
  applyAppearanceToDocument,
  parseAppearanceConfig,
  type AccentPreset,
  type ThemeMode,
} from '../../lib/appearance'

type Tab = 'general' | 'apariencia' | 'ticket' | 'pagos' | 'cuenta';

export function Settings() {
  const { restaurant, loading, updateRestaurant, updateSettings, uploadLogo, refetch } = useRestaurant();
  const { paymentMethods, banks, createPaymentMethod, togglePaymentMethod, createBank, toggleBank } = useSales();
  const { user, updatePassword, updateEmail } = useAuthContext();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [saving, setSaving] = useState(false);

  // General form
  const [nombre, setNombre] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ruc, setRuc] = useState('');
  const [moneda, setMoneda] = useState('C$');
  const [tipoCambio, setTipoCambio] = useState(36.5);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Apariencia
  const [colorPrimario, setColorPrimario] = useState('#166534')
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const [accentPreset, setAccentPreset] = useState<AccentPreset>('green')

  // Ticket
  const [ivaPercent, setIvaPercent] = useState(15);
  const [ticketMensaje, setTicketMensaje] = useState('¡Gracias por visitarnos!');
  const [ticketTamano, setTicketTamano] = useState<'58mm' | '80mm'>('80mm');
  const [ticketLogo, setTicketLogo] = useState(true)
  const [bluetoothOn, setBluetoothOn] = useState(isBluetoothEnabled())
  const [printerName, setPrinterName] = useState<string | null>(getSavedPrinterName())
  const [printerConnected, setPrinterConnected] = useState(isPrinterConnected())
  const [pairing, setPairing] = useState(false)

  // Pagos
  const [newPM, setNewPM] = useState('');
  const [newBank, setNewBank] = useState('');

  // Cuenta
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (bluetoothOn) {
      reconnectPrinter().then(ok => setPrinterConnected(ok))
    }
  }, [bluetoothOn])

  async function handlePairPrinter() {
    setPairing(true)
    try {
      const device = await connectPrinter()
      setPrinterName(device.name ?? 'Impresora')
      setPrinterConnected(true)
      toast.success('Impresora emparejada')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPairing(false)
    }
  }

  async function handleTestPrint() {
    try {
      await printTestPage()
      toast.success('Ticket de prueba enviado')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  function handleToggleBluetooth(enabled: boolean) {
    setBluetoothOn(enabled)
    setBluetoothEnabled(enabled)
    if (!enabled) {
      disconnectPrinter()
      setPrinterConnected(false)
    }
  }

  useEffect(() => {
    if (!restaurant) return
    setNombre(restaurant.nombre ?? '')
    setNombreComercial(restaurant.nombre_comercial ?? '')
    setDireccion(restaurant.direccion ?? '')
    setTelefono(restaurant.telefono ?? '')
    setRuc(restaurant.ruc ?? '')
    setMoneda(restaurant.moneda ?? 'C$')
    setTipoCambio(restaurant.tipo_cambio ?? 36.5)
    const appearance = parseAppearanceConfig(
      restaurant.settings?.configuracion_general,
      restaurant.settings?.color_primario
    )
    setColorPrimario(appearance.customPrimary ?? restaurant.settings?.color_primario ?? '#166534')
    setThemeMode(appearance.themeMode)
    setAccentPreset(appearance.accentPreset)
    if (restaurant.settings) {
      setIvaPercent(restaurant.settings.iva_porcentaje)
      setTicketMensaje(restaurant.settings.ticket_mensaje)
      setTicketTamano(restaurant.settings.ticket_tamano as '58mm' | '80mm')
      setTicketLogo(restaurant.settings.ticket_mostrar_logo)
    }
  }, [restaurant])

  useEffect(() => {
    if (activeTab !== 'apariencia') return
    applyAppearanceToDocument({
      themeMode,
      accentPreset,
      customPrimary: colorPrimario,
    })
  }, [activeTab, themeMode, accentPreset, colorPrimario])

  async function saveGeneral() {
    setSaving(true);
    try {
      if (logoFile) await uploadLogo(logoFile);
      await updateRestaurant({
        nombre, nombre_comercial: nombreComercial, direccion, telefono, ruc, moneda, tipo_cambio: tipoCambio,
      });
      toast.success('Configuración general guardada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveApariencia() {
    setSaving(true);
    try {
      const configuracion_general = {
        themeMode,
        accentPreset,
        customPrimary: colorPrimario,
      }
      await updateSettings({
        color_primario: colorPrimario,
        configuracion_general,
      });
      applyAppearanceToDocument(parseAppearanceConfig(configuracion_general, colorPrimario))
      toast.success('Apariencia guardada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveTicket() {
    setSaving(true);
    try {
      await updateSettings({
        iva_porcentaje: ivaPercent,
        ticket_mensaje: ticketMensaje,
        ticket_tamano: ticketTamano,
        ticket_mostrar_logo: ticketLogo,
      });
      toast.success('Configuración de ticket guardada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
    if (newPassword.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return; }
    setSaving(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEmail() {
    if (!newEmail) return;
    setSaving(true);
    try {
      await updateEmail(newEmail);
      toast.success('Correo actualizado. Revisa tu bandeja para confirmar.');
      setNewEmail('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general',    label: 'General',    icon: <Building2 size={15} /> },
    { id: 'apariencia', label: 'Apariencia', icon: <Palette size={15} /> },
    { id: 'ticket',     label: 'Ticket/IVA', icon: <Printer size={15} /> },
    { id: 'pagos',      label: 'Pagos',      icon: <CreditCard size={15} /> },
    { id: 'cuenta',     label: 'Mi Cuenta',  icon: <Key size={15} /> },
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Configuración"
        subtitle="Gestiona tu restaurante"
        actions={
          <Button variant="outline" size="iconTouch" onClick={refetch} aria-label="Actualizar">
            <RefreshCw size={16} />
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto w-full sm:w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer min-h-11 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
      >
        {/* GENERAL */}
        {activeTab === 'general' && (
          <>
            <h3 className="font-semibold text-gray-800">Información del Restaurante</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Nombre legal', value: nombre, setter: setNombre, type: 'text' },
                { label: 'Nombre comercial', value: nombreComercial, setter: setNombreComercial, type: 'text' },
                { label: 'Teléfono', value: telefono, setter: setTelefono, type: 'tel' },
                { label: 'RUC', value: ruc, setter: setRuc, type: 'text' },
                { label: 'Moneda (símbolo)', value: moneda, setter: setMoneda, type: 'text' },
                { label: 'Tipo de cambio', value: String(tipoCambio), setter: (v: string) => setTipoCambio(parseFloat(v) || 1), type: 'number' },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-sm text-gray-600 block mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </div>
              ))}
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600 block mb-1">Dirección</label>
              <input
                type="text" value={direccion}
                onChange={e => setDireccion(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-2">Logo del restaurante</label>
              <div className="flex items-center gap-4">
                {restaurant?.logo_url && (
                  <img src={restaurant.logo_url} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-gray-200" />
                )}
                <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-brand hover:text-brand cursor-pointer transition-colors">
                  <Upload size={14} />
                  {logoFile ? logoFile.name : 'Subir logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
            <button onClick={saveGeneral} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-brand-foreground font-medium disabled:opacity-60 cursor-pointer">
              <Save size={15} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </>
        )}

        {/* APARIENCIA */}
        {activeTab === 'apariencia' && (
          <>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Apariencia</h3>

            {/* Theme mode */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Tema</label>
              <div className="grid grid-cols-2 gap-3">
                {(['light', 'dark'] as ThemeMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setThemeMode(mode)}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      themeMode === mode
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-8 rounded-lg mb-2 ${mode === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-900'}`} />
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {mode === 'light' ? 'Claro' : 'Oscuro'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Variante de color</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(ACCENT_PRESETS) as AccentPreset[]).map(key => {
                  const preset = ACCENT_PRESETS[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setAccentPreset(key)
                        setColorPrimario(preset.base)
                      }}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        accentPreset === key
                          ? 'border-brand ring-2 ring-brand/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        <span className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ background: preset.base }} />
                        <span className="w-6 h-6 rounded-full border border-white shadow-sm bg-brand-muted" />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{preset.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom color */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Color personalizado</label>
              <div className="flex items-center gap-3">
                <input type="color" value={colorPrimario}
                  onChange={e => { setColorPrimario(e.target.value); setAccentPreset('green') }}
                  className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1"
                />
                <input type="text" value={colorPrimario}
                  onChange={e => setColorPrimario(e.target.value)}
                  className="w-32 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand font-mono dark:bg-gray-800 dark:border-gray-700"
                />
                <div className="w-12 h-12 rounded-xl border border-gray-200 shadow-sm" style={{ background: colorPrimario }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">El color se aplica inmediatamente en vista previa al cambiar preset</p>
            </div>

            <button onClick={saveApariencia} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-brand-foreground font-medium disabled:opacity-60 cursor-pointer">
              <Save size={15} /> {saving ? 'Guardando...' : 'Guardar Apariencia'}
            </button>
          </>
        )}

        {/* TICKET / IVA */}
        {activeTab === 'ticket' && (
          <>
            <h3 className="font-semibold text-gray-800">Configuración de Ticket e IVA</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">IVA (%)</label>
                <input type="number" min="0" max="30" step="0.5"
                  value={ivaPercent}
                  onChange={e => setIvaPercent(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <p className="text-xs text-gray-400 mt-1">Se aplica automáticamente en cada venta</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Tamaño de ticket</label>
                <select value={ticketTamano} onChange={e => setTicketTamano(e.target.value as '58mm' | '80mm')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white">
                  <option value="58mm">58 mm</option>
                  <option value="80mm">80 mm</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-600 block mb-1">Mensaje final del ticket</label>
                <input type="text" value={ticketMensaje}
                  onChange={e => setTicketMensaje(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                  placeholder="¡Gracias por visitarnos!"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTicketLogo(!ticketLogo)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${ticketLogo ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${ticketLogo ? 'left-5' : 'left-0.5'}`} />
                </button>
                <label className="text-sm text-gray-600">Mostrar logo en ticket</label>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Printer size={16} /> Impresora Bluetooth
              </h4>
              {!isBluetoothSupported() && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  Web Bluetooth requiere Chrome o Edge con HTTPS. Se usará impresión del navegador como respaldo.
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleBluetooth(!bluetoothOn)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${bluetoothOn ? 'bg-brand' : 'bg-gray-200'}`}
                  aria-label="Activar impresora Bluetooth"
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${bluetoothOn ? 'left-5' : 'left-0.5'}`} />
                </button>
                <label className="text-sm text-gray-600">Usar impresora Bluetooth (ESC/POS)</label>
              </div>
              {bluetoothOn && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                    <p className="font-medium text-gray-800">
                      {printerConnected ? 'Conectado' : 'Desconectado'}
                    </p>
                    <p className="text-xs mt-1">{printerName ?? 'Sin impresora emparejada'}</p>
                  </div>
                  <Button variant="outline" size="touchSm" onClick={handlePairPrinter} disabled={pairing || !isBluetoothSupported()}>
                    {pairing ? 'Emparejando...' : 'Emparejar impresora'}
                  </Button>
                  <Button variant="default" size="touchSm" onClick={handleTestPrint} disabled={!printerConnected}>
                    Imprimir prueba
                  </Button>
                </div>
              )}
            </div>
            <Button variant="default" onClick={saveTicket} disabled={saving}>
              <Save size={15} /> {saving ? 'Guardando...' : 'Guardar Ticket/IVA'}
            </Button>
          </>
        )}

        {/* PAGOS */}
        {activeTab === 'pagos' && (
          <>
            <h3 className="font-semibold text-gray-800">Métodos de Pago y Bancos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Métodos de pago */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Métodos de Pago</p>
                <div className="space-y-2 mb-3">
                  {paymentMethods.map(pm => (
                    <div key={pm.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700">{pm.nombre}</span>
                      <button
                        onClick={() => togglePaymentMethod(pm.id, !pm.activo)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${pm.activo ? 'bg-brand' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${pm.activo ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newPM} onChange={e => setNewPM(e.target.value)}
                    placeholder="Nuevo método..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <button onClick={() => { if (newPM) { createPaymentMethod(newPM); setNewPM(''); } }}
                    className="px-3 py-2 rounded-xl bg-brand text-brand-foreground text-sm cursor-pointer">
                    Agregar
                  </button>
                </div>
              </div>

              {/* Bancos */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Bancos</p>
                <div className="space-y-2 mb-3">
                  {banks.map(b => (
                    <div key={b.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-700">{b.nombre}</span>
                      <button
                        onClick={() => toggleBank(b.id, !b.activo)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${b.activo ? 'bg-brand' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${b.activo ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newBank} onChange={e => setNewBank(e.target.value)}
                    placeholder="Nuevo banco..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <button onClick={() => { if (newBank) { createBank(newBank); setNewBank(''); } }}
                    className="px-3 py-2 rounded-xl bg-brand text-brand-foreground text-sm cursor-pointer">
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* MI CUENTA */}
        {activeTab === 'cuenta' && (
          <>
            <h3 className="font-semibold text-gray-800">Mi Cuenta</h3>
            <div className="bg-gray-50 rounded-xl p-4 mb-2">
              <p className="text-sm text-gray-500">Cuenta actual</p>
              <p className="font-medium text-gray-900">{user?.profile?.nombre}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-brand-muted text-brand rounded-full capitalize">
                {user?.roleName}
              </span>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-5">
              <p className="text-sm font-medium text-gray-700">Cambiar correo electrónico</p>
              <div className="flex gap-2">
                <input type="email" value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="nuevo@correo.com"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <button onClick={handleChangeEmail} disabled={saving || !newEmail}
                  className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-sm disabled:opacity-50 cursor-pointer">
                  Cambiar
                </button>
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-5">
              <p className="text-sm font-medium text-gray-700">Cambiar contraseña</p>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button onClick={handleChangePassword}
                disabled={saving || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-brand-foreground font-medium disabled:opacity-60 cursor-pointer">
                <Key size={15} /> {saving ? 'Guardando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
