import { mapGenericRow } from './base.mapper.js'

export const mapItem = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'Item', index)
