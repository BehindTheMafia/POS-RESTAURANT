# PRD: Prime Wings POS SaaS

## 1. Problema

Prime Wings es un restaurante de alitas de nueva creación que necesita un sistema integral para controlar ventas, inventario, caja, mesas y rentabilidad.

Actualmente estos procesos se realizan de forma manual mediante papel, Excel o control visual, lo que genera riesgos de pérdidas económicas, errores operativos, diferencias de caja, desperdicio de inventario y falta de información para la toma de decisiones.

El sistema debe minimizar pérdidas mediante auditoría completa, control de permisos, trazabilidad de acciones, control de inventario por recetas y reportes financieros.

---

# 2. Usuarios

## Usuario Principal

### Administrador

Responsable de:

* Configuración del restaurante
* Gestión de usuarios
* Gestión de roles y permisos
* Productos
* Inventario
* Materia prima
* Reportes
* Dashboard financiero
* Caja
* Auditoría
* Configuración de tickets
* Métodos de pago
* Bancos
* Configuración visual del sistema

Situación actual:

* Control manual mediante Excel y revisiones físicas.
* Sin trazabilidad de cambios.
* Sin indicadores financieros automáticos.

---

## Usuarios Secundarios

### Cajero

Responsable de:

* Cobro de pedidos
* Apertura de caja
* Cierre de caja
* Aplicación de descuentos autorizados
* Gestión de pagos

Situación actual:

* Cobros manuales.
* Sin control consolidado por método de pago.
* Sin conciliación automática.

---

### Mesero

Responsable de:

* Gestión de mesas
* Creación de órdenes
* Actualización de pedidos

Situación actual:

* Toma pedidos en papel.
* Comunicación manual con cocina.

---

# 3. Flujo del Usuario Principal

## Flujo Operativo

1. Cliente llega al restaurante.
2. Mesero asigna una mesa.
3. Mesero abre mesa en el sistema.
4. Mesero agrega productos al pedido.
5. Pedido queda registrado.
6. Cliente solicita cuenta.
7. Cajero procesa el pago.
8. Sistema registra la venta.
9. Sistema descuenta inventario automáticamente.
10. Mesa vuelve a estado disponible.
11. Caja y reportes se actualizan automáticamente.

---

# 4. Modelo de Datos

## Restaurante

* Nombre
* Nombre comercial
* Dirección
* Teléfono
* RUC
* Logo
* Moneda principal
* Tipo de cambio
* Configuración visual
* Configuración de tickets

---

## Usuarios

* ID
* Nombre
* Usuario
* Contraseña
* Rol
* Estado
* Fecha creación

---

## Roles

* Nombre
* Descripción
* Permisos

---

## Permisos

Permisos configurables por módulo.

Ejemplos:

* Ver ventas
* Crear ventas
* Anular ventas
* Aplicar descuentos
* Editar inventario
* Registrar gastos
* Configuración
* Reportes
* Auditoría

---

## Mesas

* ID
* Nombre
* Número
* Capacidad
* Estado

Estados:

* Libre
* Ocupada

---

## Categorías

* Wings
* Chunks
* Super Tenders
* Extras
* Bebidas

---

## Productos

* ID
* Nombre
* Categoría
* Precio
* Costo
* Imagen
* Estado
* Stock visible opcional

---

## Bebidas Iniciales

* Coca Cola
* Coca Cola Zero
* Té de Limón
* Rojita

Precio inicial:

* C$50

---

## Pedidos

* Número
* Mesa
* Mesero
* Fecha
* Estado
* Observaciones

Estados:

* Abierto
* Cerrado
* Anulado

---

## Detalle de Pedido

* Producto
* Cantidad
* Precio
* Subtotal
* Observaciones

---

## Ventas

* Número
* Fecha
* Cajero
* Mesa
* Total
* Descuento
* Impuestos
* Estado

---

## Métodos de Pago

Configurables.

Por defecto:

* Efectivo
* Transferencia
* Tarjeta
* Pago Mixto

---

## Bancos

Configurables.

Por defecto:

* BAC
* Lafise
* Banpro
* Ficohsa

---

## Pagos

* Venta
* Método
* Banco
* Referencia
* Nota
* Monto

---

## Caja

### Apertura

* Usuario
* Fecha
* Fondo inicial

### Movimientos

* Tipo
* Concepto
* Monto

### Cierre

* Total efectivo
* Total transferencias
* Total tarjetas
* Diferencias

---

## Gastos

* Concepto
* Categoría
* Monto
* Usuario
* Fecha

---

## Inventario de Materia Prima

Ejemplos:

