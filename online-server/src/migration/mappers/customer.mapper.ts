import { mapGenericRow } from './base.mapper.js'

export const mapCustomer = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'Customer', index)
