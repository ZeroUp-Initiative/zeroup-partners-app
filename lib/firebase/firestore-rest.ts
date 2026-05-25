const BASE = () => {
  const id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!
  return `https://firestore.googleapis.com/v1/projects/${id}/databases/(default)/documents`
}

function encodeValue(val: unknown): unknown {
  if (val === null || val === undefined) return { nullValue: null }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (typeof val === 'number')
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val }
  if (typeof val === 'string') return { stringValue: val }
  if (Array.isArray(val)) return { arrayValue: { values: val.map(encodeValue) } }
  if (typeof val === 'object')
    return { mapValue: { fields: encodeFields(val as Record<string, unknown>) } }
  return { stringValue: String(val) }
}

function encodeFields(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, encodeValue(v)]))
}

function decodeValue(val: Record<string, unknown>): unknown {
  if ('stringValue' in val) return val.stringValue
  if ('booleanValue' in val) return val.booleanValue
  if ('integerValue' in val) return Number(val.integerValue)
  if ('doubleValue' in val) return val.doubleValue
  if ('nullValue' in val) return null
  if ('mapValue' in val) return decodeFields((val.mapValue as any).fields ?? {})
  if ('arrayValue' in val) return ((val.arrayValue as any).values ?? []).map(decodeValue)
  return null
}

function decodeFields(fields: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, decodeValue(v as Record<string, unknown>)])
  )
}

function docId(name: string) {
  return name.split('/').pop()!
}

export async function fsGet(
  col: string,
  id: string,
  token: string
): Promise<{ id: string; data: Record<string, unknown> } | null> {
  const res = await fetch(`${BASE()}/${col}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const doc = await res.json()
  return { id: docId(doc.name), data: decodeFields(doc.fields ?? {}) }
}

export async function fsAdd(
  col: string,
  data: Record<string, unknown>,
  token: string
): Promise<string> {
  const res = await fetch(`${BASE()}/${col}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: encodeFields(data) }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Firestore add failed (${res.status}): ${body}`)
  }
  return docId((await res.json()).name)
}

export async function fsPatch(
  col: string,
  id: string,
  data: Record<string, unknown>,
  token: string
): Promise<void> {
  const mask = Object.keys(data)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&')
  const res = await fetch(`${BASE()}/${col}/${id}?${mask}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: encodeFields(data) }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Firestore patch failed (${res.status}): ${body}`)
  }
}

export async function fsSet(
  col: string,
  id: string,
  data: Record<string, unknown>,
  token: string
): Promise<void> {
  const res = await fetch(`${BASE()}/${col}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: encodeFields(data) }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Firestore set failed (${res.status}): ${body}`)
  }
}

export async function fsDelete(col: string, id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE()}/${col}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Firestore delete failed (${res.status}): ${body}`)
  }
}

export async function fsQuery(
  col: string,
  token: string,
  options?: {
    orderBy?: { field: string; dir?: 'ASCENDING' | 'DESCENDING' }
    where?: { field: string; op: string; value: unknown }
  }
): Promise<{ id: string; data: Record<string, unknown> }[]> {
  const structuredQuery: Record<string, unknown> = {
    from: [{ collectionId: col }],
  }
  if (options?.orderBy) {
    structuredQuery.orderBy = [
      {
        field: { fieldPath: options.orderBy.field },
        direction: options.orderBy.dir ?? 'ASCENDING',
      },
    ]
  }
  if (options?.where) {
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: options.where.field },
        op: options.where.op,
        value: encodeValue(options.where.value),
      },
    }
  }
  const res = await fetch(`${BASE()}:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ structuredQuery }),
  })
  if (!res.ok) return []
  const results = (await res.json()) as any[]
  return results
    .filter((r) => r.document)
    .map((r) => ({
      id: docId(r.document.name as string),
      data: decodeFields(r.document.fields ?? {}),
    }))
}
