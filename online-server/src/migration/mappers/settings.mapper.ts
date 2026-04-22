import { mapGenericRow } from './base.mapper.js'

export const mapSettings = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'settings', index)
