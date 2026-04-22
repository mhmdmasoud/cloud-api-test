import { mapGenericRow } from './base.mapper.js'

export const mapInstallment = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'InvoiceInstallment', index)
