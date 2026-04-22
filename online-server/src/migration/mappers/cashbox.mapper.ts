import { mapGenericRow } from './base.mapper.js'

export const mapCashbox = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'Treasury', index)
