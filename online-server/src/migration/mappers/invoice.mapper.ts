import { mapGenericRow } from './base.mapper.js'

export const mapInvoice = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'Invoice', index)