* Bolsa de alitas
* Aceite
* Papas
* Ranch
* Salsa BBQ
* Salsa Buffalo
* Empaques
* Vasos

Campos:

* Nombre
* Unidad
* Existencia
* Stock mínimo
* Costo

---

## Recetas / Consumo

Configurables por producto.

Ejemplo:

### Wings 6

* 6 alitas
* 100 g papas
* 1 porción ranch

### Wings 10

* 10 alitas
* 100 g papas
* 1 porción ranch

El sistema descuenta automáticamente la materia prima al realizar una venta.

---

## Auditoría

Toda acción debe registrarse.

Campos:

* Usuario
* Fecha
* Hora
* Acción
* Registro afectado
* Valor anterior
* Valor nuevo
* Motivo

---

# 5. Roles y Permisos

## Administrador

Acceso total.

Puede:

* Gestionar usuarios
* Configuración
* Inventario
* Productos
* Caja
* Reportes
* Anulaciones
* Auditoría
* Personalización

---

## Cajero

Puede:

* Cobrar ventas
* Abrir caja
* Cerrar caja
* Aplicar descuentos
* Ver ventas

No puede:

* Modificar precios
* Eliminar historial
* Modificar configuración crítica

---

## Mesero

Puede:

* Abrir mesas
* Crear pedidos
* Modificar pedidos abiertos

No puede:

* Aplicar descuentos
* Cobrar
* Anular ventas
* Modificar precios
* Editar inventario

---

# 6. Panel Administrativo

## Dashboard Diario

Indicadores:

* Ventas del día
* Total órdenes
* Ticket promedio
* Ventas por hora
* Ventas por cajero
* Ventas por método de pago
* Ventas por banco
* Descuentos
* Anulaciones
* Gastos
* Utilidad estimada
* Productos más vendidos
* Inventario bajo

---

## Históricos

Filtro:

* Fecha Inicio
* Fecha Fin

Reportes:

* Ventas
* Inventario
* Caja
* Gastos
* Utilidad
* Auditoría
* Productos vendidos
* Métodos de pago

---

## Reportes PDF y Excel

Exportables:

* Ventas
* Caja
* Inventario
* Gastos
* Auditoría
* Estado de Resultados
* Balance General Simplificado
* Flujo de Caja

---

# 7. MVP (v1.0)

Incluye:

* POS táctil
* Gestión de mesas
* Caja
* Inventario
* Inventario de materia prima
* Recetas configurables
* Roles y permisos
* Auditoría completa
* Dashboard diario
* Reportes históricos
* PDF
* Excel
* Configuración del restaurante
* Métodos de pago
* Bancos
* Control de descuentos
* Control de anulaciones
* Sistema de gastos
* Balance General
* Estado de Resultados
* Flujo de Caja

---

## No Incluye (v2.0)

* Multi-sucursal
* Delivery
* Programa de fidelización
* Reservas
* Facturación electrónica
* App independiente para cocina
* Integraciones externas

---

# 8. Impresión Térmica

Compatibilidad:

* Impresoras Bluetooth
* Web Bluetooth API (Chrome)

Configuración:

* 58 mm
* 80 mm
* Tamaño personalizado

Personalización:

* Logo
* Nombre restaurante
* Dirección
* RUC
* Teléfono
* Redes sociales
* Cajero
* Mesa
* Fecha
* Método de pago
* Banco
* Nota
* Mensaje final

Funciones:

* Vista previa
* Reimpresión
* Selección de impresora
* Impresora predeterminada

---

# 9. UX/UI

## Diseño

* Responsive Desktop
* Responsive Tablet
* Responsive Mobile

---

## Estilo

* Fast Food Moderno
* Profesional
* SaaS
* Limpio
* Alto contraste

---

## POS

* Botones grandes
* Optimizado para pantallas táctiles
* Navegación rápida
* Operación con pocos clics

---

## Animaciones

* Cubic Bezier
* Microinteracciones
* Transiciones suaves
* Feedback visual inmediato

---

# 10. Configuración SaaS

Todo debe ser configurable desde panel administrativo.

Configurables:

* Logo
* Colores
* Tipografías
* Bancos
* Métodos de pago
* Ticket
* Impresoras
* Categorías
* Productos
* Roles
* Permisos
* Impuestos
* Moneda
* Tipo de cambio
* Mensajes del ticket
* Apariencia general

---

# 11. Objetivo Principal

Construir una plataforma SaaS de administración para restaurantes fast-food enfocada en:

* Evitar pérdidas operativas.
* Tener control financiero diario.
* Automatizar inventario.
* Mantener trazabilidad completa.
* Obtener rentabilidad real del negocio.
* Escalar posteriormente a múltiples restaurantes y sucursales.
