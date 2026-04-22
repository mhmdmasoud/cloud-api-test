import { mapGenericRow } from './base.mapper.js'

export const mapSupplier = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'Supplier', index)
