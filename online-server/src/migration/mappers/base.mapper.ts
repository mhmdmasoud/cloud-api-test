export type MigrationMapperResult = {
  sourceTable: string
  legacyId: string
  payload: Record<string, unknown>
  warnings: string[]
}

const toJsonSafe = (value: unknown): unknown => {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(toJsonSafe)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toJsonSafe(item)]))
  }
  return value ?? null
}

export const mapGenericRow = (row: Record<string, unknown>, fallbackTable: string, fallbackIndex = 0): MigrationMapperResult => {
  const sourceTable = String(row.__ysaleSourceTable || row.__sourceTable || fallbackTable)
  const rawLegacyId = row.__ysaleLegacyId || row.id || row.ID || row.Id || row.code || row.number
  const legacyId = String(rawLegacyId || `${sourceTable}:${fallbackIndex}`)
  const payload = toJsonSafe(row) as Record<string, unknown>
  return {
    sourceTable,
    legacyId,
    payload,
    warnings: rawLegacyId ? [] : [`لم يتم العثور على ID واضح في ${sourceTable}، تم استخدام رقم ترتيبي مؤقت.`],
  }
}
