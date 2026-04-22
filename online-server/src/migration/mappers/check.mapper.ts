import { mapGenericRow } from './base.mapper.js'

export const mapCheck = (row: Record<string, unknown>, index = 0) => mapGenericRow(row, 'ChecksIncoming', index)
