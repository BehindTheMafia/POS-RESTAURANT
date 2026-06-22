import type { Tables } from './database.types'

export type TableTipo = 'mesa' | 'mostrador'
export type RestaurantTable = Tables<'tables_restaurant'> & { tipo?: TableTipo }

export const isCounterTable = (table?: RestaurantTable | null): boolean =>
  table?.tipo === 'mostrador' || table?.nombre === 'Mostrador'

export const getCounterTable = (tables: RestaurantTable[]): RestaurantTable | undefined =>
  tables.find(isCounterTable)

export const getPhysicalTables = (tables: RestaurantTable[]): RestaurantTable[] =>
  tables.filter(t => !isCounterTable(t))
