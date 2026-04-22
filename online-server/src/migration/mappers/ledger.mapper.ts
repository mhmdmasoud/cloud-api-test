import { mapGenericRow } from './base.mapper.js'

export const mapLedger = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'Account', index)
