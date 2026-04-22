import { mapGenericRow } from './base.mapper.js'

export const mapStock = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'StockMove', index)
