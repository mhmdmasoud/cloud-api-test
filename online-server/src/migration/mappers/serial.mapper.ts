import { mapGenericRow } from './base.mapper.js'

export const mapSerial = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'SerialNumber', index)
