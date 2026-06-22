export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          accion: string
          fecha: string
          id: string
          registro_id: string | null
          restaurant_id: string | null
          tabla: string
          usuario_id: string | null
          valor_anterior: Json | null
          valor_nuevo: Json | null
        }
        Insert: {
          accion: string
          fecha?: string
          id?: string
          registro_id?: string | null
          restaurant_id?: string | null
          tabla: string
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Update: {
          accion?: string
          fecha?: string
          id?: string
          registro_id?: string | null
          restaurant_id?: string | null
          tabla?: string
          usuario_id?: string | null
          valor_anterior?: Json | null
          valor_nuevo?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          restaurant_id: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
          restaurant_id: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "banks_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          cash_register_id: string
          concepto: string
          fecha: string
          id: string
          monto: number
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          cash_register_id: string
          concepto: string
          fecha?: string
          id?: string
          monto: number
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          cash_register_id?: string
          concepto?: string
          fecha?: string
          id?: string
          monto?: number
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "v_cash_flow"
            referencedColumns: ["register_id"]
          },
          {
            foreignKeyName: "cash_movements_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          estado: string
          fecha_apertura: string
          fecha_cierre: string | null
          id: string
          monto_inicial: number
          restaurant_id: string
          usuario_id: string | null
        }
        Insert: {
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_inicial?: number
          restaurant_id: string
          usuario_id?: string | null
        }
        Update: {
          estado?: string
          fecha_apertura?: string
          fecha_cierre?: string | null
          id?: string
          monto_inicial?: number
          restaurant_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_registers_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          estado: boolean
          id: string
          nombre: string
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          estado?: boolean
          id?: string
          nombre: string
          restaurant_id: string
        }
        Update: {
          created_at?: string
          estado?: boolean
          id?: string
          nombre?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          categoria: string
          descripcion: string
          fecha: string
          id: string
          monto: number
          restaurant_id: string
          usuario_id: string | null
        }
        Insert: {
          categoria: string
          descripcion: string
          fecha?: string
          id?: string
          monto: number
          restaurant_id: string
          usuario_id?: string | null
        }
        Update: {
          categoria?: string
          descripcion?: string
          fecha?: string
          id?: string
          monto?: number
          restaurant_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          activo: boolean
          costo_unitario: number
          created_at: string
          id: string
          nombre: string
          restaurant_id: string
          stock_actual: number
          stock_minimo: number
          unidad: string
        }
        Insert: {
          activo?: boolean
          costo_unitario?: number
          created_at?: string
          id?: string
          nombre: string
          restaurant_id: string
          stock_actual?: number
          stock_minimo?: number
          unidad: string
        }
        Update: {
          activo?: boolean
          costo_unitario?: number
          created_at?: string
          id?: string
          nombre?: string
          restaurant_id?: string
          stock_actual?: number
          stock_minimo?: number
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          inventory_item_id: string
          observacion: string | null
          product_id: string | null
          restaurant_id: string
          sale_id: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          inventory_item_id: string
          observacion?: string | null
          product_id?: string | null
          restaurant_id: string
          sale_id?: string | null
          stock_anterior: number
          stock_nuevo: number
          tipo: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          inventory_item_id?: string
          observacion?: string | null
          product_id?: string | null
          restaurant_id?: string
          sale_id?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_low"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      kv_store_a8544844: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cantidad: number
          id: string
          notas: string | null
          order_id: string
          precio_unitario: number
          product_id: string | null
          subtotal: number
        }
        Insert: {
          cantidad: number
          id?: string
          notas?: string | null
          order_id: string
          precio_unitario: number
          product_id?: string | null
          subtotal: number
        }
        Update: {
          cantidad?: number
          id?: string
          notas?: string | null
          order_id?: string
          precio_unitario?: number
          product_id?: string | null
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_top_products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          estado: string
          id: string
          mesa_id: string | null
          mesero_id: string | null
          observaciones: string | null
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          mesa_id?: string | null
          mesero_id?: string | null
          observaciones?: string | null
          restaurant_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          mesa_id?: string | null
          mesero_id?: string | null
          observaciones?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "tables_restaurant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_mesero_id_fkey"
            columns: ["mesero_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          activo: boolean
          id: string
          nombre: string
          restaurant_id: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
          restaurant_id: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          bank_id: string | null
          id: string
          monto: number
          nota: string | null
          payment_method_id: string | null
          referencia: string | null
          sale_id: string
        }
        Insert: {
          bank_id?: string | null
          id?: string
          monto: number
          nota?: string | null
          payment_method_id?: string | null
          referencia?: string | null
          sale_id: string
        }
        Update: {
          bank_id?: string | null
          id?: string
          monto?: number
          nota?: string | null
          payment_method_id?: string | null
          referencia?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          codigo: string
          descripcion: string | null
          id: string
        }
        Insert: {
          codigo: string
          descripcion?: string | null
          id?: string
        }
        Update: {
          codigo?: string
          descripcion?: string | null
          id?: string
        }
        Relationships: []
      }
      product_sauces: {
        Row: {
          id: string
          product_id: string
          sauce_id: string
        }
        Insert: {
          id?: string
          product_id: string
          sauce_id: string
        }
        Update: {
          id?: string
          product_id?: string
          sauce_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sauces_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sauces_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_top_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_sauces_sauce_id_fkey"
            columns: ["sauce_id"]
            isOneToOne: false
            referencedRelation: "sauces"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          activo: boolean
          category_id: string | null
          costo: number
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          precio: number
          restaurant_id: string
          stock: number | null
        }
        Insert: {
          activo?: boolean
          category_id?: string | null
          costo?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          precio: number
          restaurant_id: string
          stock?: number | null
        }
        Update: {
          activo?: boolean
          category_id?: string | null
          costo?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio?: number
          restaurant_id?: string
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cantidad_consumida: number
          id: string
          inventory_item_id: string
          product_id: string
        }
        Insert: {
          cantidad_consumida: number
          id?: string
          inventory_item_id: string
          product_id: string
        }
        Update: {
          cantidad_consumida?: number
          id?: string
          inventory_item_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "v_inventory_low"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "v_top_products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      restaurants: {
        Row: {
          created_at: string
          direccion: string | null
          id: string
          logo_url: string | null
          moneda: string
          nombre: string
          nombre_comercial: string | null
          ruc: string | null
          telefono: string | null
          tipo_cambio: number
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          id?: string
          logo_url?: string | null
          moneda?: string
          nombre: string
          nombre_comercial?: string | null
          ruc?: string | null
          telefono?: string | null
          tipo_cambio?: number
        }
        Update: {
          created_at?: string
          direccion?: string | null
          id?: string
          logo_url?: string | null
          moneda?: string
          nombre?: string
          nombre_comercial?: string | null
          ruc?: string | null
          telefono?: string | null
          tipo_cambio?: number
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: string
          nombre: string
        }
        Insert: {
          id?: string
          nombre: string
        }
        Update: {
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          cajero_id: string | null
          cliente: string | null
          descuento: number
          estado: string
          fecha: string
          id: string
          impuestos: number
          inventory_processed: boolean
          order_id: string
          restaurant_id: string
          subtotal: number
          total: number
        }
        Insert: {
          cajero_id?: string | null
          cliente?: string | null
          descuento?: number
          estado?: string
          fecha?: string
          id?: string
          impuestos?: number
          inventory_processed?: boolean
          order_id: string
          restaurant_id: string
          subtotal: number
          total: number
        }
        Update: {
          cajero_id?: string | null
          cliente?: string | null
          descuento?: number
          estado?: string
          fecha?: string
          id?: string
          impuestos?: number
          inventory_processed?: boolean
          order_id?: string
          restaurant_id?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_cajero_id_fkey"
            columns: ["cajero_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      sauces: {
        Row: {
          activa: boolean
          created_at: string
          id: string
          nombre: string
          restaurant_id: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre: string
          restaurant_id: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sauces_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          color_primario: string
          configuracion_general: Json | null
          id: string
          iva_porcentaje: number
          restaurant_id: string
          ticket_mensaje: string
          ticket_mostrar_logo: boolean
          ticket_redes: Json | null
          ticket_tamano: string
          updated_at: string
        }
        Insert: {
          color_primario?: string
          configuracion_general?: Json | null
          id?: string
          iva_porcentaje?: number
          restaurant_id: string
          ticket_mensaje?: string
          ticket_mostrar_logo?: boolean
          ticket_redes?: Json | null
          ticket_tamano?: string
          updated_at?: string
        }
        Update: {
          color_primario?: string
          configuracion_general?: Json | null
          id?: string
          iva_porcentaje?: number
          restaurant_id?: string
          ticket_mensaje?: string
          ticket_mostrar_logo?: boolean
          ticket_redes?: Json | null
          ticket_tamano?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      tables_restaurant: {
        Row: {
          capacidad: number
          created_at: string
          estado: string
          id: string
          nombre: string
          numero: number
          restaurant_id: string
          tipo: string
        }
        Insert: {
          capacidad?: number
          created_at?: string
          estado?: string
          id?: string
          nombre: string
          numero: number
          restaurant_id: string
          tipo?: string
        }
        Update: {
          capacidad?: number
          created_at?: string
          estado?: string
          id?: string
          nombre?: string
          numero?: number
          restaurant_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activo: boolean
          correo: string
          created_at: string
          id: string
          nombre: string
          restaurant_id: string
          role_id: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          correo: string
          created_at?: string
          id: string
          nombre: string
          restaurant_id: string
          role_id?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          correo?: string
          created_at?: string
          id?: string
          nombre?: string
          restaurant_id?: string
          role_id?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_cash_flow: {
        Row: {
          estado: string | null
          fecha_apertura: string | null
          fecha_cierre: string | null
          monto_inicial: number | null
          register_id: string | null
          restaurant_id: string | null
          saldo_actual: number | null
          total_egresos: number | null
          total_ingresos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_daily_sales: {
        Row: {
          dia: string | null
          estado: string | null
          num_ventas: number | null
          restaurant_id: string | null
          total_descuentos: number | null
          total_impuestos: number | null
          total_subtotal: number | null
          total_ventas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_inventory_low: {
        Row: {
          costo_reposicion: number | null
          costo_unitario: number | null
          diferencia: number | null
          id: string | null
          nombre: string | null
          restaurant_id: string | null
          stock_actual: number | null
          stock_minimo: number | null
          unidad: string | null
        }
        Insert: {
          costo_reposicion?: never
          costo_unitario?: number | null
          diferencia?: never
          id?: string | null
          nombre?: string | null
          restaurant_id?: string | null
          stock_actual?: number | null
          stock_minimo?: number | null
          unidad?: string | null
        }
        Update: {
          costo_reposicion?: never
          costo_unitario?: number | null
          diferencia?: never
          id?: string | null
          nombre?: string | null
          restaurant_id?: string | null
          stock_actual?: number | null
          stock_minimo?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sales_by_cashier: {
        Row: {
          cajero_id: string | null
          cajero_nombre: string | null
          dia: string | null
          num_ventas: number | null
          restaurant_id: string | null
          total_ventas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_cajero_id_fkey"
            columns: ["cajero_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sales_by_payment: {
        Row: {
          banco: string | null
          dia: string | null
          metodo_pago: string | null
          num_pagos: number | null
          restaurant_id: string | null
          total_monto: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_top_products: {
        Row: {
          cantidad_vendida: number | null
          categoria: string | null
          dia: string | null
          product_id: string | null
          producto: string | null
          restaurant_id: string | null
          total_costo: number | null
          total_ventas: number | null
          utilidad: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cancel_sale: {
        Args: { p_motivo: string; p_sale_id: string; p_usuario_id: string }
        Returns: Json
      }
      delete_sale: {
        Args: { p_sale_id: string; p_usuario_id: string }
        Returns: Json
      }
      close_cash_register: {
        Args: { p_register_id: string; p_usuario_id: string }
        Returns: Json
      }
      complete_sale: {
        Args: {
          p_cajero_id: string
          p_descuento?: number
          p_iva_porcentaje?: number
          p_order_id: string
          p_payments?: Json
        }
        Returns: Json
      }
      get_dashboard_stats: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_restaurant_id: string
        }
        Returns: Json
      }
      get_my_restaurant_id: { Args: never; Returns: string }
      get_my_role_name: { Args: never; Returns: string }
      get_top_products: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_restaurant_id: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_cashier: { Args: never; Returns: boolean }
      open_cash_register: {
        Args: {
          p_monto_inicial: number
          p_restaurant_id: string
          p_usuario_id: string
        }
        Returns: string
      }
      process_sale_inventory: {
        Args: { p_sale_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
