import { mapGenericRow } from './base.mapper.js'

export const mapPayment = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'InvoicePayment', index)
